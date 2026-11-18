using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Dsw2025Tpi.Data;
using Dsw2025Tpi.Domain.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Dsw2025Tpi.IntegrationTests;

[Collection("IntegrationTests")]
public class CreateOrderIntegrationTests
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public CreateOrderIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // Guarda un producto directamente en la base SQLite de pruebas y devuelve su Id
    private async Task<Guid> SeedProductAsync(int stock)
    {
        var product = new Product(
            "SKU-" + Guid.NewGuid().ToString("N")[..8],
            "Mouse Gamer",
            1000m,
            stock,
            "Mouse RGB",
            "INT-" + Guid.NewGuid().ToString("N")[..8]);

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<Dsw2025TpiContext>();
        context.Set<Product>().Add(product);
        await context.SaveChangesAsync();
        return product.Id;
    }

    [Fact]
    public async Task CreateOrder_WhenUnauthenticated_ReturnsUnauthorized()
    {
        // Arrange
        var payload = new
        {
            customerId = Guid.NewGuid(),
            shippingAddress = "Av. Siempre Viva 742",
            billingAddress = "Av. Siempre Viva 742",
            notes = (string?)null,
            items = new[] { new { productId = Guid.NewGuid(), quantity = 1 } }
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/orders", payload);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}