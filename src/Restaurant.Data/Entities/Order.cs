namespace Restaurant.Data.Entities;

public class Order : BaseEntity
{
    public string CustomerName { get; set; } = string.Empty;

    public string CustomerPhone { get; set; } = string.Empty;

    public DeliveryType DeliveryType { get; set; }

    public string? Address { get; set; }

    public string? Comment { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.New;

    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;

    /// <summary>Sum of the order lines, before delivery.</summary>
    public decimal SubTotal { get; set; }

    public decimal DeliveryFee { get; set; }

    /// <summary>What the customer pays: <see cref="SubTotal"/> plus <see cref="DeliveryFee"/>.</summary>
    public decimal TotalAmount { get; set; }

    public int? DeliveryZoneId { get; set; }

    public DeliveryZone? DeliveryZone { get; set; }

    /// <summary>Zone name copied at order time, so renaming or deleting a zone keeps history readable.</summary>
    public string? DeliveryZoneName { get; set; }

    /// <summary>Promised time to deliver or have the order ready, counted from <see cref="BaseEntity.CreatedAt"/>.</summary>
    public int EstimatedMinutes { get; set; }

    public int? CourierId { get; set; }

    public StaffUser? Courier { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
