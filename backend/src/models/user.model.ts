import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'employee' | 'agent' | 'admin';
  department?: string;
  createdAt: Date;
  updatedAt: Date;
} 