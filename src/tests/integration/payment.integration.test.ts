import request from 'supertest';
import app from '../../app';
import User from '../../models/User.model';
import Package from '../../models/Package.model';
import jwt from 'jsonwebtoken';
import { mockUserData } from '../mocks/user.mock';

const getToken = (userId: string) =>
  jwt.sign({ id: userId, role: 'user' }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });

describe('Payment Integration: Order → Verify Flow', () => {
  let user: any, token: string, pkg: any;

  beforeEach(async () => {
    user  = await User.create(mockUserData);
    token = getToken(user._id.toString());
    pkg   = await Package.create({
      name: 'Pro', slug: 'pro', price: 199,
      credits: 10, validityDays: 365, isActive: true, isPopular: true,
      features: ['10 credits', 'All exams'],
      description: 'Pro package',
      displayOrder: 2,
    });
  });

  it('should reject order creation without auth', async () => {
    const res = await request(app).post('/api/v1/payments/create-order').send({ packageId: pkg._id.toString() });
    expect(res.status).toBe(401);
  });

  it('should reject order with invalid package', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ packageId: '000000000000000000000000' });
    expect(res.status).toBe(404);
  });

  it('should reject payment verification with invalid signature', async () => {
    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: 'order_test', paymentId: 'pay_test', signature: 'invalidsig' });
    expect(res.status).toBe(400);
  });

  it('should return empty payment history for new user', async () => {
    const res = await request(app)
      .get('/api/v1/payments/history')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});