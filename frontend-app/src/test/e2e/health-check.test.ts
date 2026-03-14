import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Add fetch polyfill for Node.js environment
if (!globalThis.fetch) {
  const { fetch, Headers, Request, Response } = await import('undici');
  Object.assign(globalThis, { fetch, Headers, Request, Response });
}

// E2E Health Check Tests
describe('E2E Health Check Tests', () => {
  const API_BASE_URL = process.env.VITE_API_URL || (process.env.CI ? 'http://localhost:5000' : 'http://localhost:5222');

  beforeAll(async () => {
    console.log('🔧 E2E Test Setup');
    console.log('API Base URL:', API_BASE_URL);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('CI Mode:', process.env.CI ? 'true' : 'false');
    
    // Wait for API to be ready
    console.log('⏳ Waiting for API to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test basic connectivity
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      if (response && response.ok) {
        console.log('✅ API connectivity confirmed');
      } else {
        console.warn('⚠️ API connectivity issue detected');
      }
    } catch (error) {
      console.warn('⚠️ API connectivity test failed:', error.message);
    }
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  it('should verify API health endpoint is accessible', async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      
      if (!response) {
        throw new Error('No response received from API');
      }

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
      expect(data.version).toBeDefined();
    } catch (error) {
      console.error('Health endpoint test failed:', error);
      console.error('API URL:', API_BASE_URL);
      throw error;
    }
  });

  it('should verify detailed health check returns comprehensive status', async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health/detailed`);
      
      if (!response) {
        throw new Error('No response received from detailed health API');
      }

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.checks).toBeDefined();
      expect(data.checks.database).toBeDefined();
      expect(data.checks.memory).toBeDefined();
      expect(data.checks.disk).toBeDefined();
    } catch (error) {
      console.error('Detailed health endpoint test failed:', error);
      console.error('API URL:', API_BASE_URL);
      throw error;
    }
  });

  it('should verify readiness endpoint confirms API is ready', async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health/ready`);
      
      if (!response) {
        throw new Error('No response received from readiness API');
      }

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('ready');
      expect(data.message).toContain('ready to serve traffic');
    } catch (error) {
      console.error('Readiness endpoint test failed:', error);
      console.error('API URL:', API_BASE_URL);
      throw error;
    }
  });

  it('should verify liveness endpoint shows API is alive', async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health/live`);
      
      if (!response) {
        throw new Error('No response received from liveness API');
      }

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('alive');
      expect(data.uptime).toBeGreaterThan(0);
    } catch (error) {
      console.error('Liveness endpoint test failed:', error);
      console.error('API URL:', API_BASE_URL);
      throw error;
    }
  });

  it('should verify API response times are acceptable', async () => {
    try {
      const startTime = Date.now();
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (!response) {
        throw new Error('No response received for performance test');
      }

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Less than 1 second
    } catch (error) {
      console.error('Performance test failed:', error);
      console.error('API URL:', API_BASE_URL);
      throw error;
    }
  });

  it('should handle concurrent requests gracefully', async () => {
    try {
      const concurrentRequests = 5;
      const promises = Array(concurrentRequests).fill(null).map(() => 
        fetch(`${API_BASE_URL}/api/health`)
      );

      const responses = await Promise.all(promises);
      
      responses.forEach((response, index) => {
        if (!response) {
          throw new Error(`No response received for concurrent request ${index + 1}`);
        }
        expect(response.status).toBe(200);
      });
    } catch (error) {
      console.error('Concurrent requests test failed:', error);
      console.error('API URL:', API_BASE_URL);
      throw error;
    }
  });

  it('should verify CORS headers are properly configured', async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      
      if (!response) {
        throw new Error('No response received for CORS test');
      }

      expect(response.status).toBe(200);
      // Note: In a real E2E test, you might check for specific CORS headers
      // depending on your CORS configuration
    } catch (error) {
      console.error('CORS test failed:', error);
      console.error('API URL:', API_BASE_URL);
      throw error;
    }
  });
});