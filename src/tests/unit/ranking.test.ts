import request from 'supertest';
import app from '../../app';
import Ranking from '../../models/Ranking.model';
import User from '../../models/User.model';
import MockTest from '../../models/MockTest.model';
import Exam from '../../models/Exam.model';
import jwt from 'jsonwebtoken';
import { mockUserData } from '../mocks/user.mock';
import { mockExamData, mockTestData } from '../mocks/mockTest.mock';
import mongoose from 'mongoose';

const getAuthToken = (userId: string) =>
  jwt.sign({ id: userId, role: 'user' }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });

describe('Ranking Controller', () => {
  let user: any, token: string, mockTest: any;

  beforeEach(async () => {
    user     = await User.create(mockUserData);
    token    = getAuthToken(user._id.toString());
    const exam = await Exam.create(mockExamData);
    mockTest = await MockTest.create({ ...mockTestData, exam: exam._id });

    // Seed rankings
    await Ranking.insertMany([
      { user: user._id, mockTest: mockTest._id, score: 80, totalMarks: 100, percentage: 80, rank: 1, percentile: 95, totalParticipants: 10, accuracy: 85 },
      { user: new mongoose.Types.ObjectId(), mockTest: mockTest._id, score: 70, totalMarks: 100, percentage: 70, rank: 2, percentile: 85, totalParticipants: 10, accuracy: 75 },
    ]);
  });

  describe('GET /api/v1/rankings/:mockTestId/leaderboard', () => {
    it('should return leaderboard', async () => {
      const res = await request(app).get(`/api/v1/rankings/${mockTest._id}/leaderboard`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/rankings/:mockTestId/my-rank', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get(`/api/v1/rankings/${mockTest._id}/my-rank`);
      expect(res.status).toBe(401);
    });

    it('should return user rank when authenticated', async () => {
      const res = await request(app)
        .get(`/api/v1/rankings/${mockTest._id}/my-rank`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });
});