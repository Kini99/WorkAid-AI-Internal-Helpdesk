import { ChromaClient } from 'chromadb';
import { Index } from '@upstash/vector';
import { AI_CONFIG } from '../config/ai.config';
import { aiService } from '../services/ai.service';

async function migrateToUpstash() {
  try {
    // Initialize old ChromaDB client
    const oldClient = new ChromaClient({
      path: './chroma_db' // Your old local path
    });

    // Initialize new Upstash client
    const newClient = new Index({
      url: AI_CONFIG.UPSTASH_VECTOR_URL!,
      token: AI_CONFIG.UPSTASH_VECTOR_TOKEN!,
    });

    // Collections to migrate
    const collections = ['policies', 'tickets', 'faqs'];

    for (const collectionName of collections) {
      try {
        console.log(`Migrating ${collectionName} collection...`);

        // Get data from old collection
        const oldCollection = await oldClient.getCollection(collectionName);
        const data = await oldCollection.get();

        // Migrate each document
        for (let i = 0; i < data.ids.length; i++) {
          const id = data.ids[i];
          const document = data.documents[i];
          const metadata = data.metadatas[i];

          // Get embedding for the document
          const vector = await aiService.getEmbedding(document);

          // Add to new collection
          await newClient.upsert({
            id,
            vector,
            metadata
          });

          console.log(`Migrated document ${id} in ${collectionName}`);
        }

        console.log(`Successfully migrated ${collectionName} collection`);
      } catch (error) {
        console.error(`Error migrating ${collectionName} collection:`, error);
      }
    }

    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateToUpstash().catch(console.error); 