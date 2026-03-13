using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using EcommerceAPI.Data;
using EcommerceAPI.Models;

namespace EcommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly Services.IEmailService _emailService;
    private readonly Services.IJwtService _jwtService;

    public UsersController(AppDbContext context, Services.IEmailService emailService, Services.IJwtService jwtService)
    {
        _context = context;
        _emailService = emailService;
        _jwtService = jwtService;
    }

    // Get all users (for admin)
    [HttpGet]
    // [Authorize(Policy = "AdminOnly")] // Temporarily removed for testing
    public async Task<ActionResult<PagedResult<User>>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? role = null,
        [FromQuery] string? search = null)
    {
        // Validate pagination parameters
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        var query = _context.Users.AsQueryable();

        // Filter by role if provided
        if (!string.IsNullOrEmpty(role))
        {
            query = query.Where(u => u.Role == role);
        }

        // Search by name or email if provided
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(u => u.Name.Contains(search) || u.Email.Contains(search));
        }

        // Order by creation date (newest first)
        query = query.OrderByDescending(u => u.CreatedAt);

        // Get total count for pagination
        var totalCount = await query.CountAsync();
        
        // Apply pagination and exclude password from results
        var users = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new User
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                Phone = u.Phone,
                Address = u.Address,
                Role = u.Role,
                CreatedAt = u.CreatedAt,
                Password = "" // Never return password
            })
            .ToListAsync();

        var result = new PagedResult<User>
        {
            Items = users,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        };

        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<ActionResult<UserLoginResponse>> Register([FromBody] RegisterRequest request)
    {
        // Check if user already exists
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (existingUser != null)
        {
            return BadRequest(new UserLoginResponse { Success = false, Message = "Email already registered" });
        }

        // Generate secure random password
        string generatedPassword = GenerateSecurePassword();
        
        // Hash the password using BCrypt
        string hashedPassword = BCrypt.Net.BCrypt.HashPassword(generatedPassword);

        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            Password = hashedPassword, // Hashed password stored
            Phone = request.Phone,
            Address = request.Address
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Log password to console for debugging
        Console.WriteLine("===========================================");
        Console.WriteLine($"NEW USER REGISTERED");
        Console.WriteLine($"Email: {user.Email}");
        Console.WriteLine($"Password: {generatedPassword}");
        Console.WriteLine("===========================================");

        // Send email with password
        try
        {
            await _emailService.SendPasswordEmailAsync(user.Email, user.Name, generatedPassword);
            Console.WriteLine($"✅ Email sent successfully to {user.Email}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Failed to send email: {ex.Message}");
            // Continue anyway - user can still see password in console
        }

        return Ok(new UserLoginResponse
        {
            Success = true,
            Message = "Registration successful! Your password has been sent to your email.",
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email
        });
    }

    private string GenerateSecurePassword()
    {
        const string uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const string lowercase = "abcdefghijklmnopqrstuvwxyz";
        const string numbers = "0123456789";
        const string special = "!@#$%^&*";
        const string allChars = uppercase + lowercase + numbers + special;

        var random = new Random();
        var password = new char[12];

        // Ensure at least one of each type
        password[0] = uppercase[random.Next(uppercase.Length)];
        password[1] = lowercase[random.Next(lowercase.Length)];
        password[2] = numbers[random.Next(numbers.Length)];
        password[3] = special[random.Next(special.Length)];

        // Fill the rest randomly
        for (int i = 4; i < password.Length; i++)
        {
            password[i] = allChars[random.Next(allChars.Length)];
        }

        // Shuffle the password
        return new string(password.OrderBy(x => random.Next()).ToArray());
    }

    [HttpPost("login")]
    public async Task<ActionResult<UserLoginResponse>> Login([FromBody] UserLoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        
        if (user == null)
        {
            return Unauthorized(new UserLoginResponse { Success = false, Message = "Invalid email or password" });
        }

        // Check if password is BCrypt hashed (starts with $2a$, $2b$, or $2y$)
        if (!user.Password.StartsWith("$2"))
        {
            Console.WriteLine($"⚠️ User {user.Email} has non-BCrypt password. Please re-register.");
            return Unauthorized(new UserLoginResponse { Success = false, Message = "Account needs to be re-registered. Please contact support." });
        }

        try
        {
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            {
                return Unauthorized(new UserLoginResponse { Success = false, Message = "Invalid email or password" });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ BCrypt verification error for {user.Email}: {ex.Message}");
            return Unauthorized(new UserLoginResponse { Success = false, Message = "Invalid email or password" });
        }

        // Generate JWT token
        string token = _jwtService.GenerateToken(user.Id, user.Email, user.Name, user.Role);

        return Ok(new UserLoginResponse
        {
            Success = true,
            Token = token,
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<User>> GetUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();
        return user;
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] User updatedUser)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.Name = updatedUser.Name;
        user.Phone = updatedUser.Phone;
        user.Address = updatedUser.Address;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/change-password")]
    public async Task<ActionResult<UserLoginResponse>> ChangePassword(int id, [FromBody] ChangePasswordRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        // Verify current password
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.Password))
        {
            return BadRequest(new UserLoginResponse { Success = false, Message = "Current password is incorrect" });
        }

        // Hash and update new password
        user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        // Send confirmation email
        try
        {
            await _emailService.SendPasswordResetEmailAsync(user.Email, user.Name, request.NewPassword);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to send password change email: {ex.Message}");
        }

        return Ok(new UserLoginResponse { Success = true, Message = "Password changed successfully" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound();
        }

        // Prevent deletion of admin users
        if (user.Role == "Admin")
        {
            return BadRequest(new { message = "Admin users cannot be deleted for security reasons." });
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("{id}/orders")]
    public async Task<ActionResult<PagedResult<Order>>> GetUserOrders(
        int id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        // Validate pagination parameters
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 50) pageSize = 10;

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        var query = _context.Orders
            .Include(o => o.OrderItems)
            .Where(o => o.CustomerEmail == user.Email)
            .OrderByDescending(o => o.CreatedAt);

        // Get total count for pagination
        var totalCount = await query.CountAsync();
        
        // Apply pagination
        var orders = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new PagedResult<Order>
        {
            Items = orders,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        };

        return Ok(result);
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<UserLoginResponse>> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        
        if (user == null)
        {
            return BadRequest(new UserLoginResponse { Success = false, Message = "Email not found" });
        }

        // Generate new secure random password
        string newPassword = GenerateSecurePassword();
        
        // Hash the new password using BCrypt
        string hashedPassword = BCrypt.Net.BCrypt.HashPassword(newPassword);

        // Update user's password
        user.Password = hashedPassword;
        await _context.SaveChangesAsync();

        // Log password to console for debugging
        Console.WriteLine("===========================================");
        Console.WriteLine($"PASSWORD RESET");
        Console.WriteLine($"Email: {user.Email}");
        Console.WriteLine($"New Password: {newPassword}");
        Console.WriteLine("===========================================");

        // Send email with new password
        try
        {
            await _emailService.SendPasswordResetEmailAsync(user.Email, user.Name, newPassword);
            Console.WriteLine($"✅ Password reset email sent successfully to {user.Email}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Failed to send email: {ex.Message}");
            return StatusCode(500, new UserLoginResponse { Success = false, Message = "Failed to send email" });
        }

        return Ok(new UserLoginResponse
        {
            Success = true,
            Message = "A new password has been sent to your email."
        });
    }

    // Utility endpoint to fix users with non-BCrypt passwords
    [HttpPost("fix-passwords")]
    public async Task<ActionResult> FixPasswords()
    {
        var users = await _context.Users.ToListAsync();
        int fixedCount = 0;

        foreach (var user in users)
        {
            // Check if password is not BCrypt hashed
            if (!user.Password.StartsWith("$2"))
            {
                string newPassword = GenerateSecurePassword();
                user.Password = BCrypt.Net.BCrypt.HashPassword(newPassword);
                fixedCount++;

                Console.WriteLine($"Fixed password for {user.Email} - New password: {newPassword}");
            }
        }

        if (fixedCount > 0)
        {
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = $"Fixed {fixedCount} user passwords", fixedCount });
    }

    // Endpoint to promote user to admin or create admin
    [HttpPost("create-admin")]
    public async Task<ActionResult> CreateAdmin([FromBody] CreateAdminRequest request)
    {
        // Check if user exists
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        
        if (user != null)
        {
            // Promote existing user to admin
            user.Role = "Admin";
            await _context.SaveChangesAsync();
            return Ok(new { message = $"User {user.Email} promoted to Admin", email = user.Email });
        }
        else
        {
            // Create new admin user
            string password = request.Password ?? GenerateSecurePassword();
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);

            var newAdmin = new User
            {
                Name = request.Name,
                Email = request.Email,
                Password = hashedPassword,
                Phone = request.Phone ?? "",
                Address = request.Address ?? "",
                Role = "Admin"
            };

            _context.Users.Add(newAdmin);
            await _context.SaveChangesAsync();

            Console.WriteLine("===========================================");
            Console.WriteLine($"NEW ADMIN CREATED");
            Console.WriteLine($"Email: {newAdmin.Email}");
            Console.WriteLine($"Password: {password}");
            Console.WriteLine("===========================================");

            return Ok(new { 
                message = "Admin user created successfully", 
                email = newAdmin.Email, 
                password = password 
            });
        }
    }
}

public class CreateAdminRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Password { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
}
