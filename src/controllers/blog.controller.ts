import { Response } from 'express';
import BlogPost from '../models/BlogPost.model';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types';

export const getAllPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { category, tag, page = '1', limit = '10' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const query: any = { status: 'published' };
  if (category) query.category = category;
  if (tag)      query.tags     = tag;

  const [posts, total] = await Promise.all([
    BlogPost.find(query)
      .populate('author', 'name avatar')
      .sort('-publishedAt')
      .skip((pageNum - 1) * limitNum).limit(limitNum)
      .select('-content'),
    BlogPost.countDocuments(query),
  ]);
  ApiResponse.paginated(res, posts, pageNum, limitNum, total, 'Posts fetched');
});

export const getPostBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
  const post = await BlogPost.findOne({ slug: req.params.slug, status: 'published' })
    .populate('author', 'name avatar')
    .populate('relatedExams', 'name shortName');
  if (!post) throw new ApiError('Post not found', 404);
  await BlogPost.findByIdAndUpdate(post._id, { $inc: { views: 1 } });
  ApiResponse.success(res, post, 'Post fetched successfully');
});

export const createPost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const post = await BlogPost.create({ ...req.body, author: req.user!._id });
  ApiResponse.success(res, post, 'Post created successfully', 201);
});

export const updatePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const update: any = { ...req.body };
  if (req.body.status === 'published' && !req.body.publishedAt) {
    update.publishedAt = new Date();
  }
  const post = await BlogPost.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!post) throw new ApiError('Post not found', 404);
  ApiResponse.success(res, post, 'Post updated successfully');
});

export const deletePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  await BlogPost.findByIdAndUpdate(req.params.id, { status: 'archived' });
  ApiResponse.success(res, null, 'Post archived successfully');
});

export default { getAllPosts, getPostBySlug, createPost, updatePost, deletePost };