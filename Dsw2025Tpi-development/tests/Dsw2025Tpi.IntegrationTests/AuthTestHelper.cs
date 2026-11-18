using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Dsw2025Tpi.IntegrationTests;

/// <summary>
/// Ayudas compartidas por las pruebas de integración para obtener tokens JWT reales,
/// pasando por los endpoints de autenticación de la API.
/// </summary>
public static class AuthTestHelper
{
    /// <summary>
    /// Crea un usuario con rol Admin en la base de pruebas, hace login y devuelve su token.
    /// </summary>
    public static async Task<string> GetAdminTokenAsync(CustomWebApplicationFactory factory, HttpClient client)
    {
        var username = "admin" + Guid.NewGuid().ToString("N")[..8];
        var password = "Admin#12345a";

        using (var scope = factory.Services.CreateScope())
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

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new { username, password });
        loginResponse.EnsureSuccessStatusCode();

        var body = await loginResponse.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("token").GetString()!;
    }

    /// <summary>
    /// Registra un cliente nuevo con POST /api/auth/register (crea el usuario y su Customer)
    /// y devuelve su token y el Id del cliente.
    /// </summary>
    public static async Task<(string Token, Guid CustomerId)> RegisterClientAsync(HttpClient client)
    {
        var username = "cliente" + Guid.NewGuid().ToString("N")[..8];
        var register = new
        {
            username,
            password = "Cliente#12345a",
            email = $"{username}@test.com"
        };

        var response = await client.PostAsJsonAsync("/api/auth/register", register);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        var token = body.GetProperty("token").GetString()!;
        var customerId = body.GetProperty("customerId").GetGuid();
        return (token, customerId);
    }
}