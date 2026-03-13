using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using EcommerceAPI.Data;
using EcommerceAPI.Models;
using FluentAssertions;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace EcommerceAPI.Tests.Integration;

public class ProductsIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public ProductsIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Remove the existing DbContext registration
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor != null)
                    services.Remove(descriptor);

                // Add in-memory database for testing
                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TestDb");
                });
            });
        });

        _client = _factory.CreateClient();
        SeedDatabase();
    }

    private void SeedDatabase()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        
        context.Database.EnsureDeleted();
        context.Database.EnsureCreated();

        var category = new Category
        {
            Id = 1,
            Name = "Electronics",
            Description = "Electronic devices",
            CreatedAt = DateTime.UtcNow
        };

        var product = new Product
        {
            Id = 1,
            Name = "Test Product",
            Description = "Test Description",
            Price = 99.99m,
            Stock = 10,
            CategoryId = 1,
            ImageUrl = "https://example.com/test.jpg",
            ShippingCost = 5.99m,
            CreatedAt = DateTime.UtcNow
        };

        context.Categories.Add(category);
        context.Products.Add(product);
        context.SaveChanges();
    }

    [Fact]
    public async Task GetProducts_ReturnsSuccessAndCorrectContentType()
    {
        // Act
        var response = await _client.GetAsync("/api/products");

        // Assert
        response.EnsureSuccessStatusCode();
        response.Content.Headers.ContentType?.ToString()
            .Should().Contain("application/json");
    }

    [Fact]
    public async Task GetProducts_ReturnsPagedResults()
    {
        // Act
        var response = await _client.GetAsync("/api/products?page=1&pageSize=10");
        var result = await response.Content.ReadFromJsonAsync<PagedResult<Product>>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        result.Should().NotBeNull();
        result!.Items.Should().HaveCount(1);
        result.TotalCount.Should().Be(1);
        result.Page.Should().Be(1);
        result.PageSize.Should().Be(10);
    }

    [Fact]
    public async Task GetProduct_WithValidId_ReturnsProduct()
    {
        // Act
        var response = await _client.GetAsync("/api/products/1");
        var product = await response.Content.ReadFromJsonAsync<Product>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        product.Should().NotBeNull();
        product!.Id.Should().Be(1);
        product.Name.Should().Be("Test Product");
    }

    [Fact]
    public async Task GetProduct_WithInvalidId_ReturnsNotFound()
    {
        // Act
        var response = await _client.GetAsync("/api/products/999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateProduct_WithValidData_ReturnsCreated()
    {
        // Arrange
        var newProduct = new Product
        {
            Name = "New Product",
            Description = "New Description",
            Price = 149.99m,
            Stock = 5,
            CategoryId = 1,
            ImageUrl = "https://example.com/new.jpg",
            ShippingCost = 7.99m
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/products", newProduct);
        var createdProduct = await response.Content.ReadFromJsonAsync<Product>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        createdProduct.Should().NotBeNull();
        createdProduct!.Name.Should().Be("New Product");
        createdProduct.Id.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task CreateProduct_WithInvalidData_ReturnsBadRequest()
    {
        // Arrange
        var invalidProduct = new Product
        {
            Name = "", // Invalid: empty name
            Price = -10, // Invalid: negative price
            Stock = 5,
            CategoryId = 1
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/products", invalidProduct);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateProduct_WithValidData_ReturnsNoContent()
    {
        // Arrange
        var updatedProduct = new Product
        {
            Id = 1,
            Name = "Updated Product",
            Description = "Updated Description",
            Price = 199.99m,
            Stock = 15,
            CategoryId = 1,
            ImageUrl = "https://example.com/updated.jpg",
            ShippingCost = 9.99m
        };

        // Act
        var response = await _client.PutAsJsonAsync("/api/products/1", updatedProduct);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteProduct_WithValidId_ReturnsNoContent()
    {
        // Act
        var response = await _client.DeleteAsync("/api/products/1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task GetProducts_WithPagination_ReturnsCorrectPage()
    {
        // Arrange - Add more products for pagination testing
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        
        for (int i = 2; i <= 15; i++)
        {
            context.Products.Add(new Product
            {
                Id = i,
                Name = $"Product {i}",
                Description = $"Description {i}",
                Price = i * 10,
                Stock = i,
                CategoryId = 1,
                ImageUrl = $"https://example.com/product{i}.jpg",
                ShippingCost = 5,
                CreatedAt = DateTime.UtcNow
            });
        }
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync("/api/products?page=2&pageSize=5");
        var result = await response.Content.ReadFromJsonAsync<PagedResult<Product>>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        result.Should().NotBeNull();
        result!.Items.Should().HaveCount(5);
        result.Page.Should().Be(2);
        result.PageSize.Should().Be(5);
        result.TotalCount.Should().Be(15);
        result.TotalPages.Should().Be(3);
    }
}