using System.Data.Common;
using Dsw2025Tpi.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Dsw2025Tpi.IntegrationTests;

/// <summary>
/// Levanta la API completa en memoria (entorno "Testing") reemplazando SQL Server
/// por SQLite en memoria compartida. Cada DbContext usa su propia base en memoria,
/// y las conexiones quedan abiertas para que las bases vivan durante toda la sesión de pruebas.
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Dsw2025Tpi.Api.Program>
{
    private readonly string _dbId = Guid.NewGuid().ToString("N");
    private DbConnection? _tpiConnection;
    private DbConnection? _authConnection;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            _tpiConnection = OpenSharedInMemoryConnection($"tpi_{_dbId}");
            _authConnection = OpenSharedInMemoryConnection($"auth_{_dbId}");

            ReplaceDbContext<Dsw2025TpiContext>(services, _tpiConnection);
            ReplaceDbContext<AuthenticateContext>(services, _authConnection);
        });
    }

    private static DbConnection OpenSharedInMemoryConnection(string name)
    {
        var connection = new SqliteConnection($"Data Source={name};Mode=Memory;Cache=Shared");
        connection.Open();
        return connection;
    }

    private static void ReplaceDbContext<TContext>(IServiceCollection services, DbConnection connection)
        where TContext : DbContext
    {
        // EF Core 9 registra la configuración de UseSqlServer como IDbContextOptionsConfiguration:
        // hay que quitarla también para que no queden dos proveedores (SQL Server + SQLite).
        services.RemoveAll<IDbContextOptionsConfiguration<TContext>>();
        services.RemoveAll<DbContextOptions<TContext>>();
        services.RemoveAll<TContext>();
        services.AddDbContext<TContext>(options => options.UseSqlite(connection));
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
        {
            _tpiConnection?.Dispose();
            _authConnection?.Dispose();
        }
    }
}
