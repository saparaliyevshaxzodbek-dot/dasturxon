namespace Restaurant.Data.Entities;

public class Product : BaseEntity
{
    public int CategoryId { get; set; }

    public Category Category { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    /// <summary>Serving size shown on the menu, e.g. "1 six · 180 g".</summary>
    public string? Portion { get; set; }

    /// <summary>Short label on the menu card, e.g. "Xit" or "Yangi".</summary>
    public string? Badge { get; set; }

    public decimal Price { get; set; }

    public string? ImageUrl { get; set; }

    public bool IsAvailable { get; set; } = true;

    public int SortOrder { get; set; }

    public bool IsDeleted { get; set; }
}
