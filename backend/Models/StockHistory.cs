namespace EcommerceAPI.Models;

public class StockHistory
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int QuantityChange { get; set; }
    public int StockAfter { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Product? Product { get; set; }
}
