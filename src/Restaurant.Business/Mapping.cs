using Restaurant.Business.Dtos;
using Restaurant.Data.Entities;

namespace Restaurant.Business;

public static class Mapping
{
    public static ProductDto ToDto(this Product p) =>
        new(
            p.Id,
            p.CategoryId,
            p.Category?.Name ?? string.Empty,
            p.Name,
            p.Description,
            p.Portion,
            p.Badge,
            p.Price,
            p.ImageUrl,
            p.IsAvailable,
            p.SortOrder);

    public static OrderItemDto ToDto(this OrderItem i) =>
        new(i.ProductId, i.ProductName, i.UnitPrice, i.Quantity, i.LineTotal);

    /// <remarks>Load <see cref="Order.Items"/> and <see cref="Order.Courier"/> before calling.</remarks>
    public static OrderDto ToDto(this Order o) =>
        new(
            o.Id,
            o.CustomerName,
            o.CustomerPhone,
            o.DeliveryType,
            o.Address,
            o.Comment,
            o.Status,
            o.PaymentMethod,
            o.SubTotal,
            o.DeliveryFee,
            o.TotalAmount,
            o.DeliveryZoneName,
            o.EstimatedMinutes,
            o.CourierId,
            o.Courier?.FullName,
            o.Courier?.PhoneNumber,
            o.CreatedAt,
            o.UpdatedAt,
            o.Items.OrderBy(i => i.Id).Select(i => i.ToDto()).ToList());

    public static OrderTrackingDto ToTracking(this OrderDto o) =>
        new(
            o.Id,
            o.Status,
            o.DeliveryType,
            o.PaymentMethod,
            o.SubTotal,
            o.DeliveryFee,
            o.TotalAmount,
            o.DeliveryZoneName,
            o.EstimatedMinutes,
            o.CourierName,
            o.CourierPhone,
            o.CreatedAt,
            o.UpdatedAt,
            o.Items);

    public static StaffUserDto ToDto(this StaffUser u) =>
        new(u.Id, u.FullName, u.PhoneNumber, u.Role, u.IsActive, u.CreatedAt);

    public static DeliveryZoneDto ToDto(this DeliveryZone z) =>
        new(z.Id, z.Name, z.Description, z.Fee, z.MinOrderAmount, z.FreeDeliveryFrom, z.MinMinutes, z.MaxMinutes, z.IsActive, z.SortOrder);
}
