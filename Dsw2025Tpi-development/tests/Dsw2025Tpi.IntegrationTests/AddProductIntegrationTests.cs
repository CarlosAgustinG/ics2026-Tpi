using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Dsw2025Tpi.Data;
using Dsw2025Tpi.Domain.Entities;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

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

    [Fact]
    public async Task AddProduct_WhenAuthenticatedAsAdmin_PersistsInSqliteAndReturnsCreated()
    {
        
        var token = await GetAdminTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var sku = "SKU-" + Guid.NewGuid().ToString("N")[..8];
        var payload = new
        {
            sku,
            internalCode = "INT-" + Guid.NewGuid().ToString("N")[..8],
            name = "Teclado Mecánico",
            description = "Teclado switch red",
            currentUnitPrice = 30000m,
            stockQuantity = 5
        };

        
        var response = await _client.PostAsJsonAsync("/api/products", payload);

       
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<Dsw2025TpiContext>();
        var saved = await context.Set<Product>().FirstOrDefaultAsync(p => p.Sku == sku);

        saved.Should().NotBeNull();
        saved!.Name.Should().Be("Teclado Mecánico");
        saved.CurrentUnitPrice.Should().Be(30000m);
        saved.StockQuantity.Should().Be(5);
    }

        [Fact]
    public async Task AddProduct_WhenSkuAlreadyExistsInDatabase_ReturnsConflictStatusCode()
    {
        
        var sku = "SKU-" + Guid.NewGuid().ToString("N")[..8];

        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<Dsw2025TpiContext>();
            context.Set<Product>().Add(
                new Product(sku, "Mouse Gamer", 15000m, 10, "Mouse RGB", "INT-" + Guid.NewGuid().ToString("N")[..8]));
            await context.SaveChangesAsync();
        }

        var token = await GetAdminTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new
        {
            sku,
            internalCode = "INT-" + Guid.NewGuid().ToString("N")[..8],
            name = "Teclado Mecánico",
            description = "Teclado switch red",
            currentUnitPrice = 30000m,
            stockQuantity = 5
        };

        
        var response = await _client.PostAsJsonAsync("/api/products", payload);

        
        response.StatusCode.Should().NotBe(HttpStatusCode.InternalServerError);
        new[] { HttpStatusCode.Conflict, HttpStatusCode.BadRequest }
            .Should().Contain(response.StatusCode);
    }
}