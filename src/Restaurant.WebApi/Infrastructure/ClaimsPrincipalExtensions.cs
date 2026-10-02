using System.Globalization;
using System.Security.Claims;
using Restaurant.Data;

namespace Restaurant.WebApi.Infrastructure;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user) =>
        int.Parse(user.FindFirstValue(JwtClaims.Subject) ?? throw new InvalidOperationException("Token has no subject."), CultureInfo.InvariantCulture);

    public static StaffRole GetRole(this ClaimsPrincipal user) =>
        Enum.Parse<StaffRole>(user.FindFirstValue(JwtClaims.Role) ?? throw new InvalidOperationException("Token has no role."));
}
