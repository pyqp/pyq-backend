import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  exam: mongoose.Types.ObjectId;
  questionText: string;
  questionImage?: string;
  options: Array<{
    text: string;
    image?: string;
  }>;
  correctOption: number;
  solution: {
    text: string;
    steps?: string[];
    formula?: string;
    relatedConcepts?: string[];
  };
  explanation: {
    correct: string;
    incorrect?: string[];
  };
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
  subTopic?: string;
  marks: number;
  negativeMarks: number;
  timeEstimate: number; // in seconds
  year?: number;
  examType: 'mock' | 'pyq' | 'practice';
  language: 'english' | 'hindi' | 'both';
  tags: string[];
  relatedQuestions?: mongoose.Types.ObjectId[];
  isActive: boolean;
  usageCount: number;
  correctAttempts: number;
  totalAttempts: number;
  accuracy: number;
  averageTimeSpent: number;
}

export interface IQuestionDocument extends IQuestion, Document {
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestionDocument>(
  {
    exam: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Please provide exam reference'],
    },
    questionText: {
      type: String,
      required: [true, 'Please provide question text'],
      trim: true,
    },
    questionImage: {
      type: String,
    },
    options: {
      type: [
        {
          text: {
            type: String,
            required: true,
          },
          image: String,
        },
      ],
      required: true,
      validate: {
        validator: function (v: any[]) {
          return v && v.length >= 2 && v.length <= 6;
        },
        message: 'Options must be between 2 and 6',
      },
    },
    correctOption: {
      type: Number,
      required: [true, 'Please provide correct option index'],
      min: [0, 'Correct option must be at least 0'],
      max: [5, 'Correct option cannot exceed 5'],
    },
    solution: {
      text: {
        type: String,
        required: [true, 'Please provide solution'],
      },
      steps: [String],
      formula: String,
      relatedConcepts: [String],
    },
    explanation: {
      correct: {
        type: String,
        required: [true, 'Please provide explanation for correct answer'],
      },
      incorrect: [String],
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: [true, 'Please provide difficulty level'],
    },
    subject: {
      type: String,
      required: [true, 'Please provide subject'],
      trim: true,
    },
    topic: {
      type: String,
      required: [true, 'Please provide topic'],
      trim: true,
    },
    subTopic: {
      type: String,
      trim: true,
    },
    marks: {
      type: Number,
      required: [true, 'Please provide marks'],
      default: 1,
      min: [0.25, 'Marks cannot be less than 0.25'],
    },
    negativeMarks: {
      type: Number,
      default: 0,
      min: [0, 'Negative marks cannot be negative'],
    },
    timeEstimate: {
      type: Number,
      default: 60, // 1 minute
      min: [10, 'Time estimate must be at least 10 seconds'],
    },
    year: {
      type: Number,
      min: [2000, 'Year cannot be before 2000'],
      max: [new Date().getFullYear(), 'Year cannot be in the future'],
    },
    examType: {
      type: String,
      enum: ['mock', 'pyq', 'practice'],
      default: 'practice',
    },
    language: {
      type: String,
      enum: ['english', 'hindi', 'both'],
      default: 'english',
    },
    tags: {
      type: [String],
      default: [],
    },
    relatedQuestions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    correctAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    averageTimeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
questionSchema.index({ exam: 1 });
questionSchema.index({ subject: 1 });
questionSchema.index({ topic: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ examType: 1 });
questionSchema.index({ year: -1 });
questionSchema.index({ isActive: 1 });
questionSchema.index({ accuracy: 1 });
questionSchema.index({ usageCount: -1 });
questionSchema.index({ tags: 1 });

// Compound indexes
questionSchema.index({ exam: 1, subject: 1, topic: 1 });
questionSchema.index({ exam: 1, difficulty: 1 });
questionSchema.index({ exam: 1, year: -1 });

// Text search index
questionSchema.index({
  questionText: 'text',
  'solution.text': 'text',
  tags: 'text',
});

// Pre-save middleware to update accuracy
questionSchema.pre('save', function (next) {
  if (this.totalAttempts > 0) {
    this.accuracy = Math.round((this.correctAttempts / this.totalAttempts) * 100);
  }
  next();
});

// Method to update statistics
questionSchema.methods.updateStats = function (
  isCorrect: boolean,
  timeSpent: number
): Promise<IQuestionDocument> {
  this.usageCount += 1;
  this.totalAttempts += 1;
  
  if (isCorrect) {
    this.correctAttempts += 1;
  }
  
  // Update average time spent
  this.averageTimeSpent =
    (this.averageTimeSpent * (this.totalAttempts - 1) + timeSpent) / this.totalAttempts;
  
  // Recalculate accuracy
  this.accuracy = Math.round((this.correctAttempts / this.totalAttempts) * 100);
  
  return this.save();
};

// Virtual for difficulty score (used for adaptive testing)
questionSchema.virtual('difficultyScore').get(function () {
  const baseScore = {
    easy: 1,
    medium: 2,
    hard: 3,
  };
  
  // Adjust based on accuracy (harder if accuracy is high)
  const accuracyFactor = 1 + (100 - this.accuracy) / 100;
  
  return baseScore[this.difficulty] * accuracyFactor;
});

const Question = mongoose.model<IQuestionDocument>('Question', questionSchema);

export default Question;