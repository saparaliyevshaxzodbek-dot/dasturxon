using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Restaurant.Business;
using Restaurant.Business.Dtos;
using Restaurant.WebApi.Infrastructure;

namespace Restaurant.WebApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService auth) : ControllerBase
{
    [HttpPost("login")]
    [EnableRateLimiting(RateLimits.Login)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request, CancellationToken ct)
    {
        var result = await auth.LoginAsync(request, ct);
        if (result is null)
        {
            return this.Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Telefon raqam yoki parol noto'g'ri.");
        }

        return result;
    }

    [Authorize]
    [HttpGet("me")]
    public Task<StaffUserDto> Me(CancellationToken ct) => auth.GetCurrentAsync(this.User.GetUserId(), ct);
}
