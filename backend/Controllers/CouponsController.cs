using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceAPI.Data;
using EcommerceAPI.Models;
using Microsoft.AspNetCore.Authorization;

namespace EcommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CouponsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<CouponsController> _logger;

    public CouponsController(AppDbContext context, ILogger<CouponsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<PagedResult<Coupon>>> GetCoupons(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? isActive = null)
    {
        // Validate pagination parameters
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        var query = _context.Coupons.AsQueryable();

        // Filter by active status if provided
        if (isActive.HasValue)
        {
            query = query.Where(c => c.IsActive == isActive.Value);
        }

        // Order by creation date (newest first)
        query = query.OrderByDescending(c => c.CreatedAt);

        // Get total count for pagination
        var totalCount = await query.CountAsync();
        
        // Apply pagination
        var coupons = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new PagedResult<Coupon>
        {
            Items = coupons,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        };

        return Ok(result);
    }

    [HttpGet("validate/{code}")]
    public async Task<ActionResult<Coupon>> ValidateCouponByCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return BadRequest("Invalid coupon code");
        }

        var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == code.Trim().ToUpper());

        if (coupon == null)
        {
            _logger.LogWarning("Invalid coupon code attempted: {Code}", code);
            return BadRequest("Invalid coupon code");
        }

        if (!coupon.IsActive)
        {
            return BadRequest("Coupon is no longer active");
        }

        if (coupon.ExpiryDate.HasValue && coupon.ExpiryDate.Value < DateTime.UtcNow)
        {
            return BadRequest("Coupon has expired");
        }

        if (coupon.UsageLimit.HasValue && coupon.UsageCount >= coupon.UsageLimit.Value)
        {
            return BadRequest("Coupon usage limit reached");
        }

        _logger.LogInformation("Coupon validated successfully: {Code}", code);
        return Ok(coupon);
    }

    [HttpPost("validate")]
    public async Task<ActionResult<object>> ValidateCoupon([FromBody] ValidateCouponRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
        {
            return BadRequest(new { valid = false, message = "Coupon code is required" });
        }

        var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == request.Code.Trim().ToUpper());

        if (coupon == null)
        {
            _logger.LogWarning("Invalid coupon code attempted: {Code}", request.Code);
            return NotFound(new { valid = false, message = "Invalid coupon code" });
        }

        if (!coupon.IsActive)
        {
            return Ok(new { valid = false, message = "Coupon is no longer active" });
        }

        if (coupon.ExpiryDate.HasValue && coupon.ExpiryDate.Value < DateTime.UtcNow)
        {
            return Ok(new { valid = false, message = "Coupon has expired" });
        }

        if (coupon.UsageLimit.HasValue && coupon.UsageCount >= coupon.UsageLimit.Value)
        {
            return Ok(new { valid = false, message = "Coupon usage limit reached" });
        }

        _logger.LogInformation("Coupon validated successfully: {Code}", request.Code);
        return Ok(new { 
            valid = true, 
            discountType = coupon.DiscountType,
            discountValue = coupon.DiscountValue,
            message = "Coupon applied successfully"
        });
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<Coupon>> CreateCoupon(Coupon coupon)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Validate required fields
        if (string.IsNullOrWhiteSpace(coupon.Code))
        {
            return BadRequest("Coupon code is required");
        }

        if (coupon.DiscountValue <= 0)
        {
            return BadRequest("Discount value must be greater than 0");
        }

        // Normalize coupon code
        coupon.Code = coupon.Code.Trim().ToUpper();

        // Check if coupon code already exists
        var existingCoupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == coupon.Code);
        if (existingCoupon != null)
        {
            return BadRequest("Coupon code already exists");
        }

        // Set creation date
        coupon.CreatedAt = DateTime.UtcNow;
        coupon.UsageCount = 0;

        _context.Coupons.Add(coupon);
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Coupon created: {Code}", coupon.Code);
        return CreatedAtAction(nameof(GetCoupons), new { id = coupon.Id }, coupon);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateCoupon(int id, Coupon coupon)
    {
        if (id != coupon.Id) return BadRequest("ID mismatch");
        
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Validate required fields
        if (string.IsNullOrWhiteSpace(coupon.Code))
        {
            return BadRequest("Coupon code is required");
        }

        if (coupon.DiscountValue <= 0)
        {
            return BadRequest("Discount value must be greater than 0");
        }

        var existingCoupon = await _context.Coupons.FindAsync(id);
        if (existingCoupon == null)
        {
            return NotFound();
        }

        // Normalize coupon code
        coupon.Code = coupon.Code.Trim().ToUpper();

        // Check if coupon code already exists (excluding current coupon)
        var duplicateCoupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == coupon.Code && c.Id != id);
        if (duplicateCoupon != null)
        {
            return BadRequest("Coupon code already exists");
        }

        // Update fields
        existingCoupon.Code = coupon.Code;
        existingCoupon.DiscountType = coupon.DiscountType;
        existingCoupon.DiscountValue = coupon.DiscountValue;
        existingCoupon.IsActive = coupon.IsActive;
        existingCoupon.ExpiryDate = coupon.ExpiryDate;
        existingCoupon.UsageLimit = coupon.UsageLimit;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!CouponExists(id))
            {
                return NotFound();
            }
            throw;
        }

        _logger.LogInformation("Coupon updated: {Code}", coupon.Code);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteCoupon(int id)
    {
        var coupon = await _context.Coupons.FindAsync(id);
        if (coupon == null) return NotFound();
        
        _context.Coupons.Remove(coupon);
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Coupon deleted: {Code}", coupon.Code);
        return NoContent();
    }

    [HttpPost("create-test-coupons")]
    public async Task<ActionResult> CreateTestCoupons()
    {
        var testCoupons = new List<Coupon>
        {
            new Coupon
            {
                Code = "SAVE10",
                DiscountType = "Percentage",
                DiscountValue = 10,
                IsActive = true,
                ExpiryDate = DateTime.UtcNow.AddMonths(3),
                UsageLimit = 100,
                UsageCount = 0,
                CreatedAt = DateTime.UtcNow
            },
            new Coupon
            {
                Code = "WELCOME20",
                DiscountType = "Percentage",
                DiscountValue = 20,
                IsActive = true,
                ExpiryDate = DateTime.UtcNow.AddMonths(6),
                UsageLimit = 50,
                UsageCount = 0,
                CreatedAt = DateTime.UtcNow
            },
            new Coupon
            {
                Code = "FIXED50",
                DiscountType = "Fixed",
                DiscountValue = 50,
                IsActive = true,
                ExpiryDate = DateTime.UtcNow.AddMonths(1),
                UsageLimit = 25,
                UsageCount = 0,
                CreatedAt = DateTime.UtcNow
            }
        };

        foreach (var coupon in testCoupons)
        {
            var existing = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == coupon.Code);
            if (existing == null)
            {
                _context.Coupons.Add(coupon);
            }
        }

        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Test coupons created");
        return Ok(new { 
            message = "Test coupons created successfully", 
            coupons = testCoupons.Select(c => new { c.Code, c.DiscountType, c.DiscountValue }).ToList()
        });
    }

    [HttpPost("create-sample")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> CreateSampleCoupons()
    {
        var sampleCoupons = new List<Coupon>
        {
            new Coupon
            {
                Code = "SAVE10",
                DiscountType = "Percentage",
                DiscountValue = 10,
                IsActive = true,
                ExpiryDate = DateTime.UtcNow.AddMonths(3),
                UsageLimit = 100,
                UsageCount = 0,
                CreatedAt = DateTime.UtcNow
            },
            new Coupon
            {
                Code = "WELCOME20",
                DiscountType = "Percentage",
                DiscountValue = 20,
                IsActive = true,
                ExpiryDate = DateTime.UtcNow.AddMonths(6),
                UsageLimit = 50,
                UsageCount = 0,
                CreatedAt = DateTime.UtcNow
            },
            new Coupon
            {
                Code = "FIXED50",
                DiscountType = "Fixed",
                DiscountValue = 50,
                IsActive = true,
                ExpiryDate = DateTime.UtcNow.AddMonths(1),
                UsageLimit = 25,
                UsageCount = 0,
                CreatedAt = DateTime.UtcNow
            }
        };

        foreach (var coupon in sampleCoupons)
        {
            var existing = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == coupon.Code);
            if (existing == null)
            {
                _context.Coupons.Add(coupon);
            }
        }

        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Sample coupons created");
        return Ok(new { message = "Sample coupons created successfully", coupons = sampleCoupons.Select(c => c.Code) });
    }

    private bool CouponExists(int id)
    {
        return _context.Coupons.Any(e => e.Id == id);
    }
}
