using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Restaurant.Business;
using Restaurant.Business.Dtos;
using Restaurant.Data;
using Restaurant.Data.Entities;

namespace Restaurant.Tests;

/// <summary>A real SQLite database in memory, so tests hit the same provider quirks as the app.</summary>
public sealed class TestDb : IDisposable
{
    private readonly SqliteConnection connection = new("DataSource=:memory:");

    public TestDb()
    {
        this.connection.Open();
        using var db = this.CreateContext();
        db.Database.EnsureCreated();
    }

    public AppDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(this.connection).Options);

    public void Dispose() => this.connection.Dispose();

    public async Task<(Category Category, Product Shashlik, Product Osh)> SeedMenuAsync()
    {
        await using var db = this.CreateContext();
        var category = new Category { Name = "Taomlar" };
        var shashlik = new Product { Category = category, Name = "Shashlik", Price = 28_000 };
        var osh = new Product { Category = category, Name = "Osh", Price = 45_000 };
        db.Products.AddRange(shashlik, osh);
        await db.SaveChangesAsync();
        return (category, shashlik, osh);
    }

    /// <summary>A zone with a 15 000 fee, 50 000 minimum and free delivery from 200 000.</summary>
    public async Task<DeliveryZone> SeedZoneAsync()
    {
        await using var db = this.CreateContext();
        var zone = new DeliveryZone
        {
            Name = "Chilonzor",
            Fee = 15_000,
            MinOrderAmount = 50_000,
            FreeDeliveryFrom = 200_000,
            MinMinutes = 40,
            MaxMinutes = 60,
        };
        db.DeliveryZones.Add(zone);
        await db.SaveChangesAsync();
        return zone;
    }

    public async Task<StaffUser> SeedCourierAsync(string name = "Kuryer")
    {
        await using var db = this.CreateContext();
        var courier = new StaffUser
        {
            FullName = name,
            PhoneNumber = "+99890" + Random.Shared.Next(1_000_000, 9_999_999),
            PasswordHash = "x",
            Role = StaffRole.Courier,
        };
        db.StaffUsers.Add(courier);
        await db.SaveChangesAsync();
        return courier;
    }
}

public class FakeNotifier : IOrderNotifier
{
    public List<OrderDto> Created { get; } = [];

    public List<OrderDto> Updated { get; } = [];

    public Task OrderCreatedAsync(OrderDto order, CancellationToken ct = default)
    {
        this.Created.Add(order);
        return Task.CompletedTask;
    }

    public Task OrderUpdatedAsync(OrderDto order, CancellationToken ct = default)
    {
        this.Updated.Add(order);
        return Task.CompletedTask;
    }
}

public class FixedTimeProvider(DateTimeOffset now) : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => now;
}
