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
exports.updateFaq = exports.createFaq = exports.getFaqs = void 0;
const FAQ_1 = require("../models/FAQ");
const User_1 = require("../models/User");
const ai_service_1 = require("../services/ai.service");
const getFaqs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const query = user.role === 'agent' ? { department: user.department } : {};
        const faqs = yield FAQ_1.FAQ.find(query)
            .populate('createdBy', 'firstName lastName email')
            .lean();
        res.json(faqs);
    }
    catch (error) {
        console.error('Get FAQs error:', error);
        res.status(500).json({ message: 'Failed to fetch FAQs' });
    }
});
exports.getFaqs = getFaqs;
const createFaq = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { question, answer } = req.body;
        const user = yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Only agents can create FAQs
        if (user.role !== 'agent') {
            return res.status(403).json({ message: 'Only agents can create FAQs' });
        }
        const faq = new FAQ_1.FAQ({
            question,
            answer,
            department: user.department,
            createdBy: user._id,
        });
        yield faq.save();
        // Add the newly created FAQ to ChromaDB
        yield ai_service_1.aiService.addFaqToVectorStore(faq);
        // Populate user details
        yield faq.populate('createdBy', 'firstName lastName email');
        res.status(201).json(faq);
    }
    catch (error) {
        console.error('Create FAQ error:', error);
        res.status(500).json({ message: 'Failed to create FAQ' });
    }
});
exports.createFaq = createFaq;
const updateFaq = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { question, answer, isSuggested } = req.body;
        const user = yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Only agents can update FAQs
        if (user.role !== 'agent') {
            return res.status(403).json({ message: 'Only agents can update FAQs' });
        }
        const faq = yield FAQ_1.FAQ.findOneAndUpdate({ _id: id, department: user.department }, {
            question,
            answer,
            isSuggested,
            updatedAt: new Date()
        }, {
            new: true,
            runValidators: true
        }).populate('createdBy', 'firstName lastName email');
        if (!faq) {
            return res.status(404).json({ message: 'FAQ not found or not in your department' });
        }
        res.json(faq);
    }
    catch (error) {
        console.error('Update FAQ error:', error);
        res.status(500).json({ message: 'Failed to update FAQ' });
    }
});
exports.updateFaq = updateFaq;
