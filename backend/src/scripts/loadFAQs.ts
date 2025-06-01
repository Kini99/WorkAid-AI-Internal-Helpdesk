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
      return;
    }

    // Add each FAQ to the 'faqs' collection in ChromaDB
    for (const faq of faqs) {
      await aiService.addFaqToVectorStore(faq);
    }

    // Clear the cache after loading new data
    await cacheService.clear();

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