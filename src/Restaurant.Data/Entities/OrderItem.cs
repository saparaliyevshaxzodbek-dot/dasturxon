namespace Restaurant.Data.Entities;

/// <summary>
/// Name and price are copied from the product when the order is placed,
/// so later menu edits don't rewrite the history of past orders.
/// </summary>
public class OrderItem
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public Order Order { get; set; } = null!;

    public int? ProductId { get; set; }

    public Product? Product { get; set; }

    public string ProductName { get; set; } = string.Empty;

    public decimal UnitPrice { get; set; }

    public int Quantity { get; set; }

    public decimal LineTotal { get; set; }
}
