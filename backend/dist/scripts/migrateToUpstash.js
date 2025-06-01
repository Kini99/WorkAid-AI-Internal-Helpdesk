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
Object.defineProperty(exports, "__esModule", { value: true });
const chromadb_1 = require("chromadb");
const vector_1 = require("@upstash/vector");
const ai_config_1 = require("../config/ai.config");
const ai_service_1 = require("../services/ai.service");
function migrateToUpstash() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Initialize old ChromaDB client
            const oldClient = new chromadb_1.ChromaClient({
                path: './chroma_db' // Your old local path
            });
            // Initialize new Upstash client
            const newClient = new vector_1.Index({
                url: ai_config_1.AI_CONFIG.UPSTASH_VECTOR_URL,
                token: ai_config_1.AI_CONFIG.UPSTASH_VECTOR_TOKEN,
            });
            // Collections to migrate
            const collections = ['policies', 'tickets', 'faqs'];
            for (const collectionName of collections) {
                try {
                    console.log(`Migrating ${collectionName} collection...`);
                    yield migrateCollection(collectionName, oldClient, newClient);
                    console.log(`Successfully migrated ${collectionName} collection`);
                }
                catch (error) {
                    console.error(`Error migrating ${collectionName} collection:`, error);
                }
            }
            console.log('Migration completed');
        }
        catch (error) {
            console.error('Migration failed:', error);
            process.exit(1);
        }
    });
}
function migrateCollection(collectionName, oldClient, newClient) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const oldCollection = yield oldClient.getCollection({ name: collectionName });
            const documents = yield oldCollection.list();
            for (const doc of documents) {
                const document = yield oldCollection.get(doc.id);
                if (document) {
                    const vector = yield ai_service_1.aiService.getEmbedding(document.content || '');
                    yield newClient.upsert({
                        id: doc.id,
                        vector,
                        metadata: document.metadata || {}
                    });
                }
            }
        }
        catch (error) {
            console.error(`Error migrating collection ${collectionName}:`, error);
        }
    });
}
// Run migration
migrateToUpstash().catch(console.error);
