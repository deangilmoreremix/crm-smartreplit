import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createClient } from '@supabase/supabase-js';

const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
  auth: {
    admin: {
      inviteUserByEmail: vi.fn().mockResolvedValue({ user: { id: '1' } }),
    },
  },
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe('Debug Auth', () => {
  it('should work', async () => {
    process.env.SUPABASE_URL = 'http://test';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test';
    
    const { default: authRouter } = await import('../auth');
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    
    const response = await request(app).post('/api/auth/invite').send({ email: 'test@test.com' });
    console.log('STATUS:', response.status);
    console.log('BODY:', JSON.stringify(response.body));
    
    expect(response.status).toBe(200);
  });
});
