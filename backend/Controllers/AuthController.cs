using Microsoft.AspNetCore.Mvc;
using EcommerceAPI.Models;

namespace EcommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly Services.IJwtService _jwtService;
    
    // Hardcoded admin credentials
    private const string AdminUsername = "admin";
    private const string AdminPassword = "admin123";

    public AuthController(Services.IJwtService jwtService)
    {
        _jwtService = jwtService;
    }

    [HttpPost("login")]
    public ActionResult<LoginResponse> Login([FromBody] LoginRequest request)
    {
        // Check admin credentials
        // In production, store hashed password in database
        if (request.Username == AdminUsername && request.Password == AdminPassword)
        {
            // Generate JWT token for admin
            string token = _jwtService.GenerateToken(0, "admin@ecommerce.com", AdminUsername, "Admin");
            
            return Ok(new LoginResponse 
            { 
                Success = true, 
                Token = token,
                Username = AdminUsername
            });
        }
        
        return Unauthorized(new LoginResponse { Success = false, Message = "Invalid credentials" });
    }
}
