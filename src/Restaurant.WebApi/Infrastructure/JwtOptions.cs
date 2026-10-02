using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Restaurant.WebApi.Infrastructure;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Key { get; set; } = string.Empty;

    public string Issuer { get; set; } = string.Empty;

    public string Audience { get; set; } = string.Empty;

    public int ExpiresHours { get; set; } = 12;

    public SymmetricSecurityKey GetSigningKey() => new(Encoding.UTF8.GetBytes(this.Key));

    public void Validate()
    {
        // HMAC-SHA256 needs at least a 256-bit key.
        if (Encoding.UTF8.GetByteCount(this.Key) < 32)
        {
            throw new InvalidOperationException(
                "Jwt:Key must be at least 32 characters. Set it in appsettings or the Jwt__Key environment variable.");
        }

        // deploy/appsettings.Production.example.json ships a placeholder that must be replaced.
        if (this.Key.StartsWith("BU-YERGA", StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Jwt:Key is still the placeholder from appsettings.Production.example.json. Replace it with a random secret.");
        }
    }
}

public static class JwtClaims
{
    public const string Subject = "sub";
    public const string Name = "name";
    public const string Role = "role";
}

public static class Roles
{
    public const string Admin = "Admin";
    public const string Management = "Admin,Manager";
    public const string Kitchen = "Admin,Manager,Cook";
}
