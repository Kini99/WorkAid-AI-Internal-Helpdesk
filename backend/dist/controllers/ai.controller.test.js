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
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const ai_1 = __importDefault(require("../routes/ai"));
const ai_service_1 = require("../services/ai.service");
jest.mock('../middleware/auth', () => ({
    auth: (req, res, next) => next()
}));
jest.mock('../services/ai.service');
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/ai', ai_1.default);
describe('AI Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should generate an AI answer', () => __awaiter(void 0, void 0, void 0, function* () {
        ai_service_1.aiService.generateResponse.mockResolvedValue('Test AI answer');
        const res = yield (0, supertest_1.default)(app)
            .post('/api/ai/answer')
            .send({ question: 'What is the HR policy?' });
        expect(res.status).toBe(200);
        expect(res.body.answer).toBe('Test AI answer');
    }));
    it('should add documents to the knowledge base', () => __awaiter(void 0, void 0, void 0, function* () {
        ai_service_1.aiService.addToVectorStore.mockResolvedValue(undefined);
        const res = yield (0, supertest_1.default)(app)
            .post('/api/ai/knowledge-base')
            .send({ documents: ['doc1'], metadatas: [{}] });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Documents added successfully');
    }));
    it('should search the knowledge base', () => __awaiter(void 0, void 0, void 0, function* () {
        ai_service_1.aiService.searchVectorStore.mockResolvedValue({ results: ['doc1'] });
        const res = yield (0, supertest_1.default)(app)
            .post('/api/ai/knowledge-base/search')
            .send({ query: 'policy', limit: 1 });
        expect(res.status).toBe(200);
        expect(res.body.results).toBeDefined();
    }));
});
