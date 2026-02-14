import request from 'supertest';
import app from '../../app';
import User from '../../models/User.model';

describe('Auth Integration: Full Register → Login → Profile Flow', () => {
  const userData = {
    name: 'Integration User', email: 'integration@pyqpb.com',
    password: 'Integrate@123', phone: '9876543210',
  };

  it('should complete full auth flow', async () => {
    // 1. Register
    const registerRes = await request(app).post('/api/v1/auth/register').send(userData);
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.data.accessToken).toBeDefined();
    const { accessToken } = registerRes.body.data;

    // 2. Access protected route
    const profileRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.email).toBe(userData.email);

    // 3. Logout
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(logoutRes.status).toBe(200);

    // 4. Login
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: userData.email, password: userData.password,
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.accessToken).toBeDefined();
  });

  it('should reject access with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', 'Bearer invalidtoken123');
    expect(res.status).toBe(401);
  });

  it('should prevent registration with duplicate email', async () => {
    await request(app).post('/api/v1/auth/register').send(userData);
    const res = await request(app).post('/api/v1/auth/register').send(userData);
    expect(res.status).toBe(400);
  });
});