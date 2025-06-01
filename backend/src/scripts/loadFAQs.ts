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

    // Fetch all FAQs from the database
    const faqs: IFAQ[] = await FAQ.find({}).lean();

    if (faqs.length === 0) {
      console.log('No FAQs found in the database');
      return;
    }

    console.log(`Loading ${faqs.length} FAQs into vector store...`);

    // Add each FAQ to the vector store
    for (const faq of faqs) {
      await aiService.addFaqToVectorStore(faq);
      console.log(`Loaded FAQ: ${faq.question}`);
    }

    // Clear the cache after loading new data
    await cacheService.clear();
    console.log('Successfully loaded all FAQs into vector store');

  } catch (error) {
    console.error('Error loading FAQs into vector store:', error);
    process.exit(1);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
loadFAQs().catch(console.error); 