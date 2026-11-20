namespace Dsw2025Tpi.UnitTests.Services;

public class DemoFalloTests
{
    [Fact]
    public void Demo_PruebaQueFallaAPropositoParaBloquearElDeploy()
    {
        Assert.True(false, "Fallo intencional para demostrar que el deploy se bloquea");
    }
}