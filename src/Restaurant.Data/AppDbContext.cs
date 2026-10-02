using Microsoft.EntityFrameworkCore;
using Restaurant.Data.Entities;

namespace Restaurant.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Category> Categories => this.Set<Category>();

    public DbSet<Product> Products => this.Set<Product>();

    public DbSet<StaffUser> StaffUsers => this.Set<StaffUser>();

    public DbSet<Order> Orders => this.Set<Order>();

    public DbSet<OrderItem> OrderItems => this.Set<OrderItem>();

    public DbSet<DeliveryZone> DeliveryZones => this.Set<DeliveryZone>();

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        foreach (var entry in this.ChangeTracker.Entries<BaseEntity>())
        {
            // The demo seeder sets its own timestamps, so explicitly assigned values are kept.
            if (entry.State == EntityState.Added && entry.Entity.CreatedAt == default)
            {
                entry.Entity.CreatedAt = now;
            }
            else if (entry.State == EntityState.Modified && !entry.Property(e => e.UpdatedAt).IsModified)
            {
                entry.Entity.UpdatedAt = now;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
        configurationBuilder.Properties<DateTime?>().HaveConversion<UtcDateTimeConverter>();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // SQLite has no decimal type and can't sort or aggregate decimals stored as text.
        // Storing them as REAL keeps queries working; other providers keep a real decimal column.
        if (this.Database.IsSqlite())
        {
            foreach (var property in modelBuilder.Model.GetEntityTypes()
                         .SelectMany(t => t.GetProperties())
                         .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
            {
                property.SetProviderClrType(typeof(double));
            }
        }
    }
}
