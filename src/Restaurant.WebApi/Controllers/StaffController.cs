using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Restaurant.Business;
using Restaurant.Business.Dtos;
using Restaurant.WebApi.Infrastructure;

namespace Restaurant.WebApi.Controllers;

[ApiController]
[Route("api/staff")]
[Authorize]
public class StaffController(IStaffService staff) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = Roles.Admin)]
    public Task<IReadOnlyList<StaffUserDto>> GetAll(CancellationToken ct) => staff.GetAllAsync(ct);

    /// <summary>Couriers a manager can send a delivery with.</summary>
    [HttpGet("couriers")]
    [Authorize(Roles = Roles.Management)]
    public Task<IReadOnlyList<StaffUserDto>> GetCouriers(CancellationToken ct) => staff.GetCouriersAsync(ct);

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<StaffUserDto>> Create(CreateStaffRequest request, CancellationToken ct)
    {
        var user = await staff.CreateAsync(request, ct);
        return this.StatusCode(StatusCodes.Status201Created, user);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public Task<StaffUserDto> Update(int id, UpdateStaffRequest request, CancellationToken ct) =>
        staff.UpdateAsync(id, request, this.User.GetUserId(), ct);
}
