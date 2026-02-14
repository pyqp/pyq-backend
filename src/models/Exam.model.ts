import mongoose, { Schema, Document } from 'mongoose';

export interface IExam {
  name: string;
  shortName: string;
  category: string;
  description: string;
  logo?: string;
  conductedBy: string;
  examLevel: 'national' | 'state' | 'university' | 'other';
  examMode: 'online' | 'offline' | 'both';
  frequency: 'yearly' | 'half-yearly' | 'quarterly' | 'monthly';
  eligibility: {
    minimumAge?: number;
    maximumAge?: number;
    qualification: string;
    otherCriteria?: string;
  };
  examPattern: {
    totalMarks: number;
    duration: number; // in minutes
    sections: Array<{
      name: string;
      subjects: string[];
      questionsCount: number;
      marksPerQuestion: number;
      negativeMarking?: number;
    }>;
    totalQuestions: number;
  };
  syllabus: string[];
  importantDates?: {
    applicationStart?: Date;
    applicationEnd?: Date;
    examDate?: Date;
    resultDate?: Date;
  };
  officialWebsite?: string;
  isActive: boolean;
  isPremium: boolean;
  popularity: number;
  mockTestsAvailable: number;
  pyqYearsAvailable: number[];
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  slug: string;
}

export interface IExamDocument extends IExam, Document {
  createdAt: Date;
  updatedAt: Date;
}

const examSchema = new Schema<IExamDocument>(
  {
    name: {
      type: String,
      required: [true, 'Please provide exam name'],
      trim: true,
      unique: true,
    },
    shortName: {
      type: String,
      required: [true, 'Please provide short name'],
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please provide category'],
      enum: [
        'SSC',
        'Railway',
        'UPSC',
        'Banking',
        'Defence',
        'State PSC',
        'Teaching',
        'Police',
        'Engineering',
        'Medical',
        'Law',
        'MBA',
        'University',
        'Other',
      ],
    },
    description: {
      type: String,
      required: [true, 'Please provide description'],
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    logo: {
      type: String,
    },
    conductedBy: {
      type: String,
      required: [true, 'Please provide conducting authority'],
    },
    examLevel: {
      type: String,
      enum: ['national', 'state', 'university', 'other'],
      default: 'national',
    },
    examMode: {
      type: String,
      enum: ['online', 'offline', 'both'],
      default: 'online',
    },
    frequency: {
      type: String,
      enum: ['yearly', 'half-yearly', 'quarterly', 'monthly'],
      default: 'yearly',
    },
    eligibility: {
      minimumAge: Number,
      maximumAge: Number,
      qualification: {
        type: String,
        required: true,
      },
      otherCriteria: String,
    },
    examPattern: {
      totalMarks: {
        type: Number,
        required: true,
      },
      duration: {
        type: Number,
        required: true,
      },
      sections: [
        {
          name: String,
          subjects: [String],
          questionsCount: Number,
          marksPerQuestion: Number,
          negativeMarking: Number,
        },
      ],
      totalQuestions: {
        type: Number,
        required: true,
      },
    },
    syllabus: {
      type: [String],
      default: [],
    },
    importantDates: {
      applicationStart: Date,
      applicationEnd: Date,
      examDate: Date,
      resultDate: Date,
    },
    officialWebsite: {
      type: String,
      match: [/^https?:\/\/.+/, 'Please provide a valid URL'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    popularity: {
      type: Number,
      default: 0,
      min: 0,
    },
    mockTestsAvailable: {
      type: Number,
      default: 0,
    },
    pyqYearsAvailable: {
      type: [Number],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    metaTitle: String,
    metaDescription: String,
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
examSchema.index({ name: 1 });
examSchema.index({ category: 1 });
examSchema.index({ slug: 1 });
examSchema.index({ isActive: 1 });
examSchema.index({ popularity: -1 });
examSchema.index({ tags: 1 });
examSchema.index({ 'examPattern.totalMarks': 1 });

// Text search index
examSchema.index({
  name: 'text',
  shortName: 'text',
  description: 'text',
  tags: 'text',
});

// Pre-save middleware to generate slug
examSchema.pre('save', function (next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Virtual for full exam info
examSchema.virtual('fullInfo').get(function () {
  return {
    name: this.name,
    shortName: this.shortName,
    category: this.category,
    conductedBy: this.conductedBy,
    totalMarks: this.examPattern.totalMarks,
    duration: this.examPattern.duration,
  };
});

const Exam = mongoose.model<IExamDocument>('Exam', examSchema);

export default Exam;