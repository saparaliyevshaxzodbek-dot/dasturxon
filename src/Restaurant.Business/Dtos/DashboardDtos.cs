using Restaurant.Data;

namespace Restaurant.Business.Dtos;

public record DashboardDto(
    int TodayOrders,
    decimal TodayRevenue,
    decimal AverageCheck,
    int ActiveOrders,
    IReadOnlyList<StatusCountDto> ActiveByStatus,
    IReadOnlyList<DailyRevenueDto> Last7Days,
    IReadOnlyList<TopProductDto> TopProducts);

public record StatusCountDto(OrderStatus Status, int Count);

public record DailyRevenueDto(DateOnly Date, int Orders, decimal Revenue);

public record TopProductDto(string ProductName, int Quantity, decimal Revenue);
