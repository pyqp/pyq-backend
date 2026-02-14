import request from 'supertest';
import app from '../../app';
import User from '../../models/User.model';
import Exam from '../../models/Exam.model';
import MockTest from '../../models/MockTest.model';
import Question from '../../models/Question.model';
import jwt from 'jsonwebtoken';
import { mockUserData } from '../mocks/user.mock';
import { mockExamData, mockTestData, mockQuestionData } from '../mocks/mockTest.mock';

const getToken = (userId: string) =>
  jwt.sign({ id: userId, role: 'user' }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });

describe('MockTest Integration: Browse → Start → Submit Flow', () => {
  let user: any, token: string, mockTest: any, exam: any;

  beforeEach(async () => {
    user     = await User.create({ ...mockUserData, 'credits.total': 5, 'credits.batches': [{ batchId: 'B1', packageName: 'Test', creditsReceived: 5, creditsUsed: 0, creditsRemaining: 5, purchaseDate: new Date(), expiryDate: new Date(Date.now() + 365 * 86400000), status: 'active' }] });
    token    = getToken(user._id.toString());
    exam     = await Exam.create(mockExamData);
    mockTest = await MockTest.create({ ...mockTestData, exam: exam._id, totalQuestions: 1 });
    await Question.create({ ...mockQuestionData, exam: exam._id, mockTests: [mockTest._id] });
  });

  it('should list available mock tests', async () => {
    const res = await request(app).get('/api/v1/mock-tests');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should get mock test detail', async () => {
    const res = await request(app).get(`/api/v1/mock-tests/${mockTest._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(mockTest._id.toString());
  });

  it('should reject start without auth', async () => {
    const res = await request(app).post(`/api/v1/mock-tests/${mockTest._id}/start`);
    expect(res.status).toBe(401);
  });
});