import request from 'supertest';
import app from '../../app';
import User from '../../models/User.model';
import Package from '../../models/Package.model';
import jwt from 'jsonwebtoken';
import { mockUserData } from '../mocks/user.mock';

const getAuthToken = (userId: string) =>
  jwt.sign({ id: userId, role: 'user' }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });

describe('Payment Controller', () => {
  let user: any, token: string, pkg: any;

  beforeEach(async () => {
    user  = await User.create(mockUserData);
    token = getAuthToken(user._id.toString());
    pkg   = await Package.create({
      name: 'Starter', slug: 'starter', price: 99,
      credits: 5, validityDays: 365, isActive: true, isPopular: false,
      features: ['5 credits'],
      description: 'Starter package',
      displayOrder: 1,
    });
  });

  describe('POST /api/v1/payments/create-order', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/v1/payments/create-order')
        .send({ packageId: pkg._id.toString() });
      expect(res.status).toBe(401);
    });

    it('should return 400 with missing packageId', async () => {
      const res = await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('should return 404 with invalid packageId', async () => {
      const res = await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${token}`)
        .send({ packageId: '000000000000000000000000' });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/payments/history', () => {
    it('should return payment history', async () => {
      const res = await request(app)
        .get('/api/v1/payments/history')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });
});