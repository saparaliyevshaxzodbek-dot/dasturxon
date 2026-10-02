using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Restaurant.Business;
using Restaurant.Business.Dtos;
using Restaurant.WebApi.Infrastructure;

namespace Restaurant.WebApi.Controllers;

[ApiController]
[Route("api/delivery-zones")]
[Authorize(Roles = Roles.Management)]
public class DeliveryZonesController(IDeliveryZoneService zones) : ControllerBase
{
    /// <summary>Zones, prices and times shown to customers.</summary>
    [HttpGet]
    [AllowAnonymous]
    public Task<IReadOnlyList<DeliveryZoneDto>> GetActive(CancellationToken ct) => zones.GetActiveAsync(ct);

    [HttpGet("all")]
    public Task<IReadOnlyList<DeliveryZoneDto>> GetAll(CancellationToken ct) => zones.GetAllAsync(ct);

    [HttpPost]
    public async Task<ActionResult<DeliveryZoneDto>> Create(DeliveryZoneRequest request, CancellationToken ct)
    {
        var zone = await zones.CreateAsync(request, ct);
        return this.StatusCode(StatusCodes.Status201Created, zone);
    }

    [HttpPut("{id:int}")]
    public Task<DeliveryZoneDto> Update(int id, DeliveryZoneRequest request, CancellationToken ct) =>
        zones.UpdateAsync(id, request, ct);

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await zones.DeleteAsync(id, ct);
        return this.NoContent();
    }
}
