import { Response } from 'express';
import Contact from '../models/Contact.model';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types';

/**
 * @desc    Submit a contact / support form
 * @route   POST /api/v1/contact
 * @access  Public
 */
export const submitContact = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, phone, subject, category, message } = req.body;

  // Attach userId if logged in
  const userId = req.user?._id;

  // Auto-priority: payment + refund = high
  const autoPriority = ['payment', 'refund'].includes(category) ? 'high' : 'medium';

  const contact = await Contact.create({
    name, email, phone, subject, category, message,
    priority: autoPriority,
    userId: userId || undefined,
  });

  ApiResponse.success(res, {
    ticketId: contact._id,
    message:  'Your message has been received. We will get back to you within 24 hours.',
  }, 'Contact form submitted successfully', 201);
});

/**
 * @desc    Get all contact tickets (Admin)
 * @route   GET /api/v1/contact?status=&priority=&category=&page=
 * @access  Private/Admin
 */
export const getAllTickets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, priority, category, page = '1', limit = '20' } = req.query;
  const pageNum  = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip     = (pageNum - 1) * limitNum;

  const query: any = {};
  if (status)   query.status   = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;

  const tickets = await Contact.find(query)
    .populate('userId', 'name email')
    .populate('resolvedBy', 'name')
    .sort({ priority: -1, createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Contact.countDocuments(query);

  // Stats summary
  const stats = await Contact.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  ApiResponse.paginated(res, tickets, pageNum, limitNum, total,
    'Tickets fetched successfully',
    { stats: Object.fromEntries(stats.map((s: any) => [s._id, s.count])) }
  );
});

/**
 * @desc    Get single ticket (Admin)
 * @route   GET /api/v1/contact/:id
 * @access  Private/Admin
 */
export const getTicketById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const ticket = await Contact.findById(req.params.id)
    .populate('userId', 'name email phone credits.total')
    .populate('resolvedBy', 'name email');

  if (!ticket) throw new ApiError('Ticket not found', 404);
  ApiResponse.success(res, ticket, 'Ticket fetched successfully');
});

/**
 * @desc    Update ticket status / add admin note (Admin)
 * @route   PATCH /api/v1/contact/:id
 * @access  Private/Admin
 */
export const updateTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, priority, adminNote } = req.body;
  const ticket = await Contact.findById(req.params.id);
  if (!ticket) throw new ApiError('Ticket not found', 404);

  if (status)    ticket.status    = status;
  if (priority)  ticket.priority  = priority;
  if (adminNote) ticket.adminNote = adminNote;

  if (status === 'resolved' && ticket.status !== 'resolved') {
    ticket.resolvedAt  = new Date();
    ticket.resolvedBy  = req.user!._id as any;
  }

  await ticket.save();
  ApiResponse.success(res, ticket, 'Ticket updated successfully');
});

export default { submitContact, getAllTickets, getTicketById, updateTicket };