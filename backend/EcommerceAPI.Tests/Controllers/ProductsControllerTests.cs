using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceAPI.Controllers;
using EcommerceAPI.Data;
using EcommerceAPI.Models;
using FluentAssertions;
using Xunit;

namespace EcommerceAPI.Tests.Controllers;

public class ProductsControllerTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly ProductsController _controller;

    public ProductsControllerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new AppDbContext(options);
        _controller = new ProductsController(_context);

        // Seed test data
        SeedTestData();
    }

    private void SeedTestData()
    {
        var category = new Category
        {
            Id = 1,
            Name = "Electronics",
            Description = "Electronic devices",
            CreatedAt = DateTime.UtcNow
        };

        var products = new List<Product>
        {
            new Product
            {
                Id = 1,
                Name = "iPhone 15",
                Description = "Latest iPhone",
                Price = 999.99m,
                Stock = 10,
                CategoryId = 1,
                ImageUrl = "https://example.com/iphone.jpg",
                ShippingCost = 0,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Id = 2,
                Name = "Samsung Galaxy",
                Description = "Android phone",
                Price = 799.99m,
                Stock = 5,
                CategoryId = 1,
                ImageUrl = "https://example.com/samsung.jpg",
                ShippingCost = 10,
                CreatedAt = DateTime.UtcNow
            }
        };

        _context.Categories.Add(category);
        _context.Products.AddRange(products);
        _context.SaveChanges();
    }

    [Fact]
    public async Task GetProducts_ReturnsPagedResult()
    {
        // Act
        var result = await _controller.GetProducts(null, null, null, 1, 10);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var pagedResult = okResult.Value.Should().BeOfType<PagedResult<Product>>().Subject;
        
        pagedResult.Items.Should().HaveCount(2);
        pagedResult.TotalCount.Should().Be(2);
        pagedResult.Page.Should().Be(1);
        pagedResult.PageSize.Should().Be(10);
    }

    [Fact]
    public async Task GetProduct_WithValidId_ReturnsProduct()
    {
        // Act
        var result = await _controller.GetProduct(1);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var product = okResult.Value.Should().BeOfType<Product>().Subject;
        
        product.Id.Should().Be(1);
        product.Name.Should().Be("iPhone 15");
    }

    [Fact]
    public async Task GetProduct_WithInvalidId_ReturnsNotFound()
    {
        // Act
        var result = await _controller.GetProduct(999);

        // Assert
        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task CreateProduct_WithValidData_ReturnsCreatedProduct()
    {
        // Arrange
        var newProduct = new Product
        {
            Name = "iPad Pro",
            Description = "Professional tablet",
            Price = 1099.99m,
            Stock = 8,
            CategoryId = 1,
            ImageUrl = "https://example.com/ipad.jpg",
            ShippingCost = 0
        };

        // Act
        var result = await _controller.CreateProduct(newProduct);

        // Assert
        result.Should().NotBeNull();
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var product = createdResult.Value.Should().BeOfType<Product>().Subject;
        
        product.Name.Should().Be("iPad Pro");
        product.Id.Should().BeGreaterThan(0);
        product.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task CreateProduct_WithInvalidData_ReturnsBadRequest()
    {
        // Arrange
        var invalidProduct = new Product
        {
            Name = "", // Invalid: empty name
            Price = -100, // Invalid: negative price
            Stock = 5,
            CategoryId = 1
        };

        // Act
        var result = await _controller.CreateProduct(invalidProduct);

        // Assert
        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task UpdateProduct_WithValidData_ReturnsNoContent()
    {
        // Arrange
        var updatedProduct = new Product
        {
            Id = 1,
            Name = "iPhone 15 Pro",
            Description = "Updated description",
            Price = 1199.99m,
            Stock = 15,
            CategoryId = 1,
            ImageUrl = "https://example.com/iphone-pro.jpg",
            ShippingCost = 0
        };

        // Act
        var result = await _controller.UpdateProduct(1, updatedProduct);

        // Assert
        result.Should().BeOfType<NoContentResult>();
        
        // Verify the product was updated
        var product = await _context.Products.FindAsync(1);
        product.Should().NotBeNull();
        product!.Name.Should().Be("iPhone 15 Pro");
        product.Price.Should().Be(1199.99m);
    }

    [Fact]
    public async Task DeleteProduct_WithValidId_ReturnsNoContent()
    {
        // Act
        var result = await _controller.DeleteProduct(1);

        // Assert
        result.Should().BeOfType<NoContentResult>();
        
        // Verify the product was deleted
        var product = await _context.Products.FindAsync(1);
        product.Should().BeNull();
    }

    [Fact]
    public async Task GetProducts_WithCategoryFilter_ReturnsFilteredResults()
    {
        // Act
        var result = await _controller.GetProducts(1, null, null, 1, 10);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var pagedResult = okResult.Value.Should().BeOfType<PagedResult<Product>>().Subject;
        
        pagedResult.Items.Should().HaveCount(2);
        pagedResult.Items.Should().OnlyContain(p => p.CategoryId == 1);
    }

    [Fact]
    public async Task GetProducts_WithSearchTerm_ReturnsMatchingResults()
    {
        // Act
        var result = await _controller.GetProducts(null, "iPhone", null, 1, 10);

        // Assert
        result.Should().NotBeNull();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var pagedResult = okResult.Value.Should().BeOfType<PagedResult<Product>>().Subject;
        
        pagedResult.Items.Should().HaveCount(1);
        pagedResult.Items.First().Name.Should().Contain("iPhone");
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}