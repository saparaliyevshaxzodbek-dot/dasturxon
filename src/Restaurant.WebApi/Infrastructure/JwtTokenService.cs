using System.Globalization;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Restaurant.Business;
using Restaurant.Data.Entities;

namespace Restaurant.WebApi.Infrastructure;

public class JwtTokenService(JwtOptions options, TimeProvider time) : ITokenService
{
    private readonly JsonWebTokenHandler handler = new();

    public (string Token, DateTime ExpiresAt) CreateToken(StaffUser user)
    {
        var now = time.GetUtcNow().UtcDateTime;
        var expiresAt = now.AddHours(options.ExpiresHours);

        var token = this.handler.CreateToken(new SecurityTokenDescriptor
        {
            Issuer = options.Issuer,
            Audience = options.Audience,
            IssuedAt = now,
            NotBefore = now,
            Expires = expiresAt,
            Claims = new Dictionary<string, object>
            {
                [JwtClaims.Subject] = user.Id.ToString(CultureInfo.InvariantCulture),
                [JwtClaims.Name] = user.FullName,
                [JwtClaims.Role] = user.Role.ToString(),
            },
            SigningCredentials = new SigningCredentials(options.GetSigningKey(), SecurityAlgorithms.HmacSha256),
        });

        return (token, expiresAt);
    }
}
