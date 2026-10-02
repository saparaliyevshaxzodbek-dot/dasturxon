namespace Restaurant.Data.Entities;

/// <summary>A part of the city with its own delivery price, minimum order and delivery time.</summary>
public class DeliveryZone : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    /// <summary>Districts or landmarks covered, shown to the customer.</summary>
    public string? Description { get; set; }

    public decimal Fee { get; set; }

    public decimal MinOrderAmount { get; set; }

    /// <summary>Order subtotal from which delivery is free; null means never free.</summary>
    public decimal? FreeDeliveryFrom { get; set; }

    public int MinMinutes { get; set; }

    public int MaxMinutes { get; set; }

    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; }
}
