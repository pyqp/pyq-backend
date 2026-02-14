import request from 'supertest';
import app from '../../app';
import MockTest from '../../models/MockTest.model';
import Exam from '../../models/Exam.model';
import User from '../../models/User.model';
import jwt from 'jsonwebtoken';
import { mockUserData, mockAdminData } from '../mocks/user.mock';
import { mockExamData, mockTestData } from '../mocks/mockTest.mock';

const getAuthToken = (userId: string, role = 'user') =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });

describe('MockTest Controller', () => {
  let user: any, admin: any, exam: any, mockTest: any;
  let userToken: string, adminToken: string;

  beforeEach(async () => {
    user      = await User.create(mockUserData);
    admin     = await User.create(mockAdminData);
    exam      = await Exam.create(mockExamData);
    mockTest  = await MockTest.create({ ...mockTestData, exam: exam._id });
    userToken  = getAuthToken(user._id.toString(), 'user');
    adminToken = getAuthToken(admin._id.toString(), 'admin');
  });

  describe('GET /api/v1/mock-tests', () => {
    it('should return list of mock tests', async () => {
      const res = await request(app).get('/api/v1/mock-tests');
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should return paginated results', async () => {
      const res = await request(app).get('/api/v1/mock-tests?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/v1/mock-tests/:id', () => {
    it('should return single mock test', async () => {
      const res = await request(app).get(`/api/v1/mock-tests/${mockTest._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe(mockTestData.name);
    });

    it('should return 404 for invalid id', async () => {
      const res = await request(app).get('/api/v1/mock-tests/000000000000000000000000');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/mock-tests (Admin)', () => {
    it('should create mock test as admin', async () => {
      const res = await request(app)
        .post('/api/v1/mock-tests')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...mockTestData, slug: 'new-test-slug', exam: exam._id.toString() });
      expect(res.status).toBe(201);
    });

    it('should reject creation by regular user', async () => {
      const res = await request(app)
        .post('/api/v1/mock-tests')
        .set('Authorization', `Bearer ${userToken}`)
        .send(mockTestData);
      expect(res.status).toBe(403);
    });
  });
});