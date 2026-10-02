using Microsoft.EntityFrameworkCore;
using Restaurant.Business.Dtos;
using Restaurant.Data;
using Restaurant.Data.Entities;

namespace Restaurant.Business.Services;

public class CategoryService(AppDbContext db) : ICategoryService
{
    public async Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await db.Categories.AsNoTracking()
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.SortOrder, c.IsActive, c.Products.Count(p => !p.IsDeleted)))
            .ToListAsync(ct);
    }

    public async Task<CategoryDto> CreateAsync(CategoryRequest request, CancellationToken ct = default)
    {
        var category = new Category();
        Apply(category, request);
        db.Categories.Add(category);
        await db.SaveChangesAsync(ct);
        return new CategoryDto(category.Id, category.Name, category.SortOrder, category.IsActive, 0);
    }

    public async Task<CategoryDto> UpdateAsync(int id, CategoryRequest request, CancellationToken ct = default)
    {
        var category = await this.FindAsync(id, ct);
        Apply(category, request);
        await db.SaveChangesAsync(ct);

        var productCount = await db.Products.CountAsync(p => p.CategoryId == id, ct);
        return new CategoryDto(category.Id, category.Name, category.SortOrder, category.IsActive, productCount);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var category = await this.FindAsync(id, ct);
        if (await db.Products.AnyAsync(p => p.CategoryId == id, ct))
        {
            throw new BusinessRuleException("Kategoriyada taomlar bor. Avval ularni o'chiring yoki boshqa kategoriyaga o'tkazing.");
        }

        category.IsDeleted = true;
        await db.SaveChangesAsync(ct);
    }

    private static void Apply(Category category, CategoryRequest request)
    {
        category.Name = request.Name.Trim();
        category.SortOrder = request.SortOrder;
        category.IsActive = request.IsActive;
    }

    private async Task<Category> FindAsync(int id, CancellationToken ct) =>
        await db.Categories.FirstOrDefaultAsync(c => c.Id == id, ct)
        ?? throw new NotFoundException("Kategoriya topilmadi.");
}
