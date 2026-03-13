using System.Net;
using System.Text.Json;
using Xunit;

namespace EcommerceAPI.Tests.Integration
{
    public class ApiIntegrationTests
    {
        private readonly HttpClient _client;
        private readonly string _baseUrl = "http://localhost:5222"; // Use the running server

        public ApiIntegrationTests()
        {
            _client = new HttpClient();
        }

        [Fact]
        public async Task HealthCheck_ReturnsHealthyStatus()
        {
            // Act
            var response = await _client.GetAsync($"{_baseUrl}/api/health");
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Contains("healthy", content);
            Assert.Contains("timestamp", content);
            Assert.Contains("version", content);
        }

        [Fact]
        public async Task DetailedHealthCheck_ReturnsDetailedStatus()
        {
            // Act
            var response = await _client.GetAsync($"{_baseUrl}/api/health/detailed");
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Contains("database", content);
            Assert.Contains("memory", content);
            Assert.Contains("disk", content);
        }

        [Fact]
        public async Task ReadinessCheck_ReturnsReadyStatus()
        {
            // Act
            var response = await _client.GetAsync($"{_baseUrl}/api/health/ready");
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Contains("ready", content);
        }

        [Fact]
        public async Task LivenessCheck_ReturnsAliveStatus()
        {
            // Act
            var response = await _client.GetAsync($"{_baseUrl}/api/health/live");
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Contains("alive", content);
            Assert.Contains("uptime", content);
        }

        [Fact]
        public async Task ProductsApi_ReturnsSuccessStatusCode()
        {
            // Act
            var response = await _client.GetAsync($"{_baseUrl}/api/products");

            // Assert
            Assert.True(response.IsSuccessStatusCode);
        }

        [Fact]
        public async Task CategoriesApi_ReturnsSuccessStatusCode()
        {
            // Act
            var response = await _client.GetAsync($"{_baseUrl}/api/categories");

            // Assert
            Assert.True(response.IsSuccessStatusCode);
        }

        [Fact]
        public async Task OrdersApi_ReturnsSuccessStatusCode()
        {
            // Act
            var response = await _client.GetAsync($"{_baseUrl}/api/orders");

            // Assert
            Assert.True(response.IsSuccessStatusCode);
        }

        [Fact]
        public async Task ApiEndpoints_ResponseTime_IsAcceptable()
        {
            var endpoints = new[]
            {
                "/api/health",
                "/api/products",
                "/api/categories"
            };

            foreach (var endpoint in endpoints)
            {
                // Act
                var startTime = DateTime.UtcNow;
                var response = await _client.GetAsync($"{_baseUrl}{endpoint}");
                var endTime = DateTime.UtcNow;
                var responseTime = (endTime - startTime).TotalMilliseconds;

                // Assert
                Assert.True(response.IsSuccessStatusCode, $"Endpoint {endpoint} failed");
                Assert.True(responseTime < 1000, $"Endpoint {endpoint} response time {responseTime}ms exceeds 1000ms threshold");
            }
        }

        [Fact]
        public async Task ConcurrentRequests_HandleLoadGracefully()
        {
            // Arrange
            var tasks = new List<Task<HttpResponseMessage>>();
            const int concurrentRequests = 10;

            // Act
            for (int i = 0; i < concurrentRequests; i++)
            {
                tasks.Add(_client.GetAsync($"{_baseUrl}/api/health"));
            }

            var responses = await Task.WhenAll(tasks);

            // Assert
            foreach (var response in responses)
            {
                Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            }
        }
    }
}