using FluentAssertions;

namespace Dsw2025Tpi.UnitTests;

/// <summary>
/// Prueba "dummy" que solo verifica que el proyecto de pruebas unitarias
/// se descubre y se ejecuta correctamente.
/// </summary>
public class SmokeTests
{
    [Fact]
    public void UnitTestProject_IsConfigured_RunsSuccessfully()
    {
        // Arrange
        var expected = 2;

        // Act
        var result = 1 + 1;

        // Assert
        result.Should().Be(expected);
    }
}
