import mongoose, { Document, Schema } from 'mongoose';

export interface IFAQ extends Document {
  _id: mongoose.Types.ObjectId;
  question: string;
  answer: string;
  department: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isSuggested?: boolean;
}

const faqSchema = new Schema<IFAQ>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      enum: ['it', 'hr', 'admin'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isSuggested: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
faqSchema.index({ department: 1 });

export const FAQ = mongoose.model<IFAQ>('FAQ', faqSchema); 