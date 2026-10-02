using System.ComponentModel.DataAnnotations;

namespace Restaurant.Business.Dtos;

public record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);

public record CategoryDto(int Id, string Name, int SortOrder, bool IsActive, int ProductCount);

public record ProductDto(
    int Id,
    int CategoryId,
    string CategoryName,
    string Name,
    string? Description,
    string? Portion,
    string? Badge,
    decimal Price,
    string? ImageUrl,
    bool IsAvailable,
    int SortOrder);

public record MenuCategoryDto(int Id, string Name, IReadOnlyList<ProductDto> Products);

public class CategoryRequest
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; init; } = string.Empty;

    [Range(0, 1000)]
    public int SortOrder { get; init; }

    public bool IsActive { get; init; } = true;
}

public class ProductRequest
{
    [Range(1, int.MaxValue)]
    public int CategoryId { get; init; }

    [Required]
    [StringLength(150, MinimumLength = 2)]
    public string Name { get; init; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; init; }

    [StringLength(50)]
    public string? Portion { get; init; }

    [StringLength(20)]
    public string? Badge { get; init; }

    [Range(1, 100_000_000)]
    public decimal Price { get; init; }

    [StringLength(300)]
    public string? ImageUrl { get; init; }

    public bool IsAvailable { get; init; } = true;

    [Range(0, 1000)]
    public int SortOrder { get; init; }
}

public class AvailabilityRequest
{
    public bool IsAvailable { get; init; }
}

public record DeliveryZoneDto(
    int Id,
    string Name,
    string? Description,
    decimal Fee,
    decimal MinOrderAmount,
    decimal? FreeDeliveryFrom,
    int MinMinutes,
    int MaxMinutes,
    bool IsActive,
    int SortOrder);

public class DeliveryZoneRequest : IValidatableObject
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; init; } = string.Empty;

    [StringLength(300)]
    public string? Description { get; init; }

    [Range(0, 10_000_000)]
    public decimal Fee { get; init; }

    [Range(0, 100_000_000)]
    public decimal MinOrderAmount { get; init; }

    [Range(0, 100_000_000)]
    public decimal? FreeDeliveryFrom { get; init; }

    [Range(5, 600)]
    public int MinMinutes { get; init; } = 30;

    [Range(5, 600)]
    public int MaxMinutes { get; init; } = 60;

    public bool IsActive { get; init; } = true;

    [Range(0, 1000)]
    public int SortOrder { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (this.MaxMinutes < this.MinMinutes)
        {
            yield return new ValidationResult(
                "Eng ko'p vaqt eng kam vaqtdan kichik bo'lmasligi kerak.",
                [nameof(this.MaxMinutes)]);
        }
    }
}
