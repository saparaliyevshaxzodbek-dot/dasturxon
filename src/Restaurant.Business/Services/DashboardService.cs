using Microsoft.EntityFrameworkCore;
using Restaurant.Business.Dtos;
using Restaurant.Data;

namespace Restaurant.Business.Services;

public class DashboardService(AppDbContext db, TimeProvider time) : IDashboardService
{
    private const int TopProductCount = 5;

    public async Task<DashboardDto> GetAsync(CancellationToken ct = default)
    {
        var today = RestaurantTime.Today(time);
        var weekStart = today.AddDays(-6);
        var weekStartUtc = RestaurantTime.StartOfDayUtc(weekStart);

        // Totals are summed in memory: a decimal SUM isn't portable across providers
        // (SQLite keeps it as REAL) and a week of orders is a small result set.
        var orders = await db.Orders.AsNoTracking()
            .Where(o => o.CreatedAt >= weekStartUtc && o.Status != OrderStatus.Cancelled)
            .Select(o => new { o.CreatedAt, o.TotalAmount })
            .ToListAsync(ct);

        var byDay = orders
            .GroupBy(o => RestaurantTime.ToLocalDate(o.CreatedAt))
            .ToDictionary(g => g.Key, g => new DailyRevenueDto(g.Key, g.Count(), g.Sum(o => o.TotalAmount)));
        var last7Days = Enumerable.Range(0, 7)
            .Select(i => weekStart.AddDays(i))
            .Select(d => byDay.GetValueOrDefault(d) ?? new DailyRevenueDto(d, 0, 0))
            .ToList();
        var todayStats = last7Days[^1];

        var activeByStatus = (await db.Orders.AsNoTracking()
                .Where(o => o.Status != OrderStatus.Completed && o.Status != OrderStatus.Cancelled)
                .GroupBy(o => o.Status)
                .Select(g => new StatusCountDto(g.Key, g.Count()))
                .ToListAsync(ct))
            .OrderBy(s => s.Status)
            .ToList();

        var soldItems = await db.OrderItems.AsNoTracking()
            .Where(i => i.Order.CreatedAt >= weekStartUtc && i.Order.Status != OrderStatus.Cancelled)
            .Select(i => new { i.ProductName, i.Quantity, i.LineTotal })
            .ToListAsync(ct);
        var topProducts = soldItems
            .GroupBy(i => i.ProductName)
            .Select(g => new TopProductDto(g.Key, g.Sum(i => i.Quantity), g.Sum(i => i.LineTotal)))
            .OrderByDescending(p => p.Revenue)
            .Take(TopProductCount)
            .ToList();

        var averageCheck = todayStats.Orders == 0 ? 0 : Math.Round(todayStats.Revenue / todayStats.Orders);

        return new DashboardDto(
            todayStats.Orders,
            todayStats.Revenue,
            averageCheck,
            activeByStatus.Sum(s => s.Count),
            activeByStatus,
            last7Days,
            topProducts);
    }
}
