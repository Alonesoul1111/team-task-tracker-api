import request from 'supertest';
import { app } from '../app';

describe('Health Check API', () => {
  it('should return 200 OK and health status', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('environment');
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/api/unknown-route');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('code', 'NOT_FOUND');
  });
});
