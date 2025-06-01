import mongoose, { Schema, Document } from 'mongoose';

export interface IChatHistory extends Document {
  userId: mongoose.Types.ObjectId;
  question: string;
  response: string;
  timestamp: Date;
  wasHelpful?: boolean;
}

const ChatHistorySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  wasHelpful: {
    type: Boolean,
    default: null
  }
});

export default mongoose.model<IChatHistory>('ChatHistory', ChatHistorySchema); 