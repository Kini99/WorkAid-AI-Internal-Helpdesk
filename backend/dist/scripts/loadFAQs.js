"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const FAQ_1 = require("../models/FAQ");
const ai_service_1 = require("../services/ai.service");
const cache_service_1 = require("../services/cache.service");
// Load environment variables from backend/.env
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: __dirname + '/../../.env' });
function loadFAQs() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connect to MongoDB (ensure MONGODB_URI is set in your backend/.env)
            yield mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workaid');
            // Fetch all FAQs from the database
            const faqs = yield FAQ_1.FAQ.find({}).lean();
            if (faqs.length === 0) {
                console.log('No FAQs found in the database');
                return;
            }
            console.log(`Loading ${faqs.length} FAQs into vector store...`);
            // Add each FAQ to the vector store
            for (const faq of faqs) {
                yield ai_service_1.aiService.addFaqToVectorStore(faq);
                console.log(`Loaded FAQ: ${faq.question}`);
            }
            // Clear the cache after loading new data
            yield cache_service_1.cacheService.clear();
            console.log('Successfully loaded all FAQs into vector store');
        }
        catch (error) {
            console.error('Error loading FAQs into vector store:', error);
            process.exit(1);
        }
        finally {
            // Disconnect from MongoDB
            yield mongoose_1.default.disconnect();
            console.log('Disconnected from MongoDB');
        }
    });
}
// Run the script
loadFAQs().catch(console.error);
