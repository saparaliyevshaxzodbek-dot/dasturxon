using System.ComponentModel.DataAnnotations;
using Restaurant.Data;

namespace Restaurant.Business.Dtos;

public record StaffUserDto(int Id, string FullName, string PhoneNumber, StaffRole Role, bool IsActive, DateTime CreatedAt);

public record LoginResponse(string Token, DateTime ExpiresAt, StaffUserDto User);

public class LoginRequest
{
    [Required]
    [StringLength(20)]
    public string PhoneNumber { get; init; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Password { get; init; } = string.Empty;
}

public class CreateStaffRequest
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string FullName { get; init; } = string.Empty;

    [Required]
    [StringLength(20, MinimumLength = 9)]
    public string PhoneNumber { get; init; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; init; } = string.Empty;

    [EnumDataType(typeof(StaffRole))]
    public StaffRole Role { get; init; }
}

public class UpdateStaffRequest
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string FullName { get; init; } = string.Empty;

    [EnumDataType(typeof(StaffRole))]
    public StaffRole Role { get; init; }

    public bool IsActive { get; init; } = true;

    /// <summary>Left empty to keep the current password.</summary>
    [StringLength(100, MinimumLength = 6)]
    public string? NewPassword { get; init; }
}
