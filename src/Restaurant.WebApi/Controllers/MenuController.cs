using Microsoft.AspNetCore.Mvc;
using Restaurant.Business;
using Restaurant.Business.Dtos;

namespace Restaurant.WebApi.Controllers;

/// <summary>Public menu shown on the customer site.</summary>
[ApiController]
[Route("api/menu")]
public class MenuController(IProductService products) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<MenuCategoryDto>> Get(CancellationToken ct) => products.GetMenuAsync(ct);
}
