const request = require('supertest');
const server = require('../server.js'); 

describe('POST /add', () => {
  it('should add a transaction', async () => {
    const response = await request(server)
      .post('/add')
      .send({ payer: 'DANNON', points: 100, timestamp: '2021-09-28T14:00:00Z' });

    expect(response.statusCode).toBe(200);
  });
});

describe('POST /spend', () => {
  it('should spend points', async () => {
    const response = await request(server)
      .post('/spend')
      .send({ points: 5000 });

    expect(response.statusCode).toBe(401);
    
  });
});

describe('GET /balance', () => {
  it('should get points balance', async () => {
    const response = await request(server)
      .get('/balance');

    expect(response.statusCode).toBe(200);
    
  });
});

afterAll(done => {
  server.close(done);
});