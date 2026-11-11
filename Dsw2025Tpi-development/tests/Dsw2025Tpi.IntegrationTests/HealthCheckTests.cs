using System.Net;
using FluentAssertions;

namespace Dsw2025Tpi.IntegrationTests;

/// <summary>
/// Prueba "dummy" que verifica que la API levanta en memoria con SQLite
/// (CustomWebApplicationFactory) y responde a una petición HTTP real.
/// </summary>
[Collection("IntegrationTests")]
public class HealthCheckTests
{
    private readonly HttpClient _client;

    public HealthCheckTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task HealthCheck_WhenApiIsRunning_ReturnsOk()
    {
        // Act
        var response = await _client.GetAsync("/healthcheck");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
