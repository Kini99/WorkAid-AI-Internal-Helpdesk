import { Document, Types } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category?: string;
  department: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
} 