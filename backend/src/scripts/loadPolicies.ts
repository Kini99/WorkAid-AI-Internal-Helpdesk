import fs from 'fs';
import path from 'path';
import { aiService } from '../services/ai.service';

async function loadPolicies() {
  try {
    const policiesDir = path.join(__dirname, '../../policyDocuments');
    const policyFiles = ['AdminPolicy.txt', 'HRPolicy.txt', 'ITPolicy.txt'];
    
    const documents: string[] = [];
    const metadatas: any[] = [];

    for (const file of policyFiles) {
      const content = fs.readFileSync(path.join(policiesDir, file), 'utf-8');
      const policyType = file.replace('Policy.txt', '').toLowerCase();
      
      // Split content into sections for better retrieval
      const sections = content.split('\n\n').filter(section => section.trim());
      
      sections.forEach((section, index) => {
        documents.push(section);
        metadatas.push({
          source: file,
          policyType,
          sectionIndex: index,
          timestamp: new Date().toISOString()
        });
      });
    }

    console.log(`Loading ${documents.length} policy sections into vector store...`);
    
    // Add each policy section to the vector store
    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];
      const metadata = metadatas[i];
      
      await aiService.addToVectorStore('policies', [document], [metadata]);
      console.log(`Loaded policy section ${i + 1}/${documents.length}`);
    }
    
    console.log('Policy documents loaded successfully!');
  } catch (error) {
    console.error('Error loading policies:', error);
    process.exit(1);
  }
}

// Run the script
loadPolicies().catch(console.error); 