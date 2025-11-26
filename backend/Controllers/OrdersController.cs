using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceAPI.Data;
using EcommerceAPI.Models;

namespace EcommerceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly Services.IEmailService _emailService;

    public OrdersController(AppDbContext context, Services.IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Order>>> GetOrders()
    {
        return await _context.Orders.Include(o => o.OrderItems).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Order>> GetOrder(int id)
    {
        var order = await _context.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound();
        return order;
    }

    [HttpPost]
    public async Task<ActionResult<Order>> CreateOrder(Order order)
    {
        // Validate stock availability for all items
        foreach (var item in order.OrderItems)
        {
            var product = await _context.Products.FindAsync(item.ProductId);
            if (product == null)
            {
                return BadRequest($"Product with ID {item.ProductId} not found");
            }
            
            if (product.Stock < item.Quantity)
            {
                return BadRequest($"Insufficient stock for {product.Name}. Available: {product.Stock}, Requested: {item.Quantity}");
            }
        }
        
        // Reduce stock and create stock history
        foreach (var item in order.OrderItems)
        {
            var product = await _context.Products.FindAsync(item.ProductId);
            if (product != null)
            {
                product.Stock -= item.Quantity;
                
                // Create stock history entry
                var stockHistory = new StockHistory
                {
                    ProductId = product.Id,
                    QuantityChange = -item.Quantity,
                    StockAfter = product.Stock,
                    Reason = $"Order #{order.Id} placed"
                };
                _context.StockHistory.Add(stockHistory);
            }
        }
        
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();
        
        // Send order confirmation email
        try
        {
            await _emailService.SendOrderConfirmationEmailAsync(order.CustomerEmail, order.CustomerName, order);
            Console.WriteLine($"✅ Order confirmation email sent for Order #{order.Id}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Failed to send order confirmation email: {ex.Message}");
            // Continue anyway - order was created successfully
        }
        
        return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] string status)
    {
        var order = await _context.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound();
        
        string oldStatus = order.Status;
        order.Status = status;
        await _context.SaveChangesAsync();
        
        // Send status update email
        try
        {
            await _emailService.SendOrderStatusUpdateEmailAsync(order.CustomerEmail, order.CustomerName, order, oldStatus);
            Console.WriteLine($"✅ Order status update email sent for Order #{order.Id}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Failed to send order status email: {ex.Message}");
            // Continue anyway - status was updated successfully
        }
        
        return NoContent();
    }
}
