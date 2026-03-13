using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceAPI.Data;

namespace EcommerceAPI.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<HealthController> _logger;

    public HealthController(AppDbContext context, ILogger<HealthController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            // Check database connectivity
            await _context.Database.CanConnectAsync();
            
            var healthCheck = new
            {
                status = "Healthy",
                timestamp = DateTime.UtcNow,
                version = "1.0.0",
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                database = "Connected",
                uptime = Environment.TickCount64
            };

            return Ok(healthCheck);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
            
            var healthCheck = new
            {
                status = "Unhealthy",
                timestamp = DateTime.UtcNow,
                version = "1.0.0",
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                database = "Disconnected",
                error = ex.Message,
                uptime = Environment.TickCount64
            };

            return StatusCode(503, healthCheck);
        }
    }

    [HttpGet("ready")]
    public async Task<IActionResult> Ready()
    {
        try
        {
            // More thorough readiness check
            await _context.Database.CanConnectAsync();
            
            // Check if database has been migrated
            var pendingMigrations = await _context.Database.GetPendingMigrationsAsync();
            
            if (pendingMigrations.Any())
            {
                return StatusCode(503, new { status = "Not Ready", reason = "Pending migrations" });
            }

            return Ok(new { status = "Ready" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Readiness check failed");
            return StatusCode(503, new { status = "Not Ready", error = ex.Message });
        }
    }

    [HttpGet("live")]
    public IActionResult Live()
    {
        // Simple liveness check
        return Ok(new { status = "Alive", timestamp = DateTime.UtcNow });
    }
}