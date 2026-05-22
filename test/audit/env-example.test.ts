import { readFileSync } from 'fs';
import { join } from 'path';

describe('.env.example secret exposure audit', () => {
  const envPath = join(process.cwd(), '.env.example');
  const content = readFileSync(envPath, 'utf-8');
  const lines = content.split('\n').filter(l => l && !l.startsWith('#') && !l.startsWith('//'));

  it('should have no real DATABASE_URL with actual credentials', () => {
    const dbLine = lines.find(l => l.startsWith('DATABASE_URL='));
    expect(dbLine).toBeDefined();
    // Real secrets would have username:password@host pattern
    const hasCredentials = /@[^:]+:/g.test(dbLine || '');
    expect(hasCredentials).toBe(false);
  });

  it('should have no real SUPABASE_SERVICE_ROLE_KEY', () => {
    const keyLine = lines.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY='));
    expect(keyLine).toBeDefined();
    const value = keyLine?.split('=')[1] || '';
    // Real keys are JWT tokens (3 base64 segments separated by dots)
    const isJWT = value.split('.').length === 3;
    expect(isJWT).toBe(false);
  });

  it('should have "your_" placeholder for API keys', () => {
    const apiKeys = ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'ELEVENLABS_API_KEY'];
    apiKeys.forEach(key => {
      const line = lines.find(l => l.startsWith(key + '='));
      expect(line).toBeDefined();
      expect(line?.includes('your_')).toBe(true);
    });
  });
});