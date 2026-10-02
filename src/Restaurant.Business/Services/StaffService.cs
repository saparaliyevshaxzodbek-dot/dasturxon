using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Restaurant.Business.Dtos;
using Restaurant.Data;
using Restaurant.Data.Entities;

namespace Restaurant.Business.Services;

public class StaffService(AppDbContext db, IPasswordHasher<StaffUser> hasher) : IStaffService
{
    public async Task<IReadOnlyList<StaffUserDto>> GetAllAsync(CancellationToken ct = default)
    {
        var users = await db.StaffUsers.AsNoTracking()
            .OrderBy(u => u.Role).ThenBy(u => u.FullName)
            .ToListAsync(ct);
        return users.Select(u => u.ToDto()).ToList();
    }

    public async Task<IReadOnlyList<StaffUserDto>> GetCouriersAsync(CancellationToken ct = default)
    {
        var couriers = await db.StaffUsers.AsNoTracking()
            .Where(u => u.Role == StaffRole.Courier && u.IsActive)
            .OrderBy(u => u.FullName)
            .ToListAsync(ct);
        return couriers.Select(u => u.ToDto()).ToList();
    }

    public async Task<StaffUserDto> CreateAsync(CreateStaffRequest request, CancellationToken ct = default)
    {
        var phone = Phone.Normalize(request.PhoneNumber);
        if (await db.StaffUsers.AnyAsync(u => u.PhoneNumber == phone, ct))
        {
            throw new BusinessRuleException("Bu telefon raqam bilan xodim allaqachon mavjud.");
        }

        var user = new StaffUser
        {
            FullName = request.FullName.Trim(),
            PhoneNumber = phone,
            Role = request.Role,
        };
        user.PasswordHash = hasher.HashPassword(user, request.Password);

        db.StaffUsers.Add(user);
        await db.SaveChangesAsync(ct);
        return user.ToDto();
    }

    public async Task<StaffUserDto> UpdateAsync(int id, UpdateStaffRequest request, int actorId, CancellationToken ct = default)
    {
        var user = await db.StaffUsers.FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new NotFoundException("Xodim topilmadi.");

        // An admin locking themselves out would leave nobody able to undo it.
        if (id == actorId && (!request.IsActive || request.Role != StaffRole.Admin))
        {
            throw new BusinessRuleException("O'zingizni bloklay yoki rolingizni o'zgartira olmaysiz.");
        }

        user.FullName = request.FullName.Trim();
        user.Role = request.Role;
        user.IsActive = request.IsActive;
        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            user.PasswordHash = hasher.HashPassword(user, request.NewPassword);
        }

        await db.SaveChangesAsync(ct);
        return user.ToDto();
    }
}
