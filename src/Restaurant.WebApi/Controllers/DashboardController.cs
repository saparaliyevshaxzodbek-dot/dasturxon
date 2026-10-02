using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Restaurant.Business;
using Restaurant.Business.Dtos;
using Restaurant.WebApi.Infrastructure;

namespace Restaurant.WebApi.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize(Roles = Roles.Management)]
public class DashboardController(IDashboardService dashboard) : ControllerBase
{
    [HttpGet]
    public Task<DashboardDto> Get(CancellationToken ct) => dashboard.GetAsync(ct);
}
