using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceAPI.Data;
using EcommerceAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Caching.Memory;

namespace EcommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<CategoriesController> _logger;
    private readonly IMemoryCache _cache;
    private const string CATEGORIES_CACHE_KEY = "all_categories";
    private const int CACHE_DURATION_MINUTES = 30;

    public CategoriesController(AppDbContext context, ILogger<CategoriesController> logger, IMemoryCache cache)
    {
        _context = context;
        _logger = logger;
        _cache = cache;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
    {
        // Try to get categories from cache first
        if (_cache.TryGetValue(CATEGORIES_CACHE_KEY, out List<Category>? cachedCategories))
        {
            return Ok(cachedCategories);
        }

        // If not in cache, get from database
        var categories = await _context.Categories
            .OrderBy(c => c.Name)
            .ToListAsync();

        // Cache the result
        _cache.Set(CATEGORIES_CACHE_KEY, categories, TimeSpan.FromMinutes(CACHE_DURATION_MINUTES));

        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Category>> GetCategory(int id)
    {
        if (id <= 0)
        {
            return BadRequest("Invalid category ID");
        }

        var category = await _context.Categories.FindAsync(id);
        if (category == null) return NotFound();
        return category;
    }

    [HttpPost]
    // [Authorize(Policy = "AdminOnly")] // Temporarily removed for testing
    public async Task<ActionResult<Category>> CreateCategory(Category category)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Validate required fields
        if (string.IsNullOrWhiteSpace(category.Name))
        {
            return BadRequest("Category name is required");
        }

        // Check if category name already exists
        var existingCategory = await _context.Categories
            .FirstOrDefaultAsync(c => c.Name.ToLower() == category.Name.ToLower());
        if (existingCategory != null)
        {
            return BadRequest("Category name already exists");
        }

        // Set creation date
        category.CreatedAt = DateTime.UtcNow;

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        // Clear cache
        _cache.Remove(CATEGORIES_CACHE_KEY);

        _logger.LogInformation("Category created: {Name}", category.Name);
        return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
    }

    [HttpPut("{id}")]
    // [Authorize(Policy = "AdminOnly")] // Temporarily removed for testing
    public async Task<IActionResult> UpdateCategory(int id, Category category)
    {
        if (id != category.Id) return BadRequest("ID mismatch");
        
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Validate required fields
        if (string.IsNullOrWhiteSpace(category.Name))
        {
            return BadRequest("Category name is required");
        }

        var existingCategory = await _context.Categories.FindAsync(id);
        if (existingCategory == null)
        {
            return NotFound();
        }

        // Check if category name already exists (excluding current category)
        var duplicateCategory = await _context.Categories
            .FirstOrDefaultAsync(c => c.Name.ToLower() == category.Name.ToLower() && c.Id != id);
        if (duplicateCategory != null)
        {
            return BadRequest("Category name already exists");
        }

        // Update fields
        existingCategory.Name = category.Name;
        existingCategory.Description = category.Description;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!CategoryExists(id))
            {
                return NotFound();
            }
            throw;
        }

        // Clear cache
        _cache.Remove(CATEGORIES_CACHE_KEY);

        _logger.LogInformation("Category updated: {Name}", category.Name);
        return NoContent();
    }

    [HttpDelete("{id}")]
    // [Authorize(Policy = "AdminOnly")] // Temporarily removed for testing
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return NotFound();

        // Check if category has products
        var hasProducts = await _context.Products.AnyAsync(p => p.CategoryId == id);
        if (hasProducts)
        {
            return BadRequest("Cannot delete category that has products. Please move or delete the products first.");
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        // Clear cache
        _cache.Remove(CATEGORIES_CACHE_KEY);

        _logger.LogInformation("Category deleted: {Name}", category.Name);
        return NoContent();
    }

    private bool CategoryExists(int id)
    {
        return _context.Categories.Any(e => e.Id == id);
    }
}
