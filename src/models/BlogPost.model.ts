import mongoose, { Schema, Document } from 'mongoose';

export interface IBlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  author: mongoose.Types.ObjectId;
  category: 'exam_tips' | 'current_affairs' | 'strategy' | 'success_stories' | 'news' | 'general';
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  relatedExams: mongoose.Types.ObjectId[];
  views: number;
  readTimeMinutes: number;
  publishedAt?: Date;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

export interface IBlogPostDocument extends IBlogPost, Document {
  createdAt: Date;
  updatedAt: Date;
}

const blogPostSchema = new Schema<IBlogPostDocument>(
  {
    title:    { type: String, required: true, trim: true, maxlength: 200 },
    slug:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt:  { type: String, required: true, maxlength: 300 },
    content:  { type: String, required: true },
    coverImage: String,
    author:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['exam_tips', 'current_affairs', 'strategy', 'success_stories', 'news', 'general'],
      default: 'general',
    },
    tags:         { type: [String], default: [] },
    status:       { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    relatedExams: { type: [{ type: Schema.Types.ObjectId, ref: 'Exam' }], default: [] },
    views:        { type: Number, default: 0 },
    readTimeMinutes: { type: Number, default: 5 },
    publishedAt:  Date,
    seo: {
      metaTitle:       String,
      metaDescription: String,
      keywords:        [String],
    },
  },
  { timestamps: true }
);

blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ category: 1, status: 1 });
blogPostSchema.index({ tags: 1 });

const BlogPost = mongoose.model<IBlogPostDocument>('BlogPost', blogPostSchema);
export default BlogPost;