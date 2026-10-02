using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Restaurant.Business.Dtos;
using Restaurant.Data;
using Restaurant.Data.Entities;

namespace Restaurant.Business.Services;

public class AuthService(AppDbContext db, IPasswordHasher<StaffUser> hasher, ITokenService tokens) : IAuthService
{
    public async Task<LoginResponse?> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        string phone;
        try
        {
            phone = Phone.Normalize(request.PhoneNumber);
        }
        catch (BusinessRuleException)
        {
            return null;
        }

        var user = await db.StaffUsers.FirstOrDefaultAsync(u => u.PhoneNumber == phone && u.IsActive, ct);
        if (user is null)
        {
            return null;
        }

        var result = hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            return null;
        }

        if (result == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = hasher.HashPassword(user, request.Password);
            await db.SaveChangesAsync(ct);
        }

        var (token, expiresAt) = tokens.CreateToken(user);
        return new LoginResponse(token, expiresAt, user.ToDto());
    }

    public async Task<StaffUserDto> GetCurrentAsync(int userId, CancellationToken ct = default)
    {
        var user = await db.StaffUsers.FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, ct)
            ?? throw new NotFoundException("Xodim topilmadi.");
        return user.ToDto();
    }
}
