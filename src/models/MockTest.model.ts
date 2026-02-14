import mongoose, { Schema, Document } from 'mongoose';

export interface IMockTest {
  name: string;
  slug: string;
  exam: mongoose.Types.ObjectId;
  description: string;
  duration: number; // in minutes
  totalMarks: number;
  totalQuestions: number;
  questions: mongoose.Types.ObjectId[];
  difficulty: 'easy' | 'medium' | 'hard';
  creditsRequired: number;
  isPaid: boolean;
  isActive: boolean;
  instructions: string[];
  subjects: Array<{
    name: string;
    totalQuestions: number;
    totalMarks: number;
  }>;
  attemptCount: number;
  averageScore: number;
  publishDate?: Date;
}

export interface IMockTestDocument extends IMockTest, Document {
  createdAt: Date;
  updatedAt: Date;
}

const mockTestSchema = new Schema<IMockTestDocument>(
  {
    name: {
      type: String,
      required: [true, 'Mock test name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    exam: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: 1,
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks is required'],
      min: 1,
    },
    totalQuestions: {
      type: Number,
      required: [true, 'Total questions is required'],
      min: 1,
    },
    questions: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
      required: true,
      validate: {
        validator: function (questions: mongoose.Types.ObjectId[]) {
          return questions.length === this.totalQuestions;
        },
        message: 'Questions count must match totalQuestions',
      },
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    creditsRequired: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    isPaid: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    instructions: {
      type: [String],
      default: [
        'Read all questions carefully before answering',
        'Each question carries equal marks',
        'There is negative marking for wrong answers',
        'You can mark questions for review',
        'Submit the test only after reviewing all questions',
      ],
    },
    subjects: {
      type: [
        {
          name: { type: String, required: true },
          totalQuestions: { type: Number, required: true },
          totalMarks: { type: Number, required: true },
        },
      ],
      default: [],
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    publishDate: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
mockTestSchema.index({ exam: 1 });
mockTestSchema.index({ slug: 1 });
mockTestSchema.index({ isActive: 1 });
mockTestSchema.index({ difficulty: 1 });
mockTestSchema.index({ isPaid: 1 });
mockTestSchema.index({ createdAt: -1 });

// Pre-save middleware to generate slug
mockTestSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

const MockTest = mongoose.model<IMockTestDocument>('MockTest', mockTestSchema);

export default MockTest;