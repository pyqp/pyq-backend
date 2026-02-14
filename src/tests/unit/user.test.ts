import request from 'supertest';
import app from '../../app';
import User from '../../models/Career.model';
import jwt from 'jsonwebtoken';
import { mockUserData } from '../mocks/user.mock';

const getAuthToken = (userId: string, role = 'user') =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });

describe('User Controller', () => {
  let user: any;
  let token: string;

  beforeEach(async () => {
    user = await User.create(mockUserData);
    token = getAuthToken(user._id.toString());
  });

  describe('GET /api/v1/users/profile', () => {
    it('should return user profile', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(mockUserData.email);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/v1/users/profile');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/v1/users/profile', () => {
    it('should update profile successfully', async () => {
      const res = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });
  });

  describe('GET /api/v1/users/dashboard', () => {
    it('should return dashboard data', async () => {
      const res = await request(app)
        .get('/api/v1/users/dashboard')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.credits).toBeDefined();
      expect(res.body.data.stats).toBeDefined();
    });
  });
});