using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant.Data.Entities;

namespace Restaurant.Data.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.Property(o => o.CustomerName).HasMaxLength(100).IsRequired();
        builder.Property(o => o.CustomerPhone).HasMaxLength(20).IsRequired();
        builder.Property(o => o.Address).HasMaxLength(300);
        builder.Property(o => o.Comment).HasMaxLength(500);
        builder.Property(o => o.SubTotal).HasPrecision(12, 2);
        builder.Property(o => o.DeliveryFee).HasPrecision(12, 2);
        builder.Property(o => o.TotalAmount).HasPrecision(12, 2);
        builder.Property(o => o.DeliveryZoneName).HasMaxLength(100);
        builder.Property(o => o.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(o => o.DeliveryType).HasConversion<string>().HasMaxLength(20);
        builder.Property(o => o.PaymentMethod).HasConversion<string>().HasMaxLength(20);

        builder.HasOne(o => o.DeliveryZone)
            .WithMany()
            .HasForeignKey(o => o.DeliveryZoneId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(o => o.Courier)
            .WithMany()
            .HasForeignKey(o => o.CourierId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(o => o.Items)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(o => o.Status);
        builder.HasIndex(o => o.CreatedAt);
    }
}
