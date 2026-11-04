const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.JWT_SECRET = 'test-secret-only-not-for-production';
process.env.CLIENT_URL = 'http://localhost:3000';
const { createApp } = require('../app');

async function request(path, options = {}) {
  const server = http.createServer(createApp());
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    return await fetch(`http://127.0.0.1:${port}${path}`, options);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test('health endpoint reports a healthy API and security headers', async () => {
  const response = await request('/health');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
});

test('protected endpoints reject requests without a bearer token', async () => {
  const response = await request('/api/itineraries/my-itineraries');
  assert.equal(response.status, 401);
  assert.match((await response.json()).error, /authorization/i);
});

test('CORS rejects browser requests from an unapproved origin', async () => {
  const response = await request('/health', { headers: { Origin: 'https://untrusted.example' } });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: 'Origin is not allowed by CORS' });
});

test('unknown routes return a safe JSON 404 response', async () => {
  const response = await request('/api/not-a-real-route');
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Route not found.' });
});
