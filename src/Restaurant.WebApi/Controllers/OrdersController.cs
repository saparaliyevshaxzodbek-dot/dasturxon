using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Restaurant.Business;
using Restaurant.Business.Dtos;
using Restaurant.WebApi.Infrastructure;

namespace Restaurant.WebApi.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController(IOrderService orders) : ControllerBase
{
    /// <summary>Customer places an order from the website; no account needed.</summary>
    [HttpPost]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimits.PublicOrders)]
    public async Task<ActionResult<OrderTrackingDto>> Create(CreateOrderRequest request, CancellationToken ct)
    {
        var order = await orders.CreateAsync(request, ct);
        return this.StatusCode(StatusCodes.Status201Created, order.ToTracking());
    }

    /// <summary>
    /// Customer checks an order's status. POST keeps the phone number out of URLs and logs.
    /// </summary>
    [HttpPost("{id:int}/track")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimits.PublicOrders)]
    public Task<OrderTrackingDto> Track(int id, TrackOrderRequest request, CancellationToken ct) =>
        orders.TrackAsync(id, request.Phone, ct);

    [HttpGet]
    public Task<PagedResult<OrderDto>> GetPaged([FromQuery] OrderQuery query, CancellationToken ct) =>
        orders.GetPagedAsync(query, ct);

    [HttpGet("active")]
    public Task<IReadOnlyList<OrderDto>> GetActive(CancellationToken ct) => orders.GetActiveAsync(ct);

    [HttpGet("{id:int}")]
    public Task<OrderDto> GetById(int id, CancellationToken ct) => orders.GetByIdAsync(id, ct);

    [HttpPatch("{id:int}/status")]
    public Task<OrderDto> UpdateStatus(int id, UpdateOrderStatusRequest request, CancellationToken ct) =>
        orders.UpdateStatusAsync(id, request, new StaffActor(this.User.GetUserId(), this.User.GetRole()), ct);
}

public class TrackOrderRequest
{
    [Required]
    [StringLength(20)]
    public string Phone { get; init; } = string.Empty;
}
