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
exports.cacheService = void 0;
const redis_1 = require("@upstash/redis");
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
// Load environment variables from the correct path
(0, dotenv_1.config)({ path: path_1.default.join(__dirname, '../../.env') });
// Validate required environment variables
const UPSTASH_REDIS_URL = process.env.UPSTASH_REDIS_URL;
const UPSTASH_REDIS_TOKEN = process.env.UPSTASH_REDIS_TOKEN;
if (!UPSTASH_REDIS_URL || !UPSTASH_REDIS_TOKEN) {
    throw new Error('UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN must be set in environment variables');
}
class CacheService {
    constructor() {
        this.DEFAULT_TTL = 3600; // 1 hour in seconds
        this.redis = new redis_1.Redis({
            url: UPSTASH_REDIS_URL,
            token: UPSTASH_REDIS_TOKEN,
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.redis.get(key);
                return data ? JSON.parse(data) : null;
            }
            catch (error) {
                console.error('Cache get error:', error);
                return null;
            }
        });
    }
    set(key_1, value_1) {
        return __awaiter(this, arguments, void 0, function* (key, value, ttl = this.DEFAULT_TTL) {
            try {
                yield this.redis.set(key, JSON.stringify(value), { ex: ttl });
            }
            catch (error) {
                console.error('Cache set error:', error);
            }
        });
    }
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.redis.del(key);
            }
            catch (error) {
                console.error('Cache delete error:', error);
            }
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.redis.flushdb();
            }
            catch (error) {
                console.error('Cache clear error:', error);
            }
        });
    }
}
exports.cacheService = new CacheService();
