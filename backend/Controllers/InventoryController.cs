using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceAPI.Data;
using EcommerceAPI.Models;

namespace EcommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventoryController : ControllerBase
{
    private readonly AppDbContext _context;

    public InventoryController(AppDbContext context)
    {
        _context = context;
    }

    // Get inventory report with low stock warnings
    [HttpGet("report")]
    public async Task<ActionResult<object>> GetInventoryReport()
    {
        var products = await _context.Products
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Stock,
                p.Price,
                IsLowStock = p.Stock < 5,
                IsOutOfStock = p.Stock == 0
            })
            .OrderBy(p => p.Stock)
            .ToListAsync();

        var summary = new
        {
            TotalProducts = products.Count,
            LowStockCount = products.Count(p => p.IsLowStock && !p.IsOutOfStock),
            OutOfStockCount = products.Count(p => p.IsOutOfStock),
            TotalInventoryValue = await _context.Products.SumAsync(p => p.Price * p.Stock)
        };

        return Ok(new { summary, products });
    }

    // Get low stock products
    [HttpGet("low-stock")]
    public async Task<ActionResult<IEnumerable<Product>>> GetLowStockProducts()
    {
        return await _context.Products
            .Where(p => p.Stock < 5 && p.Stock > 0)
            .ToListAsync();
    }

    // Get out of stock products
    [HttpGet("out-of-stock")]
    public async Task<ActionResult<IEnumerable<Product>>> GetOutOfStockProducts()
    {
        return await _context.Products
            .Where(p => p.Stock == 0)
            .ToListAsync();
    }

    // Get stock history for a product
    [HttpGet("history/{productId}")]
    public async Task<ActionResult<IEnumerable<StockHistory>>> GetStockHistory(int productId)
    {
        return await _context.StockHistory
            .Where(sh => sh.ProductId == productId)
            .OrderByDescending(sh => sh.CreatedAt)
            .Take(50)
            .ToListAsync();
    }

    // Adjust stock manually (for restocking, corrections, etc.)
    [HttpPost("adjust")]
    public async Task<ActionResult> AdjustStock([FromBody] StockAdjustmentRequest request)
    {
        var product = await _context.Products.FindAsync(request.ProductId);
        if (product == null)
        {
            return NotFound("Product not found");
        }

        int newStock = product.Stock + request.QuantityChange;
        if (newStock < 0)
        {
            return BadRequest("Stock cannot be negative");
        }

        product.Stock = newStock;

        var stockHistory = new StockHistory
        {
            ProductId = product.Id,
            QuantityChange = request.QuantityChange,
            StockAfter = newStock,
            Reason = request.Reason
        };
        _context.StockHistory.Add(stockHistory);

        await _context.SaveChangesAsync();

        return Ok(new { product.Id, product.Name, product.Stock });
    }
}

public class StockAdjustmentRequest
{
    public int ProductId { get; set; }
    public int QuantityChange { get; set; }
    public string Reason { get; set; } = string.Empty;
}
