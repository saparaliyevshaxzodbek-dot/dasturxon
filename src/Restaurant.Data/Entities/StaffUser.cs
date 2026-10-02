namespace Restaurant.Data.Entities;

public class StaffUser : BaseEntity
{
    public string FullName { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public StaffRole Role { get; set; }

    public bool IsActive { get; set; } = true;
}
