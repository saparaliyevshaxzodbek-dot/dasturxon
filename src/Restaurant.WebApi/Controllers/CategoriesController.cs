using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Restaurant.Business;
using Restaurant.Business.Dtos;
using Restaurant.WebApi.Infrastructure;

namespace Restaurant.WebApi.Controllers;

[ApiController]
[Route("api/categories")]
[Authorize(Roles = Roles.Management)]
public class CategoriesController(ICategoryService categories) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<CategoryDto>> GetAll(CancellationToken ct) => categories.GetAllAsync(ct);

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create(CategoryRequest request, CancellationToken ct)
    {
        var category = await categories.CreateAsync(request, ct);
        return this.StatusCode(StatusCodes.Status201Created, category);
    }

    [HttpPut("{id:int}")]
    public Task<CategoryDto> Update(int id, CategoryRequest request, CancellationToken ct) =>
        categories.UpdateAsync(id, request, ct);

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await categories.DeleteAsync(id, ct);
        return this.NoContent();
    }
}
