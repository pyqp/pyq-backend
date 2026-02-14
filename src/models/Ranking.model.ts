import mongoose, { Schema, Document } from 'mongoose';

export interface IRanking {
  mockTest: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  result: mongoose.Types.ObjectId;
  rank: number;
  score: number;
  percentage: number;
  percentile: number;
  timeTaken: number;
  attemptNumber: number;
  isLocked: boolean;
  lockedAt?: Date;
}

export interface IRankingDocument extends IRanking, Document {
  createdAt: Date;
  updatedAt: Date;
}

const rankingSchema = new Schema<IRankingDocument>(
  {
    mockTest: {
      type: Schema.Types.ObjectId,
      ref: 'MockTest',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    result: {
      type: Schema.Types.ObjectId,
      ref: 'Result',
      required: true,
    },
    rank: {
      type: Number,
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    percentile: {
      type: Number,
      required: true,
    },
    timeTaken: {
      type: Number,
      required: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    isLocked: {
      type: Boolean,
      default: true,
    },
    lockedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
rankingSchema.index({ mockTest: 1, rank: 1 });
rankingSchema.index({ mockTest: 1, score: -1 });
rankingSchema.index({ user: 1, mockTest: 1 }, { unique: true });

const Ranking = mongoose.model<IRankingDocument>('Ranking', rankingSchema);

export default Ranking;