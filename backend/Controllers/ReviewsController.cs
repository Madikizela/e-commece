using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceAPI.Data;
using EcommerceAPI.Models;

namespace EcommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReviewsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("product/{productId}")]
    public async Task<ActionResult<IEnumerable<Review>>> GetProductReviews(int productId)
    {
        return await _context.Reviews
            .Where(r => r.ProductId == productId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Review>> CreateReview(Review review)
    {
        // Check if user has purchased this product
        var hasPurchased = await _context.Orders
            .Include(o => o.OrderItems)
            .AnyAsync(o => o.CustomerEmail == review.UserName && 
                          o.OrderItems.Any(oi => oi.ProductId == review.ProductId));

        if (!hasPurchased)
        {
            return BadRequest("You can only review products you have purchased");
        }

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetProductReviews), new { productId = review.ProductId }, review);
    }

    [HttpGet("product/{productId}/average")]
    public async Task<ActionResult<object>> GetAverageRating(int productId)
    {
        var reviews = await _context.Reviews.Where(r => r.ProductId == productId).ToListAsync();
        if (!reviews.Any())
        {
            return Ok(new { average = 0.0, count = 0 });
        }

        var average = reviews.Average(r => r.Rating);
        return Ok(new { average = Math.Round(average, 1), count = reviews.Count });
    }
}
