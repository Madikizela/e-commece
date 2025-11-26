using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceAPI.Data;
using EcommerceAPI.Models;

namespace EcommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductImagesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProductImagesController(AppDbContext context)
    {
        _context = context;
    }

    // Get all images for a product
    [HttpGet("product/{productId}")]
    public async Task<ActionResult<IEnumerable<ProductImage>>> GetProductImages(int productId)
    {
        return await _context.ProductImages
            .Where(pi => pi.ProductId == productId)
            .OrderBy(pi => pi.DisplayOrder)
            .ToListAsync();
    }

    // Add image to product
    [HttpPost]
    public async Task<ActionResult<ProductImage>> AddProductImage([FromBody] ProductImageRequest request)
    {
        var product = await _context.Products.FindAsync(request.ProductId);
        if (product == null)
        {
            return NotFound("Product not found");
        }

        // Check if product already has 5 images
        var imageCount = await _context.ProductImages.CountAsync(pi => pi.ProductId == request.ProductId);
        if (imageCount >= 5)
        {
            return BadRequest("Product can have maximum 5 images");
        }

        // If this is the first image or marked as primary, set it as primary
        var isPrimary = imageCount == 0 || request.IsPrimary;
        
        // If setting as primary, unset other primary images
        if (isPrimary)
        {
            var existingPrimary = await _context.ProductImages
                .Where(pi => pi.ProductId == request.ProductId && pi.IsPrimary)
                .ToListAsync();
            
            foreach (var img in existingPrimary)
            {
                img.IsPrimary = false;
            }
        }

        var productImage = new ProductImage
        {
            ProductId = request.ProductId,
            ImageUrl = request.ImageUrl,
            DisplayOrder = request.DisplayOrder > 0 ? request.DisplayOrder : imageCount + 1,
            IsPrimary = isPrimary
        };

        _context.ProductImages.Add(productImage);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProductImages), new { productId = request.ProductId }, productImage);
    }

    // Update image
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProductImage(int id, [FromBody] ProductImageUpdateRequest request)
    {
        var image = await _context.ProductImages.FindAsync(id);
        if (image == null)
        {
            return NotFound();
        }

        if (!string.IsNullOrEmpty(request.ImageUrl))
        {
            image.ImageUrl = request.ImageUrl;
        }

        if (request.DisplayOrder.HasValue)
        {
            image.DisplayOrder = request.DisplayOrder.Value;
        }

        if (request.IsPrimary.HasValue && request.IsPrimary.Value)
        {
            // Unset other primary images
            var existingPrimary = await _context.ProductImages
                .Where(pi => pi.ProductId == image.ProductId && pi.IsPrimary && pi.Id != id)
                .ToListAsync();
            
            foreach (var img in existingPrimary)
            {
                img.IsPrimary = false;
            }
            
            image.IsPrimary = true;
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // Delete image
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProductImage(int id)
    {
        var image = await _context.ProductImages.FindAsync(id);
        if (image == null)
        {
            return NotFound();
        }

        _context.ProductImages.Remove(image);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // Reorder images
    [HttpPost("reorder")]
    public async Task<IActionResult> ReorderImages([FromBody] ReorderImagesRequest request)
    {
        foreach (var item in request.Images)
        {
            var image = await _context.ProductImages.FindAsync(item.Id);
            if (image != null)
            {
                image.DisplayOrder = item.DisplayOrder;
            }
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class ProductImageRequest
{
    public int ProductId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsPrimary { get; set; }
}

public class ProductImageUpdateRequest
{
    public string? ImageUrl { get; set; }
    public int? DisplayOrder { get; set; }
    public bool? IsPrimary { get; set; }
}

public class ReorderImagesRequest
{
    public List<ImageOrderItem> Images { get; set; } = new();
}

public class ImageOrderItem
{
    public int Id { get; set; }
    public int DisplayOrder { get; set; }
}
