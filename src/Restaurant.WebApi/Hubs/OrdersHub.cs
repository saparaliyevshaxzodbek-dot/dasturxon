using Microsoft.AspNetCore.SignalR;
using Restaurant.Business;
using Restaurant.Business.Dtos;

namespace Restaurant.WebApi.Hubs;

/// <summary>
/// Live order updates. Logged-in staff receive every order event; a customer only
/// receives updates for the order they subscribed to with <see cref="TrackOrder"/>.
/// </summary>
public class OrdersHub(IOrderService orders) : Hub
{
    public const string Path = "/hubs/orders";
    public const string StaffGroup = "staff";

    public static string OrderGroup(int orderId) => $"order-{orderId}";

    public override async Task OnConnectedAsync()
    {
        if (this.Context.User?.Identity?.IsAuthenticated == true)
        {
            await this.Groups.AddToGroupAsync(this.Context.ConnectionId, StaffGroup);
        }

        await base.OnConnectedAsync();
    }

    public async Task<OrderTrackingDto> TrackOrder(int orderId, string phone)
    {
        OrderTrackingDto order;
        try
        {
            order = await orders.TrackAsync(orderId, phone);
        }
        catch (NotFoundException ex)
        {
            throw new HubException(ex.Message);
        }

        await this.Groups.AddToGroupAsync(this.Context.ConnectionId, OrderGroup(orderId));
        return order;
    }
}
