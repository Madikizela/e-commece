using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceAPI.Models;
using EcommerceAPI.Data;

namespace EcommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly Services.IJwtService _jwtService;
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(Services.IJwtService jwtService, AppDbContext context, IConfiguration configuration)
    {
        _jwtService = jwtService;
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest(new LoginResponse { Success = false, Message = "Username and password are required" });
        }

        // Check if user exists in database
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Username);
        
        if (user != null && BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
        {
            // Generate JWT token for user
            string token = _jwtService.GenerateToken(user.Id, user.Email, user.Name, user.Role);
            
            return Ok(new LoginResponse 
            { 
                Success = true, 
                Token = token,
                Username = user.Name,
                Role = user.Role
            });
        }

        // Fallback to environment variable admin credentials for initial setup
        var adminEmail = Environment.GetEnvironmentVariable("ADMIN_EMAIL") ?? _configuration["Admin:Email"];
        var adminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD") ?? _configuration["Admin:Password"];
        
        if (!string.IsNullOrEmpty(adminEmail) && !string.IsNullOrEmpty(adminPassword) &&
            request.Username == adminEmail && request.Password == adminPassword)
        {
            // Generate JWT token for admin
            string token = _jwtService.GenerateToken(0, adminEmail, "Admin", "Admin");
            
            return Ok(new LoginResponse 
            { 
                Success = true, 
                Token = token,
                Username = "Admin",
                Role = "Admin"
            });
        }
        
        return Unauthorized(new LoginResponse { Success = false, Message = "Invalid credentials" });
    }

    [HttpPost("admin/create")]
    public async Task<ActionResult<UserLoginResponse>> CreateAdminUser([FromBody] CreateAdminRequest request)
    {
        // Only allow admin creation if no admin exists or if called by existing admin
        var existingAdmin = await _context.Users.FirstOrDefaultAsync(u => u.Role == "Admin");
        
        if (existingAdmin != null)
        {
            return BadRequest(new UserLoginResponse { Success = false, Message = "Admin user already exists" });
        }

        // Validate input
        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password) || string.IsNullOrEmpty(request.Name))
        {
            return BadRequest(new UserLoginResponse { Success = false, Message = "All fields are required" });
        }

        // Check if user already exists
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (existingUser != null)
        {
            return BadRequest(new UserLoginResponse { Success = false, Message = "Email already registered" });
        }

        // Hash the password
        string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var adminUser = new User
        {
            Name = request.Name,
            Email = request.Email,
            Password = hashedPassword,
            Role = "Admin",
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(adminUser);
        await _context.SaveChangesAsync();

        return Ok(new UserLoginResponse 
        { 
            Success = true, 
            Message = "Admin user created successfully",
            UserId = adminUser.Id,
            Name = adminUser.Name,
            Email = adminUser.Email,
            Role = adminUser.Role
        });
    }
}
