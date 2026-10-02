using Microsoft.EntityFrameworkCore;
using Restaurant.Business.Dtos;
using Restaurant.Data;
using Restaurant.Data.Entities;

namespace Restaurant.Business.Services;

public class ProductService(AppDbContext db) : IProductService
{
    public async Task<IReadOnlyList<MenuCategoryDto>> GetMenuAsync(CancellationToken ct = default)
    {
        var categories = await db.Categories.AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Name)
            .Include(c => c.Products.Where(p => p.IsAvailable).OrderBy(p => p.SortOrder).ThenBy(p => p.Name))
            .ToListAsync(ct);

        return categories
            .Where(c => c.Products.Count > 0)
            .Select(c => new MenuCategoryDto(c.Id, c.Name, c.Products.Select(p => p.ToDto()).ToList()))
            .ToList();
    }

    public async Task<IReadOnlyList<ProductDto>> GetAllAsync(int? categoryId, CancellationToken ct = default)
    {
        var query = db.Products.AsNoTracking().Include(p => p.Category).AsQueryable();
        if (categoryId is not null)
        {
            query = query.Where(p => p.CategoryId == categoryId);
        }

        var products = await query
            .OrderBy(p => p.Category.SortOrder).ThenBy(p => p.SortOrder).ThenBy(p => p.Name)
            .ToListAsync(ct);
        return products.Select(p => p.ToDto()).ToList();
    }

    public async Task<ProductDto> GetByIdAsync(int id, CancellationToken ct = default) =>
        (await this.FindAsync(id, ct)).ToDto();

    public async Task<ProductDto> CreateAsync(ProductRequest request, CancellationToken ct = default)
    {
        var product = new Product();
        await this.ApplyAsync(product, request, ct);
        db.Products.Add(product);
        await db.SaveChangesAsync(ct);
        return product.ToDto();
    }

    public async Task<ProductDto> UpdateAsync(int id, ProductRequest request, CancellationToken ct = default)
    {
        var product = await this.FindAsync(id, ct);
        await this.ApplyAsync(product, request, ct);
        await db.SaveChangesAsync(ct);
        return product.ToDto();
    }

    public async Task<ProductDto> SetAvailabilityAsync(int id, bool isAvailable, CancellationToken ct = default)
    {
        var product = await this.FindAsync(id, ct);
        product.IsAvailable = isAvailable;
        await db.SaveChangesAsync(ct);
        return product.ToDto();
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        // Soft delete: past orders keep pointing at the product.
        var product = await this.FindAsync(id, ct);
        product.IsDeleted = true;
        await db.SaveChangesAsync(ct);
    }

    private async Task ApplyAsync(Product product, ProductRequest request, CancellationToken ct)
    {
        product.Category = await db.Categories.FirstOrDefaultAsync(c => c.Id == request.CategoryId, ct)
            ?? throw new BusinessRuleException("Kategoriya topilmadi.");
        product.Name = request.Name.Trim();
        product.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        product.Portion = string.IsNullOrWhiteSpace(request.Portion) ? null : request.Portion.Trim();
        product.Badge = string.IsNullOrWhiteSpace(request.Badge) ? null : request.Badge.Trim();
        product.Price = request.Price;
        product.ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim();
        product.IsAvailable = request.IsAvailable;
        product.SortOrder = request.SortOrder;
    }

    private async Task<Product> FindAsync(int id, CancellationToken ct) =>
        await db.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id, ct)
        ?? throw new NotFoundException("Taom topilmadi.");
}
