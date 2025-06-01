"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_config_1 = require("../config/auth.config");
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, auth_config_1.JWT_SECRET, { expiresIn: '15d' });
};
exports.generateToken = generateToken;
