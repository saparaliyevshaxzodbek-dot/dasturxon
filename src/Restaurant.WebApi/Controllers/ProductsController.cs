using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Restaurant.Business;
using Restaurant.Business.Dtos;
using Restaurant.WebApi.Infrastructure;

namespace Restaurant.WebApi.Controllers;

[ApiController]
[Route("api/products")]
[Authorize]
public class ProductsController(IProductService products) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = Roles.Kitchen)]
    public Task<IReadOnlyList<ProductDto>> GetAll([FromQuery] int? categoryId, CancellationToken ct) =>
        products.GetAllAsync(categoryId, ct);

    [HttpGet("{id:int}")]
    [Authorize(Roles = Roles.Kitchen)]
    public Task<ProductDto> GetById(int id, CancellationToken ct) => products.GetByIdAsync(id, ct);

    [HttpPost]
    [Authorize(Roles = Roles.Management)]
    public async Task<ActionResult<ProductDto>> Create(ProductRequest request, CancellationToken ct)
    {
        var product = await products.CreateAsync(request, ct);
        return this.CreatedAtAction(nameof(this.GetById), new { id = product.Id }, product);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Management)]
    public Task<ProductDto> Update(int id, ProductRequest request, CancellationToken ct) =>
        products.UpdateAsync(id, request, ct);

    /// <summary>Stop-list: the kitchen can take a dish off the menu when it runs out.</summary>
    [HttpPatch("{id:int}/availability")]
    [Authorize(Roles = Roles.Kitchen)]
    public Task<ProductDto> SetAvailability(int id, AvailabilityRequest request, CancellationToken ct) =>
        products.SetAvailabilityAsync(id, request.IsAvailable, ct);

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Management)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await products.DeleteAsync(id, ct);
        return this.NoContent();
    }
}
