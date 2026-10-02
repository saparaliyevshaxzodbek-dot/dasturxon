using Microsoft.AspNetCore.Identity;
using Restaurant.Business;
using Restaurant.Business.Dtos;
using Restaurant.Business.Services;
using Restaurant.Data;
using Restaurant.Data.Entities;

namespace Restaurant.Tests;

public class CatalogAndAuthTests : IDisposable
{
    private readonly TestDb testDb = new();

    public void Dispose() => this.testDb.Dispose();

    [Fact]
    public async Task Menu_HidesDeletedAndUnavailableDishes()
    {
        var (_, shashlik, osh) = await this.testDb.SeedMenuAsync();
        await using var db = this.testDb.CreateContext();
        var service = new ProductService(db);

        await service.DeleteAsync(shashlik.Id);
        var menuWithOsh = await service.GetMenuAsync();
        await service.SetAvailabilityAsync(osh.Id, false);
        var emptyMenu = await service.GetMenuAsync();

        Assert.Equal("Osh", Assert.Single(Assert.Single(menuWithOsh).Products).Name);
        Assert.Empty(emptyMenu);
    }

    [Fact]
    public async Task DeleteCategory_WithDishes_Throws()
    {
        var (category, _, _) = await this.testDb.SeedMenuAsync();
        await using var db = this.testDb.CreateContext();

        await Assert.ThrowsAsync<BusinessRuleException>(() => new CategoryService(db).DeleteAsync(category.Id));
    }

    [Fact]
    public async Task Login_ChecksPasswordAndActiveFlag()
    {
        await using var db = this.testDb.CreateContext();
        var hasher = new PasswordHasher<StaffUser>();
        var staff = new StaffService(db, hasher);
        var created = await staff.CreateAsync(new CreateStaffRequest
        {
            FullName = "Oshpaz",
            PhoneNumber = "+998 90 000 00 03",
            Password = "secret-123",
            Role = StaffRole.Cook,
        });
        var auth = new AuthService(db, hasher, new FakeTokenService());

        var ok = await auth.LoginAsync(new LoginRequest { PhoneNumber = "900000003", Password = "secret-123" });
        var wrongPassword = await auth.LoginAsync(new LoginRequest { PhoneNumber = "900000003", Password = "nope" });
        await staff.UpdateAsync(created.Id, new UpdateStaffRequest { FullName = "Oshpaz", Role = StaffRole.Cook, IsActive = false }, actorId: 999);
        var disabled = await auth.LoginAsync(new LoginRequest { PhoneNumber = "900000003", Password = "secret-123" });

        Assert.NotNull(ok);
        Assert.Equal(StaffRole.Cook, ok.User.Role);
        Assert.Null(wrongPassword);
        Assert.Null(disabled);
    }

    [Fact]
    public async Task Seeder_IsIdempotentAndDashboardCountsDemoOrders()
    {
        var now = new DateTimeOffset(2026, 9, 29, 9, 0, 0, TimeSpan.Zero);
        var time = new FixedTimeProvider(now);
        var options = new SeedOptions { DemoOrders = true };
        await using var db = this.testDb.CreateContext();

        await DbSeeder.SeedAsync(db, new PasswordHasher<StaffUser>(), options, time);
        var orderCount = db.Orders.Count();
        await DbSeeder.SeedAsync(db, new PasswordHasher<StaffUser>(), options, time);
        var dashboard = await new DashboardService(db, time).GetAsync();

        Assert.Equal(orderCount, db.Orders.Count());
        Assert.Equal(7, dashboard.Last7Days.Count);
        Assert.Equal(11, dashboard.TodayOrders);
        Assert.Equal(7, dashboard.ActiveOrders);
        Assert.NotEmpty(dashboard.TopProducts);
    }

    [Fact]
    public async Task Seeder_MovesStaleDemoOrdersToToday()
    {
        var seededAt = new DateTimeOffset(2026, 9, 29, 9, 0, 0, TimeSpan.Zero);
        var twoDaysLater = new FixedTimeProvider(seededAt.AddDays(2).AddHours(3));
        var options = new SeedOptions { DemoOrders = true };
        await using var db = this.testDb.CreateContext();

        await DbSeeder.SeedAsync(db, new PasswordHasher<StaffUser>(), options, new FixedTimeProvider(seededAt));
        var firstCount = db.Orders.Count();
        await DbSeeder.SeedAsync(db, new PasswordHasher<StaffUser>(), options, twoDaysLater);
        var dashboard = await new DashboardService(db, twoDaysLater).GetAsync();
        var newest = db.Orders.Max(o => o.CreatedAt);

        Assert.Equal(firstCount, db.Orders.Count());
        Assert.Equal(11, dashboard.TodayOrders);
        Assert.Equal(7, dashboard.ActiveOrders);
        Assert.InRange(twoDaysLater.GetUtcNow().UtcDateTime - newest, TimeSpan.FromMinutes(2), TimeSpan.FromMinutes(4));
        Assert.Equal(db.Orders.SelectMany(o => o.Items).Count(), db.OrderItems.Count());
    }

    private sealed class FakeTokenService : ITokenService
    {
        public (string Token, DateTime ExpiresAt) CreateToken(StaffUser user) => ("token", DateTime.UtcNow.AddHours(1));
    }
}
