import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  content: string;
  sender: mongoose.Types.ObjectId;
  isAISuggested?: boolean;
  createdAt: Date;
}

export interface ITicket extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  department: string;
  createdBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  content: {
    type: String,
    required: true,
    trim: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isAISuggested: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ticketSchema = new Schema<ITicket>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved'],
      default: 'open',
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
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
ticketSchema.index({ createdBy: 1, status: 1 });
ticketSchema.index({ department: 1, status: 1 });

export const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema); 