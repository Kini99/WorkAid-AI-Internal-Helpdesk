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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ai_service_1 = require("../services/ai.service");
function loadPolicies() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const policiesDir = path_1.default.join(__dirname, '../../policyDocuments');
            const policyFiles = ['AdminPolicy.txt', 'HRPolicy.txt', 'ITPolicy.txt'];
            const documents = [];
            const metadatas = [];
            for (const file of policyFiles) {
                const content = fs_1.default.readFileSync(path_1.default.join(policiesDir, file), 'utf-8');
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
                yield ai_service_1.aiService.addToVectorStore('policies', [document], [metadata]);
                console.log(`Loaded policy section ${i + 1}/${documents.length}`);
            }
            console.log('Policy documents loaded successfully!');
        }
        catch (error) {
            console.error('Error loading policies:', error);
            process.exit(1);
        }
    });
}
// Run the script
loadPolicies().catch(console.error);
