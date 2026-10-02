using Microsoft.AspNetCore.SignalR;
using Restaurant.Business;
using Restaurant.Business.Dtos;

namespace Restaurant.WebApi.Hubs;

public class SignalROrderNotifier(IHubContext<OrdersHub> hub, ILogger<SignalROrderNotifier> logger) : IOrderNotifier
{
    public Task OrderCreatedAsync(OrderDto order, CancellationToken ct = default) =>
        this.SendSafelyAsync(order.Id, () => hub.Clients.Group(OrdersHub.StaffGroup).SendAsync("OrderCreated", order, ct));

    public Task OrderUpdatedAsync(OrderDto order, CancellationToken ct = default) =>
        this.SendSafelyAsync(order.Id, async () =>
        {
            await hub.Clients.Group(OrdersHub.StaffGroup).SendAsync("OrderUpdated", order, ct);
            await hub.Clients.Group(OrdersHub.OrderGroup(order.Id)).SendAsync("OrderStatusChanged", order.ToTracking(), ct);
        });

    // The order is already saved; a failed live push must not turn the request into an error.
    private async Task SendSafelyAsync(int orderId, Func<Task> send)
    {
        try
        {
            await send();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not push live update for order {OrderId}", orderId);
        }
    }
}
