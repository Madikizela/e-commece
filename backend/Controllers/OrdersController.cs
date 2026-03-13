using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceAPI.Data;
using EcommerceAPI.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace EcommerceAPI.Controllers;

public class TestEmailRequest
{
    public string Email { get; set; } = "";
}

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly Services.IEmailService _emailService;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(AppDbContext context, Services.IEmailService emailService, ILogger<OrdersController> logger)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<Order>>> GetOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null)
    {
        // Validate pagination parameters
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 50) pageSize = 10;

        var query = _context.Orders.Include(o => o.OrderItems).AsQueryable();

        // Filter by status if provided
        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(o => o.Status == status);
        }

        // Order by creation date (newest first)
        query = query.OrderByDescending(o => o.CreatedAt);

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

    [HttpGet("{id}")]
    public async Task<ActionResult<Order>> GetOrder(int id)
    {
        if (id <= 0)
        {
            return BadRequest("Invalid order ID");
        }

        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == id);
            
        if (order == null) return NotFound();

        return order;
    }

    [HttpPost("test")]
    public ActionResult TestOrderCreation()
    {
        return Ok(new { message = "Order creation endpoint is accessible", timestamp = DateTime.UtcNow });
    }

    [HttpPost("test-email")]
    public async Task<IActionResult> TestEmail([FromBody] TestEmailRequest request)
    {
        try
        {
            await _emailService.SendPasswordEmailAsync(
                request.Email, 
                "Test User", 
                "TestPassword123"
            );
            
            return Ok(new { success = true, message = "Test email sent successfully!" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send test email to {Email}", request.Email);
            return BadRequest(new { success = false, message = $"Failed to send email: {ex.Message}" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<Order>> CreateOrder(Order order)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Validate required fields
        if (string.IsNullOrWhiteSpace(order.CustomerName) || 
            string.IsNullOrWhiteSpace(order.CustomerEmail) ||
            string.IsNullOrWhiteSpace(order.ShippingAddress))
        {
            return BadRequest("Customer name, email, and shipping address are required");
        }

        if (order.OrderItems == null || !order.OrderItems.Any())
        {
            return BadRequest("Order must contain at least one item");
        }

        // Set order metadata
        order.CreatedAt = DateTime.UtcNow;
        order.Status = "Pending";

        // Validate stock availability for all items
        foreach (var item in order.OrderItems)
        {
            if (item.Quantity <= 0)
            {
                return BadRequest($"Invalid quantity for item: {item.Quantity}");
            }

            var product = await _context.Products.FindAsync(item.ProductId);
            if (product == null)
            {
                return BadRequest($"Product with ID {item.ProductId} not found");
            }
            
            if (product.Stock < item.Quantity)
            {
                return BadRequest($"Insufficient stock for {product.Name}. Available: {product.Stock}, Requested: {item.Quantity}");
            }

            // Set product details in order item
            item.ProductName = product.Name;
            item.Price = product.Price;
        }

        // Calculate total amount
        order.TotalAmount = order.OrderItems.Sum(item => item.Price * item.Quantity);
        
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
                    Reason = $"Order #{order.Id} placed",
                    CreatedAt = DateTime.UtcNow
                };
                _context.StockHistory.Add(stockHistory);
            }
        }
        
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();
        
        // Send order confirmation email in background
        _ = Task.Run(async () =>
        {
            try
            {
                await _emailService.SendOrderConfirmationEmailAsync(order.CustomerEmail, order.CustomerName, order);
                _logger.LogInformation("Order confirmation email sent for Order #{OrderId}", order.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send order confirmation email for Order #{OrderId}", order.Id);
            }
        });
        
        return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusRequest request)
    {
        _logger.LogInformation("UpdateOrderStatus called for order {OrderId} with status {Status}", id, request?.Status);
        
        // Log authorization header for debugging
        var authHeader = Request.Headers.Authorization.FirstOrDefault();
        _logger.LogInformation("Authorization header: {AuthHeader}", authHeader ?? "None");

        if (request == null || string.IsNullOrWhiteSpace(request.Status))
        {
            return BadRequest("Status is required");
        }

        var validStatuses = new[] { "Pending", "Processing", "Shipped", "Delivered", "Cancelled" };
        if (!validStatuses.Contains(request.Status))
        {
            return BadRequest($"Invalid status. Valid statuses are: {string.Join(", ", validStatuses)}");
        }

        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == id);
            
        if (order == null) return NotFound();
        
        string oldStatus = order.Status;
        if (oldStatus == request.Status)
        {
            return BadRequest("Order is already in the specified status");
        }

        order.Status = request.Status;
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Order {OrderId} status updated from {OldStatus} to {NewStatus}", id, oldStatus, request.Status);
        
        // Send status update email in background
        _ = Task.Run(async () =>
        {
            try
            {
                await _emailService.SendOrderStatusUpdateEmailAsync(order.CustomerEmail, order.CustomerName, order, oldStatus);
                _logger.LogInformation("Order status update email sent for Order #{OrderId}", order.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send order status email for Order #{OrderId}", order.Id);
            }
        });
        
        return NoContent();
    }
}
