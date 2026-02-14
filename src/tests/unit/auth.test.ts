import request from 'supertest';
import app from '../../app';
import User from '../../models/User.model';
import { mockRegisterBody, mockLoginBody } from '../mocks/user.mock';

describe('Auth Controller', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(mockRegisterBody);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(mockRegisterBody.email);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should fail with duplicate email', async () => {
      await User.create({ ...mockRegisterBody, isEmailVerified: true, referralCode: 'TEST001', role: 'user', credits: { total: 0, batches: [], lastUpdated: new Date() }, loyaltyPoints: { total: 0, earnedAllTime: 0, redeemedAllTime: 0, level: 'bronze', levelName: 'Bronze', pointsToNextLevel: 100, dailyLoginClaimed: false }, referralStats: { totalReferred: 0, totalPurchased: 0, creditsEarned: 0, bonusCreditsEarned: 0, totalValue: 0, milestone10Claimed: false, milestone50Claimed: false }, preferences: { targetExams: [], language: 'english', emailNotifications: true, smsNotifications: false }, stats: { totalTestsTaken: 0, totalTimeSpent: 0, averageScore: 0, bestScore: 0 } });
      const res = await request(app).post('/api/v1/auth/register').send(mockRegisterBody);
      expect(res.status).toBe(400);
    });

    it('should fail with invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...mockRegisterBody, email: 'notanemail' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...mockRegisterBody, password: '123456' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await User.create({ ...mockRegisterBody, email: mockLoginBody.email, isEmailVerified: true, referralCode: 'TEST002', role: 'user', credits: { total: 0, batches: [], lastUpdated: new Date() }, loyaltyPoints: { total: 0, earnedAllTime: 0, redeemedAllTime: 0, level: 'bronze', levelName: 'Bronze', pointsToNextLevel: 100, dailyLoginClaimed: false }, referralStats: { totalReferred: 0, totalPurchased: 0, creditsEarned: 0, bonusCreditsEarned: 0, totalValue: 0, milestone10Claimed: false, milestone50Claimed: false }, preferences: { targetExams: [], language: 'english', emailNotifications: true, smsNotifications: false }, stats: { totalTestsTaken: 0, totalTimeSpent: 0, averageScore: 0, bestScore: 0 } });
    });

    it('should login successfully', async () => {
      const res = await request(app).post('/api/v1/auth/login').send(mockLoginBody);
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ ...mockLoginBody, password: 'WrongPass@1' });
      expect(res.status).toBe(401);
    });

    it('should fail with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@pyqpb.com', password: 'Test@12345' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });
  });
});