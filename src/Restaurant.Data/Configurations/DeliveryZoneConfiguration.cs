using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant.Data.Entities;

namespace Restaurant.Data.Configurations;

public class DeliveryZoneConfiguration : IEntityTypeConfiguration<DeliveryZone>
{
    public void Configure(EntityTypeBuilder<DeliveryZone> builder)
    {
        builder.Property(z => z.Name).HasMaxLength(100).IsRequired();
        builder.Property(z => z.Description).HasMaxLength(300);
        builder.Property(z => z.Fee).HasPrecision(12, 2);
        builder.Property(z => z.MinOrderAmount).HasPrecision(12, 2);
        builder.Property(z => z.FreeDeliveryFrom).HasPrecision(12, 2);
    }
}
