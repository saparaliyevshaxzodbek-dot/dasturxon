using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Restaurant.Business;
using Restaurant.Data;
using Restaurant.Data.Entities;

namespace Restaurant.WebApi.Infrastructure;

public static class DatabaseInitializer
{
    /// <summary>Creates or upgrades the database file and fills it with the menu and demo staff.</summary>
    public static async Task InitializeDatabaseAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var services = scope.ServiceProvider;

        var db = services.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
        await DbSeeder.SeedAsync(
            db,
            services.GetRequiredService<IPasswordHasher<StaffUser>>(),
            services.GetRequiredService<IOptions<SeedOptions>>().Value,
            services.GetRequiredService<TimeProvider>());
    }
}
