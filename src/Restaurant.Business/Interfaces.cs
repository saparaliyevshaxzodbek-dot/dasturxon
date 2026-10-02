using Restaurant.Business.Dtos;
using Restaurant.Data;
using Restaurant.Data.Entities;

namespace Restaurant.Business;

public interface IAuthService
{
    /// <summary>Returns null when the phone/password pair is wrong or the account is disabled.</summary>
    Task<LoginResponse?> LoginAsync(LoginRequest request, CancellationToken ct = default);

    Task<StaffUserDto> GetCurrentAsync(int userId, CancellationToken ct = default);
}

/// <summary>Issues access tokens; implemented by the web layer that owns the JWT settings.</summary>
public interface ITokenService
{
    (string Token, DateTime ExpiresAt) CreateToken(StaffUser user);
}

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken ct = default);

    Task<CategoryDto> CreateAsync(CategoryRequest request, CancellationToken ct = default);

    Task<CategoryDto> UpdateAsync(int id, CategoryRequest request, CancellationToken ct = default);

    Task DeleteAsync(int id, CancellationToken ct = default);
}

public interface IProductService
{
    /// <summary>Public menu: active categories with their available products.</summary>
    Task<IReadOnlyList<MenuCategoryDto>> GetMenuAsync(CancellationToken ct = default);

    Task<IReadOnlyList<ProductDto>> GetAllAsync(int? categoryId, CancellationToken ct = default);

    Task<ProductDto> GetByIdAsync(int id, CancellationToken ct = default);

    Task<ProductDto> CreateAsync(ProductRequest request, CancellationToken ct = default);

    Task<ProductDto> UpdateAsync(int id, ProductRequest request, CancellationToken ct = default);

    Task<ProductDto> SetAvailabilityAsync(int id, bool isAvailable, CancellationToken ct = default);

    Task DeleteAsync(int id, CancellationToken ct = default);
}

public interface IOrderService
{
    Task<OrderDto> CreateAsync(CreateOrderRequest request, CancellationToken ct = default);

    Task<OrderDto> GetByIdAsync(int id, CancellationToken ct = default);

    /// <summary>Customer-facing lookup; the phone must match the one on the order.</summary>
    Task<OrderTrackingDto> TrackAsync(int id, string phone, CancellationToken ct = default);

    Task<PagedResult<OrderDto>> GetPagedAsync(OrderQuery query, CancellationToken ct = default);

    /// <summary>Orders the kitchen and couriers still have to handle, oldest first.</summary>
    Task<IReadOnlyList<OrderDto>> GetActiveAsync(CancellationToken ct = default);

    Task<OrderDto> UpdateStatusAsync(int id, UpdateOrderStatusRequest request, StaffActor actor, CancellationToken ct = default);
}

/// <summary>Pushes order events to connected screens; implemented by the web layer (SignalR).</summary>
public interface IOrderNotifier
{
    Task OrderCreatedAsync(OrderDto order, CancellationToken ct = default);

    Task OrderUpdatedAsync(OrderDto order, CancellationToken ct = default);
}

public interface IStaffService
{
    Task<IReadOnlyList<StaffUserDto>> GetAllAsync(CancellationToken ct = default);

    /// <summary>Active couriers a manager can hand a delivery to.</summary>
    Task<IReadOnlyList<StaffUserDto>> GetCouriersAsync(CancellationToken ct = default);

    Task<StaffUserDto> CreateAsync(CreateStaffRequest request, CancellationToken ct = default);

    Task<StaffUserDto> UpdateAsync(int id, UpdateStaffRequest request, int actorId, CancellationToken ct = default);
}

public interface IDeliveryZoneService
{
    /// <summary>Zones offered on the customer site.</summary>
    Task<IReadOnlyList<DeliveryZoneDto>> GetActiveAsync(CancellationToken ct = default);

    Task<IReadOnlyList<DeliveryZoneDto>> GetAllAsync(CancellationToken ct = default);

    Task<DeliveryZoneDto> CreateAsync(DeliveryZoneRequest request, CancellationToken ct = default);

    Task<DeliveryZoneDto> UpdateAsync(int id, DeliveryZoneRequest request, CancellationToken ct = default);

    Task DeleteAsync(int id, CancellationToken ct = default);
}

/// <summary>The logged-in staff member performing an action.</summary>
public record StaffActor(int Id, StaffRole Role);

public interface IDashboardService
{
    Task<DashboardDto> GetAsync(CancellationToken ct = default);
}
