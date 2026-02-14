import mongoose, { Schema, Document } from 'mongoose';

export interface IUserResponse {
  user: mongoose.Types.ObjectId;
  question: mongoose.Types.ObjectId;
  testAttempt: mongoose.Types.ObjectId;
  mockTest: mongoose.Types.ObjectId;
  userAnswer?: number;
  correctAnswer: number;
  isCorrect: boolean;
  isAttempted: boolean;
  markedForReview: boolean;
  timeSpent: number;
  marksAwarded: number;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface IUserResponseDocument extends IUserResponse, Document {
  createdAt: Date;
}

const userResponseSchema = new Schema<IUserResponseDocument>(
  {
    user:         { type: Schema.Types.ObjectId, ref: 'User',        required: true, index: true },
    question:     { type: Schema.Types.ObjectId, ref: 'Question',    required: true },
    testAttempt:  { type: Schema.Types.ObjectId, ref: 'TestAttempt', required: true, index: true },
    mockTest:     { type: Schema.Types.ObjectId, ref: 'MockTest',    required: true, index: true },
    userAnswer:   { type: Number, min: 0 },
    correctAnswer:{ type: Number, required: true },
    isCorrect:    { type: Boolean, default: false },
    isAttempted:  { type: Boolean, default: false },
    markedForReview: { type: Boolean, default: false },
    timeSpent:    { type: Number, default: 0 },
    marksAwarded: { type: Number, default: 0 },
    subject:      { type: String, required: true, index: true },
    topic:        { type: String, required: true },
    difficulty:   { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

userResponseSchema.index({ user: 1, subject: 1 });
userResponseSchema.index({ user: 1, topic: 1 });
userResponseSchema.index({ user: 1, difficulty: 1 });
userResponseSchema.index({ question: 1, isCorrect: 1 });

const UserResponse = mongoose.model<IUserResponseDocument>('UserResponse', userResponseSchema);
export default UserResponse;