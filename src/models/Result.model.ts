import mongoose, { Schema, Document } from 'mongoose';

export interface IResult {
  user: mongoose.Types.ObjectId;
  mockTest: mongoose.Types.ObjectId;
  testAttempt: mongoose.Types.ObjectId;
  attemptNumber: number;
  
  // Overall Performance
  finalScore: number;
  totalMarks: number;
  percentage: number;
  
  // Ranking (LOCKED on first attempt)
  rank?: number;
  isFirstAttempt: boolean;
  rankLocked: boolean;
  totalParticipants: number;
  percentile: number;
  
  // Question Stats
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number;
  
  // Time Analysis
  timeTaken: number; // minutes
  totalTime: number;
  timeEfficiency: number;
  avgTimePerQuestion: number;
  
  // Subject-wise Performance
  subjectPerformance: any[];
  
  // Difficulty Analysis
  difficultyPerformance: {
    easy:   { total: number; attempted: number; correct: number; accuracy: number };
    medium: { total: number; attempted: number; correct: number; accuracy: number };
    hard:   { total: number; attempted: number; correct: number; accuracy: number };
  };
  
  // Comparison Data
  comparison: {
    averageScore: number;
    topScore: number;
    top10Cutoff: number;
    aboveAverage: number;
    gapToTop10: number;
  };
  
  // Strengths & Weaknesses
  strengths: string[];
  weaknesses: any[];
  
  // Question-wise Details
  questionAnalysis: any[];
  
  // Report URLs
  scorecardPdfUrl?: string;
  detailedReportUrl?: string;
}

export interface IResultDocument extends IResult, Document {
  createdAt: Date;
  updatedAt: Date;
}

const resultSchema = new Schema<IResultDocument>(
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
    testAttempt: {
      type: Schema.Types.ObjectId,
      ref: 'TestAttempt',
      required: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
    },
    
    // Overall Performance
    finalScore: {
      type: Number,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    
    // Ranking
    rank: Number,
    isFirstAttempt: {
      type: Boolean,
      default: true,
    },
    rankLocked: {
      type: Boolean,
      default: false,
    },
    totalParticipants: {
      type: Number,
      default: 0,
    },
    percentile: {
      type: Number,
      default: 0,
    },
    
    // Question Stats
    correct: {
      type: Number,
      required: true,
    },
    incorrect: {
      type: Number,
      required: true,
    },
    unattempted: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      required: true,
    },
    
    // Time Analysis
    timeTaken: {
      type: Number,
      required: true,
    },
    totalTime: {
      type: Number,
      required: true,
    },
    timeEfficiency: {
      type: Number,
      default: 0,
    },
    avgTimePerQuestion: {
      type: Number,
      default: 0,
    },
    
    // Subject-wise Performance
    subjectPerformance: {
      type: Schema.Types.Mixed,
      default: [],
    },
    
    // Difficulty Analysis
    difficultyPerformance: {
      type: Schema.Types.Mixed,
      default: {},
    },
    
    // Comparison Data
    comparison: {
      type: Schema.Types.Mixed,
      default: {},
    },
    
    // Strengths & Weaknesses
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: Schema.Types.Mixed,
      default: [],
    },
    
    // Question-wise Details
    questionAnalysis: {
      type: Schema.Types.Mixed,
      default: [],
    },
    
    // Report URLs
    scorecardPdfUrl: String,
    detailedReportUrl: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
resultSchema.index({ user: 1, mockTest: 1 });
resultSchema.index({ mockTest: 1, finalScore: -1 });
resultSchema.index({ user: 1, createdAt: -1 });
resultSchema.index({ rank: 1 });
resultSchema.index({ isFirstAttempt: 1, rankLocked: 1 });

const Result = mongoose.model<IResultDocument>('Result', resultSchema);

export default Result;