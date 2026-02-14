import mongoose, { Schema, Document } from 'mongoose';

export interface ITestAttempt {
  user: mongoose.Types.ObjectId;
  mockTest: mongoose.Types.ObjectId;
  attemptNumber: number;
  startTime: Date;
  endTime?: Date;
  timeTaken?: number; // in minutes
  status: 'ongoing' | 'submitted' | 'reviewed';
  responses: Array<{
    questionNumber: number;
    question: mongoose.Types.ObjectId;
    userAnswer?: number;
    correctAnswer: number;
    isCorrect?: boolean;
    timeSpent: number; // in seconds
    markedForReview: boolean;
    marks: number;
  }>;
  totalScore: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalUnattempted: number;
  accuracy: number;
}

export interface ITestAttemptDocument extends ITestAttempt, Document {
  createdAt: Date;
  updatedAt: Date;
}

const testAttemptSchema = new Schema<ITestAttemptDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mockTest: {
      type: Schema.Types.ObjectId,
      ref: 'MockTest',
      required: true,
      index: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: Date,
    timeTaken: Number,
    status: {
      type: String,
      enum: ['ongoing', 'submitted', 'reviewed'],
      default: 'ongoing',
    },
    responses: {
      type: [
        {
          questionNumber: { type: Number, required: true },
          question: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
          userAnswer: Number,
          correctAnswer: { type: Number, required: true },
          isCorrect: Boolean,
          timeSpent: { type: Number, default: 0 },
          markedForReview: { type: Boolean, default: false },
          marks: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    totalCorrect: {
      type: Number,
      default: 0,
    },
    totalIncorrect: {
      type: Number,
      default: 0,
    },
    totalUnattempted: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
testAttemptSchema.index({ user: 1, mockTest: 1 });
testAttemptSchema.index({ user: 1, status: 1 });
testAttemptSchema.index({ mockTest: 1, status: 1 });
testAttemptSchema.index({ createdAt: -1 });

// Compound index for unique attempt per user per test
testAttemptSchema.index({ user: 1, mockTest: 1, attemptNumber: 1 }, { unique: true });

const TestAttempt = mongoose.model<ITestAttemptDocument>('TestAttempt', testAttemptSchema);

export default TestAttempt;