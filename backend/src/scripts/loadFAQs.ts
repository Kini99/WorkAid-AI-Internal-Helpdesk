import mongoose from 'mongoose';
import { FAQ, IFAQ } from '../models/FAQ';
import { aiService } from '../services/ai.service';
import { cacheService } from '../services/cache.service';

// Load environment variables from backend/.env
import dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../../.env' });

async function loadFAQs() {
  try {
    // Connect to MongoDB (ensure MONGODB_URI is set in your backend/.env)
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workaid');
    console.log('Connected to MongoDB');

    // Fetch all FAQs from the database
    const faqs: IFAQ[] = await FAQ.find({}).lean();
    console.log(`Found ${faqs.length} FAQs in MongoDB.`);

    if (faqs.length === 0) {
      console.log('No FAQs to load into ChromaDB.');
      return;
    }

    // Add each FAQ to the 'faqs' collection in ChromaDB
    console.log('Loading FAQs into ChromaDB...');
    for (const faq of faqs) {
      await aiService.addFaqToVectorStore(faq);
    }

    console.log('All FAQs loaded into ChromaDB successfully!');

    // Clear the cache after loading new data
    await cacheService.clear();
    console.log('Cache cleared.');

  } catch (error) {
    console.error('Error loading FAQs into ChromaDB:', error);
    process.exit(1);
  } finally {
    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
loadFAQs(); 