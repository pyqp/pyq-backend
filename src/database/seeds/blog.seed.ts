import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BlogPost from '../../models/BlogPost.model';
import User from '../../models/User.model';
import logger from '../../utils/logger';

dotenv.config();

const seedBlogPosts = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) { logger.error('Admin not found — run admin.seed.ts first'); await mongoose.disconnect(); return; }

  const posts = [
    {
      title: 'How to Crack UPSC CSE in First Attempt: Complete Strategy Guide',
      slug: 'how-to-crack-upsc-cse-first-attempt',
      excerpt: 'A comprehensive strategy guide for UPSC Civil Services Examination aspirants covering study plan, resources, and tips.',
      content: '<h2>Introduction</h2><p>Cracking UPSC CSE in the first attempt requires strategic preparation...</p><h2>Study Plan</h2><p>Divide your preparation into phases...</p>',
      author: admin._id,
      category: 'strategy',
      tags: ['UPSC', 'CSE', 'strategy', 'first attempt'],
      status: 'published',
      publishedAt: new Date(),
      readTimeMinutes: 8,
      seo: { metaTitle: 'UPSC CSE First Attempt Strategy', metaDescription: 'Complete guide to crack UPSC in first attempt.' },
    },
    {
      title: 'SSC CGL 2024: Notification, Syllabus, and Preparation Tips',
      slug: 'ssc-cgl-2024-complete-guide',
      excerpt: 'Everything you need to know about SSC CGL 2024 — from notification dates to complete syllabus and best preparation strategies.',
      content: '<h2>SSC CGL 2024 Overview</h2><p>The Staff Selection Commission Combined Graduate Level examination...</p>',
      author: admin._id,
      category: 'exam_tips',
      tags: ['SSC', 'CGL', '2024', 'syllabus'],
      status: 'published',
      publishedAt: new Date(),
      readTimeMinutes: 6,
      seo: { metaTitle: 'SSC CGL 2024 Complete Guide', metaDescription: 'Complete SSC CGL 2024 guide with syllabus and tips.' },
    },
    {
      title: 'Top 10 Current Affairs Topics for Government Exams 2024',
      slug: 'top-current-affairs-government-exams-2024',
      excerpt: 'Must-know current affairs topics that are highly important for UPSC, SSC, Banking, and other government exams in 2024.',
      content: '<h2>Why Current Affairs Matter</h2><p>Current affairs form a crucial part of almost every government exam...</p>',
      author: admin._id,
      category: 'current_affairs',
      tags: ['current affairs', '2024', 'government exams', 'GK'],
      status: 'published',
      publishedAt: new Date(),
      readTimeMinutes: 5,
    },
  ];

  await BlogPost.deleteMany({ slug: { $in: posts.map(p => p.slug) } });
  await BlogPost.insertMany(posts);
  logger.info(`✅ Seeded ${posts.length} blog posts`);
  await mongoose.disconnect();
};

seedBlogPosts().catch(err => { console.error(err); process.exit(1); });