import mongoose, { Schema, Document } from 'mongoose';

export interface IPYQ {
  exam: mongoose.Types.ObjectId;
  year: number;
  shift?: string;
  title: string;
  slug: string;
  totalQuestions: number;
  duration: number;
  subjects: string[];
  pdfUrl?: string;
  isActive: boolean;
  isPaid: boolean;
  creditsRequired: number;
  downloadCount: number;
  viewCount: number;
  tags: string[];
}

export interface IPYQDocument extends IPYQ, Document {
  createdAt: Date;
  updatedAt: Date;
}

const pyqSchema = new Schema<IPYQDocument>(
  {
    exam:           { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    year:           { type: Number, required: true, min: 2000, max: new Date().getFullYear() },
    shift:          { type: String, trim: true },
    title:          { type: String, required: true, trim: true, maxlength: 200 },
    slug:           { type: String, required: true, unique: true, lowercase: true },
    totalQuestions: { type: Number, required: true, min: 1 },
    duration:       { type: Number, required: true, min: 1 },
    subjects:       { type: [String], default: [] },
    pdfUrl:         String,
    isActive:       { type: Boolean, default: true },
    isPaid:         { type: Boolean, default: false },
    creditsRequired:{ type: Number, default: 0 },
    downloadCount:  { type: Number, default: 0 },
    viewCount:      { type: Number, default: 0 },
    tags:           { type: [String], default: [] },
  },
  { timestamps: true }
);

pyqSchema.index({ exam: 1, year: -1 });
pyqSchema.index({ slug: 1 });
pyqSchema.index({ isActive: 1 });

const PYQ = mongoose.model<IPYQDocument>('PYQ', pyqSchema);
export default PYQ;