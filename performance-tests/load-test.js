// CD Testing Rules - Performance Test Script
// Implements performance validation from CD_TESTING_RULES.md

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// CD Rule: Performance thresholds
const MAX_RESPONSE_TIME = __ENV.MAX_RESPONSE_TIME || 500; // ms
const ERROR_RATE_THRESHOLD = __ENV.ERROR_RATE_THRESHOLD || 1; // %
const TARGET_URL = __ENV.TARGET_URL || 'http://localhost:5222';

// Custom metrics for CD rules
const errorRate = new Rate('cd_error_rate');
const responseTime = new Trend('cd_response_time');

// CD Rule: Performance test configuration
export const options = {
  stages: [
    // Ramp up
    { duration: '2m', target: 10 },   // Warm up
    { duration: '5m', target: 50 },   // Normal load
    { duration: '2m', target: 100 },  // Peak load
    { duration: '5m', target: 100 },  // Sustained peak
    { duration: '2m', target: 0 },    // Ramp down
  ],
  
  // CD Rule: Performance thresholds
  thresholds: {
    'http_req_duration': [`p(95)<${MAX_RESPONSE_TIME}`], // 95% of requests under 500ms
    'http_req_failed': [`rate<${ERROR_RATE_THRESHOLD/100}`], // Error rate under 1%
    'cd_error_rate': [`rate<${ERROR_RATE_THRESHOLD/100}`],
    'cd_response_time': [`p(95)<${MAX_RESPONSE_TIME}`],
  },
};

// CD Rule: Test scenarios
export default function () {
  const scenarios = [
    testHealthEndpoints,
    testAPIEndpoints,
    testConcurrentRequests,
    testPerformanceUnderLoad,
  ];
  
  // Run random scenario
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();
  
  sleep(1);
}

// CD Rule: Health endpoint performance test
function testHealthEndpoints() {
  const endpoints = [
    '/api/health',
    '/api/health/ready',
    '/api/health/live',
    '/api/health/detailed'
  ];
  
  endpoints.forEach(endpoint => {
    const response = http.get(`${TARGET_URL}${endpoint}`);
    
    // CD Rule: Health check validation
    const success = check(response, {
      'health endpoint status is 200': (r) => r.status === 200,
      'health endpoint response time < 500ms': (r) => r.timings.duration < MAX_RESPONSE_TIME,
      'health endpoint has valid JSON': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
    });
    
    errorRate.add(!success);
    responseTime.add(response.timings.duration);
  });
}

// CD Rule: API endpoint performance test
function testAPIEndpoints() {
  const endpoints = [
    '/api/products',
    '/api/categories',
    '/api/orders',
    '/api/users'
  ];
  
  endpoints.forEach(endpoint => {
    const response = http.get(`${TARGET_URL}${endpoint}`);
    
    // CD Rule: API performance validation
    const success = check(response, {
      'API endpoint accessible': (r) => r.status === 200 || r.status === 401, // 401 is OK for protected endpoints
      'API response time acceptable': (r) => r.timings.duration < MAX_RESPONSE_TIME,
      'API response has content': (r) => r.body.length > 0,
    });
    
    errorRate.add(!success);
    responseTime.add(response.timings.duration);
  });
}

// CD Rule: Concurrent request handling test
function testConcurrentRequests() {
  const requests = [];
  
  // Create 10 concurrent requests
  for (let i = 0; i < 10; i++) {
    requests.push(['GET', `${TARGET_URL}/api/health`, null, { tags: { name: 'concurrent' } }]);
  }
  
  const responses = http.batch(requests);
  
  // CD Rule: Concurrent request validation
  responses.forEach((response, index) => {
    const success = check(response, {
      [`concurrent request ${index} status OK`]: (r) => r.status === 200,
      [`concurrent request ${index} time OK`]: (r) => r.timings.duration < MAX_RESPONSE_TIME,
    });
    
    errorRate.add(!success);
    responseTime.add(response.timings.duration);
  });
}

// CD Rule: Performance under load test
function testPerformanceUnderLoad() {
  const startTime = Date.now();
  
  // Simulate user workflow
  const workflows = [
    () => http.get(`${TARGET_URL}/api/health`),
    () => http.get(`${TARGET_URL}/api/products`),
    () => http.get(`${TARGET_URL}/api/categories`),
  ];
  
  workflows.forEach((workflow, index) => {
    const response = workflow();
    
    // CD Rule: Workflow performance validation
    const success = check(response, {
      [`workflow ${index} completes successfully`]: (r) => r.status === 200,
      [`workflow ${index} meets performance SLA`]: (r) => r.timings.duration < MAX_RESPONSE_TIME,
    });
    
    errorRate.add(!success);
    responseTime.add(response.timings.duration);
  });
  
  const totalTime = Date.now() - startTime;
  
  // CD Rule: Total workflow time validation
  check(null, {
    'complete workflow under 2 seconds': () => totalTime < 2000,
  });
}