import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

// ---------------------------------------------------------------------------
// Mock Vite so we don't try to start a real dev server during tests
// ---------------------------------------------------------------------------

vi.mock('vite', () => ({
  createServer: vi.fn().mockResolvedValue({
    middlewares: { handle: vi.fn() },
  }),
}));

// Run tests with NODE_ENV=production to skip Vite middleware branch
// (static files aren't present in CI, but the health route is independent)

let app: Express;

beforeAll(async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  const { createApp } = await import('./server');
  // createApp() tries to serve dist/ in production; for the health-check test
  // that route is registered before static middleware so this is fine.
  app = await createApp();

  process.env.NODE_ENV = originalEnv;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/health', () => {
  it('returns HTTP 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  it('returns { status: "ok" }', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('responds with JSON content-type', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
