namespace Restaurant.Data.Entities;

public class Category : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }

    public ICollection<Product> Products { get; set; } = new List<Product>();
}
