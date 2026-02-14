import mongoose, { Schema, Document } from 'mongoose';

export interface ICareer {
  title: string;
  slug: string;
  department: string;
  location: string;
  type: 'full_time' | 'part_time' | 'contract' | 'internship';
  description: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave?: string[];
  salaryRange?: { min: number; max: number; currency: string };
  applicationDeadline?: Date;
  status: 'open' | 'closed' | 'draft';
  applicantsCount: number;
}

export interface ICareerDocument extends ICareer, Document {
  createdAt: Date;
  updatedAt: Date;
}

const careerSchema = new Schema<ICareerDocument>(
  {
    title:       { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true },
    department:  { type: String, required: true, trim: true },
    location:    { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'internship'],
      default: 'full_time',
    },
    description:      { type: String, required: true },
    responsibilities: { type: [String], default: [] },
    requirements:     { type: [String], default: [] },
    niceToHave:       { type: [String], default: [] },
    salaryRange: {
      min:      Number,
      max:      Number,
      currency: { type: String, default: 'INR' },
    },
    applicationDeadline: Date,
    status:          { type: String, enum: ['open', 'closed', 'draft'], default: 'open', index: true },
    applicantsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

careerSchema.index({ status: 1, createdAt: -1 });

const Career = mongoose.model<ICareerDocument>('Career', careerSchema);
export default Career;