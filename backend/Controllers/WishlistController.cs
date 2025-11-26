using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceAPI.Data;
using EcommerceAPI.Models;

namespace EcommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WishlistController : ControllerBase
{
    private readonly AppDbContext _context;

    public WishlistController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IEnumerable<Wishlist>>> GetUserWishlist(int userId)
    {
        return await _context.Wishlists
            .Include(w => w.Product)
            .Where(w => w.UserId == userId)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Wishlist>> AddToWishlist(Wishlist wishlist)
    {
        // Check if already in wishlist
        var existing = await _context.Wishlists
            .FirstOrDefaultAsync(w => w.UserId == wishlist.UserId && w.ProductId == wishlist.ProductId);

        if (existing != null)
        {
            return BadRequest("Product already in wishlist");
        }

        _context.Wishlists.Add(wishlist);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetUserWishlist), new { userId = wishlist.UserId }, wishlist);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> RemoveFromWishlist(int id)
    {
        var wishlist = await _context.Wishlists.FindAsync(id);
        if (wishlist == null) return NotFound();
        _context.Wishlists.Remove(wishlist);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
