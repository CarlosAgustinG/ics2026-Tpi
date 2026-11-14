using System.Net;
using System.Net.Http.Json;
using FluentAssertions;

namespace Dsw2025Tpi.IntegrationTests;

[Collection("IntegrationTests")]
public class AddProductIntegrationTests
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AddProductIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task AddProduct_WhenUnauthenticatedOrNotAdmin_ReturnsUnauthorizedOrForbidden()
    {
        var payload = new
        {
            sku = "SKU-INT-001",
            internalCode = "INT-INT-001",
            name = "Mouse Gamer",
            description = "Mouse RGB 7200 DPI",
            currentUnitPrice = 15000m,
            stockQuantity = 10
        };

        var response = await _client.PostAsJsonAsync("/api/products", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}