using Microsoft.EntityFrameworkCore;
using Restaurant.Business.Dtos;
using Restaurant.Data;
using Restaurant.Data.Entities;

namespace Restaurant.Business.Services;

public class DeliveryZoneService(AppDbContext db) : IDeliveryZoneService
{
    public async Task<IReadOnlyList<DeliveryZoneDto>> GetActiveAsync(CancellationToken ct = default)
    {
        var zones = await db.DeliveryZones.AsNoTracking()
            .Where(z => z.IsActive)
            .OrderBy(z => z.SortOrder).ThenBy(z => z.Name)
            .ToListAsync(ct);
        return zones.Select(z => z.ToDto()).ToList();
    }

    public async Task<IReadOnlyList<DeliveryZoneDto>> GetAllAsync(CancellationToken ct = default)
    {
        var zones = await db.DeliveryZones.AsNoTracking()
            .OrderBy(z => z.SortOrder).ThenBy(z => z.Name)
            .ToListAsync(ct);
        return zones.Select(z => z.ToDto()).ToList();
    }

    public async Task<DeliveryZoneDto> CreateAsync(DeliveryZoneRequest request, CancellationToken ct = default)
    {
        var zone = new DeliveryZone();
        Apply(zone, request);
        db.DeliveryZones.Add(zone);
        await db.SaveChangesAsync(ct);
        return zone.ToDto();
    }

    public async Task<DeliveryZoneDto> UpdateAsync(int id, DeliveryZoneRequest request, CancellationToken ct = default)
    {
        var zone = await this.FindAsync(id, ct);
        Apply(zone, request);
        await db.SaveChangesAsync(ct);
        return zone.ToDto();
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        // Past orders keep the zone name and fee they were placed with, so a hard delete is safe.
        var zone = await this.FindAsync(id, ct);
        db.DeliveryZones.Remove(zone);
        await db.SaveChangesAsync(ct);
    }

    private static void Apply(DeliveryZone zone, DeliveryZoneRequest request)
    {
        zone.Name = request.Name.Trim();
        zone.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        zone.Fee = request.Fee;
        zone.MinOrderAmount = request.MinOrderAmount;
        zone.FreeDeliveryFrom = request.FreeDeliveryFrom;
        zone.MinMinutes = request.MinMinutes;
        zone.MaxMinutes = request.MaxMinutes;
        zone.IsActive = request.IsActive;
        zone.SortOrder = request.SortOrder;
    }

    private async Task<DeliveryZone> FindAsync(int id, CancellationToken ct) =>
        await db.DeliveryZones.FirstOrDefaultAsync(z => z.Id == id, ct)
        ?? throw new NotFoundException("Yetkazib berish hududi topilmadi.");
}
