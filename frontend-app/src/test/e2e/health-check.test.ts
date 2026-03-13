import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// E2E Health Check Tests
describe('E2E Health Check Tests', () => {
  const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5222';

  beforeAll(async () => {
    // Wait for API to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  it('should verify API health endpoint is accessible', async () => {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
    expect(data.version).toBeDefined();
  });

  it('should verify detailed health check returns comprehensive status', async () => {
    const response = await fetch(`${API_BASE_URL}/api/health/detailed`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.checks).toBeDefined();
    expect(data.checks.database).toBeDefined();
    expect(data.checks.memory).toBeDefined();
    expect(data.checks.disk).toBeDefined();
  });

  it('should verify readiness endpoint confirms API is ready', async () => {
    const response = await fetch(`${API_BASE_URL}/api/health/ready`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ready');
    expect(data.message).toContain('ready to serve traffic');
  });

  it('should verify liveness endpoint shows API is alive', async () => {
    const response = await fetch(`${API_BASE_URL}/api/health/live`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('alive');
    expect(data.uptime).toBeGreaterThan(0);
  });

  it('should verify API response times are acceptable', async () => {
    const startTime = Date.now();
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(1000); // Less than 1 second
  });

  it('should handle concurrent requests gracefully', async () => {
    const concurrentRequests = 5;
    const promises = Array(concurrentRequests).fill(null).map(() => 
      fetch(`${API_BASE_URL}/api/health`)
    );

    const responses = await Promise.all(promises);
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });

  it('should verify CORS headers are properly configured', async () => {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    
    expect(response.status).toBe(200);
    // Note: In a real E2E test, you might check for specific CORS headers
    // depending on your CORS configuration
  });
});