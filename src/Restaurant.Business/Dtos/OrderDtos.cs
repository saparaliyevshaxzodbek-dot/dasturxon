using System.ComponentModel.DataAnnotations;
using Restaurant.Data;

namespace Restaurant.Business.Dtos;

public record OrderItemDto(int? ProductId, string ProductName, decimal UnitPrice, int Quantity, decimal LineTotal);

public record OrderDto(
    int Id,
    string CustomerName,
    string CustomerPhone,
    DeliveryType DeliveryType,
    string? Address,
    string? Comment,
    OrderStatus Status,
    PaymentMethod PaymentMethod,
    decimal SubTotal,
    decimal DeliveryFee,
    decimal TotalAmount,
    string? DeliveryZoneName,
    int EstimatedMinutes,
    int? CourierId,
    string? CourierName,
    string? CourierPhone,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    IReadOnlyList<OrderItemDto> Items);

/// <summary>
/// What an anonymous customer sees when tracking an order: no customer name, phone or address.
/// The courier's name and phone are included so the customer can reach them.
/// </summary>
public record OrderTrackingDto(
    int Id,
    OrderStatus Status,
    DeliveryType DeliveryType,
    PaymentMethod PaymentMethod,
    decimal SubTotal,
    decimal DeliveryFee,
    decimal TotalAmount,
    string? DeliveryZoneName,
    int EstimatedMinutes,
    string? CourierName,
    string? CourierPhone,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    IReadOnlyList<OrderItemDto> Items);

public class CreateOrderItemRequest
{
    [Range(1, int.MaxValue)]
    public int ProductId { get; init; }

    [Range(1, 50)]
    public int Quantity { get; init; }
}

public class CreateOrderRequest
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string CustomerName { get; init; } = string.Empty;

    [Required]
    [StringLength(20, MinimumLength = 9)]
    public string CustomerPhone { get; init; } = string.Empty;

    [EnumDataType(typeof(DeliveryType))]
    public DeliveryType DeliveryType { get; init; }

    /// <summary>Required for delivery orders; ignored otherwise.</summary>
    public int? DeliveryZoneId { get; init; }

    [StringLength(300)]
    public string? Address { get; init; }

    [StringLength(500)]
    public string? Comment { get; init; }

    [EnumDataType(typeof(PaymentMethod))]
    public PaymentMethod PaymentMethod { get; init; } = PaymentMethod.Cash;

    [Required]
    [MinLength(1)]
    [MaxLength(50)]
    public List<CreateOrderItemRequest> Items { get; init; } = [];
}

public class UpdateOrderStatusRequest
{
    [EnumDataType(typeof(OrderStatus))]
    public OrderStatus Status { get; init; }

    /// <summary>
    /// Courier who takes a delivery on the way. A courier moving the order themselves is assigned automatically;
    /// an admin or manager has to pick one.
    /// </summary>
    public int? CourierId { get; init; }
}

public class OrderQuery
{
    public OrderStatus? Status { get; init; }

    /// <summary>Restaurant-local date (UTC+5).</summary>
    public DateOnly? Date { get; init; }

    /// <summary>Matches order number, customer name or phone.</summary>
    [StringLength(100)]
    public string? Search { get; init; }

    [Range(1, int.MaxValue)]
    public int Page { get; init; } = 1;

    [Range(1, 100)]
    public int PageSize { get; init; } = 20;
}
