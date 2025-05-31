import { config } from 'dotenv';

config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required in environment variables');
}

export const AI_CONFIG = {
  GEMINI_API_KEY,
  CHROMA_DB_PATH: process.env.CHROMA_DB_PATH || './chroma_db',
  VECTOR_DIMENSION: 768, // Default dimension for text embeddings
  MAX_TOKENS: 2048,
  TEMPERATURE: 0.7,
  TOP_K: 40,
  TOP_P: 0.95,
} as const; 