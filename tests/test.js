const request = require('supertest');
const app = require('../server.js');  // Assuming your Express app is in app.js

describe('POST /add', () => {
  it('should add a transaction', async () => {
    const response = await request(app)
      .post('/add')
      .send({ payer: 'DANNON', points: 100, timestamp: '2021-09-28T14:00:00Z' });

    expect(response.statusCode).toBe(200);
    // Add more assertions based on your expected behavior
  });
});
