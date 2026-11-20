using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Dsw2025Tpi.Data;
using Dsw2025Tpi.Domain.Entities;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Dsw2025Tpi.IntegrationTests;

[Collection("IntegrationTests")]
public class ListProductsIntegrationTests
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ListProductsIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // Crea un usuario con rol Admin en la base de pruebas y devuelve su token JWT
    private async Task<string> GetAdminTokenAsync()
    {
        var username = "admin" + Guid.NewGuid().ToString("N")[..8];
        var password = "Admin#12345a";

        using (var scope = _factory.Services.CreateScope())
        {
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            if (!await roleManager.RoleExistsAsync("Admin"))
            {
                await roleManager.CreateAsync(new IdentityRole("Admin"));
            }

            var user = new IdentityUser { UserName = username, Email = $"{username}@test.com" };
            var created = await userManager.CreateAsync(user, password);
            created.Succeeded.Should().BeTrue(string.Join(", ", created.Errors.Select(e => e.Description)));

            await userManager.AddToRoleAsync(user, "Admin");
        }

        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new { username, password });
        loginResponse.EnsureSuccessStatusCode();

        var body = await loginResponse.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("token").GetString()!;
    }

    // Inserta un producto directamente en la base SQLite de pruebas
    private async Task SeedProductAsync(string name, bool isActive = true)
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<Dsw2025TpiContext>();

        context.Set<Product>().Add(new Product(
            "SKU-" + Guid.NewGuid().ToString("N")[..8],
            name,
            15000m,
            10,
            "Descripción de prueba",
            "INT-" + Guid.NewGuid().ToString("N")[..8]) { IsActive = isActive });

        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task GetProducts_PublicEndpoint_ReturnsOkWithPaginatedJsonStructure()
    {
        // Arrange: aseguramos que haya al menos un producto activo en la base
        await SeedProductAsync("Producto publico " + Guid.NewGuid().ToString("N")[..6]);

        // Act: GET anónimo, sin token en el header Authorization
        var response = await _client.GetAsync("/api/products");

        // Assert: respuesta exitosa
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        // Assert: el cuerpo tiene la estructura de paginación
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        body.TryGetProperty("productItems", out var items).Should().BeTrue();
        items.ValueKind.Should().Be(JsonValueKind.Array);
        items.GetArrayLength().Should().BeGreaterThan(0);

        var hasTotal = body.TryGetProperty("total", out var totalValue)
            || body.TryGetProperty("totalItems", out var totalItemsValue);
        hasTotal.Should().BeTrue();
    }
}