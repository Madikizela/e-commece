using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceAPI.Data;
using EcommerceAPI.Models;

namespace EcommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CouponsController : ControllerBase
{
    private readonly AppDbContext _context;

    public CouponsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Coupon>>> GetCoupons()
    {
        return await _context.Coupons.ToListAsync();
    }

    [HttpPost("validate")]
    public async Task<ActionResult<object>> ValidateCoupon([FromBody] string code)
    {
        var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == code);

        if (coupon == null)
        {
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

        return Ok(new { 
            valid = true, 
            discountType = coupon.DiscountType,
            discountValue = coupon.DiscountValue,
            message = "Coupon applied successfully"
        });
    }

    [HttpPost]
    public async Task<ActionResult<Coupon>> CreateCoupon(Coupon coupon)
    {
        _context.Coupons.Add(coupon);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetCoupons), new { id = coupon.Id }, coupon);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCoupon(int id, Coupon coupon)
    {
        if (id != coupon.Id) return BadRequest();
        _context.Entry(coupon).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCoupon(int id)
    {
        var coupon = await _context.Coupons.FindAsync(id);
        if (coupon == null) return NotFound();
        _context.Coupons.Remove(coupon);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
