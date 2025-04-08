import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('Health API endpoint', () => {
  it('should return a 200 status with health information', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('version');
  });
});
