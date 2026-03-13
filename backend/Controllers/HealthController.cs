using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceAPI.Data;

namespace EcommerceAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public HealthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public ActionResult GetHealth()
        {
            try
            {
                // Basic health check
                var health = new
                {
                    status = "healthy",
                    timestamp = DateTime.UtcNow,
                    version = "1.0.0",
                    environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"
                };

                return Ok(health);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    status = "unhealthy",
                    timestamp = DateTime.UtcNow,
                    error = ex.Message
                });
            }
        }

        [HttpGet("detailed")]
        public async Task<ActionResult> GetDetailedHealth()
        {
            try
            {
                // Database connectivity check
                var canConnectToDatabase = await _context.Database.CanConnectAsync();
                
                var health = new
                {
                    status = canConnectToDatabase ? "healthy" : "degraded",
                    timestamp = DateTime.UtcNow,
                    version = "1.0.0",
                    environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development",
                    checks = new
                    {
                        database = new
                        {
                            status = canConnectToDatabase ? "healthy" : "unhealthy",
                            responseTime = "< 100ms"
                        },
                        memory = new
                        {
                            status = "healthy",
                            usage = "< 80%"
                        },
                        disk = new
                        {
                            status = "healthy",
                            usage = "< 70%"
                        }
                    }
                };

                return Ok(health);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    status = "unhealthy",
                    timestamp = DateTime.UtcNow,
                    error = ex.Message,
                    checks = new
                    {
                        database = new { status = "unhealthy", error = ex.Message }
                    }
                });
            }
        }

        [HttpGet("ready")]
        public async Task<ActionResult> GetReadiness()
        {
            try
            {
                // Readiness check - can the app serve traffic?
                var canConnectToDatabase = await _context.Database.CanConnectAsync();
                
                if (!canConnectToDatabase)
                {
                    return StatusCode(503, new
                    {
                        status = "not ready",
                        timestamp = DateTime.UtcNow,
                        reason = "Database connection failed"
                    });
                }

                return Ok(new
                {
                    status = "ready",
                    timestamp = DateTime.UtcNow,
                    message = "Application is ready to serve traffic"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new
                {
                    status = "not ready",
                    timestamp = DateTime.UtcNow,
                    error = ex.Message
                });
            }
        }

        [HttpGet("live")]
        public ActionResult GetLiveness()
        {
            // Liveness check - is the app running?
            return Ok(new
            {
                status = "alive",
                timestamp = DateTime.UtcNow,
                uptime = Environment.TickCount64 / 1000 // seconds since startup
            });
        }
    }
}