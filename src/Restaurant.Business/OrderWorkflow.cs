using Restaurant.Data;

namespace Restaurant.Business;

/// <summary>
/// Which status an order may move to next and which staff roles may move it there.
/// </summary>
public static class OrderWorkflow
{
    public static readonly IReadOnlyList<OrderStatus> ActiveStatuses =
        [OrderStatus.New, OrderStatus.Preparing, OrderStatus.Ready, OrderStatus.OnTheWay];

    private static readonly StaffRole[] Kitchen = [StaffRole.Admin, StaffRole.Manager, StaffRole.Cook];
    private static readonly StaffRole[] Couriers = [StaffRole.Admin, StaffRole.Manager, StaffRole.Courier];
    private static readonly StaffRole[] Management = [StaffRole.Admin, StaffRole.Manager];

    public static IReadOnlyList<(OrderStatus To, StaffRole[] Roles)> NextSteps(OrderStatus from, DeliveryType deliveryType) => from switch
    {
        OrderStatus.New => [(OrderStatus.Preparing, Kitchen), (OrderStatus.Cancelled, Management)],
        OrderStatus.Preparing => [(OrderStatus.Ready, Kitchen), (OrderStatus.Cancelled, Management)],
        OrderStatus.Ready when deliveryType == DeliveryType.Delivery =>
            [(OrderStatus.OnTheWay, Couriers), (OrderStatus.Cancelled, Management)],
        OrderStatus.Ready => [(OrderStatus.Completed, Management), (OrderStatus.Cancelled, Management)],
        OrderStatus.OnTheWay => [(OrderStatus.Completed, Couriers), (OrderStatus.Cancelled, Management)],
        _ => [],
    };

    public static void EnsureAllowed(OrderStatus from, DeliveryType deliveryType, OrderStatus to, StaffRole role)
    {
        var step = NextSteps(from, deliveryType).FirstOrDefault(s => s.To == to);
        if (step.Roles is null)
        {
            throw new BusinessRuleException($"Buyurtmani {from} holatidan {to} holatiga o'tkazib bo'lmaydi.");
        }

        if (!step.Roles.Contains(role))
        {
            throw new ForbiddenException("Bu amal uchun ruxsatingiz yo'q.");
        }
    }
}
