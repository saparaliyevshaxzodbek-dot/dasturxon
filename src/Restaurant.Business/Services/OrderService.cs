using Microsoft.EntityFrameworkCore;
using Restaurant.Business.Dtos;
using Restaurant.Data;
using Restaurant.Data.Entities;

namespace Restaurant.Business.Services;

public class OrderService(AppDbContext db, IOrderNotifier notifier) : IOrderService
{
    /// <summary>Promised time for pickup and dine-in orders, which don't depend on a delivery zone.</summary>
    public const int InHouseMinutes = 25;

    public async Task<OrderDto> CreateAsync(CreateOrderRequest request, CancellationToken ct = default)
    {
        var address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
        var isDelivery = request.DeliveryType == DeliveryType.Delivery;
        if (isDelivery && address is null)
        {
            throw new BusinessRuleException("Yetkazib berish uchun manzilni kiriting.");
        }

        var order = new Order
        {
            CustomerName = request.CustomerName.Trim(),
            CustomerPhone = Phone.Normalize(request.CustomerPhone),
            DeliveryType = request.DeliveryType,
            Address = address,
            Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim(),
            PaymentMethod = request.PaymentMethod,
        };

        // The same dish added twice from the cart becomes one line.
        var quantities = request.Items
            .GroupBy(i => i.ProductId)
            .ToDictionary(g => g.Key, g => g.Sum(i => i.Quantity));
        var productIds = quantities.Keys.ToList();
        var products = await db.Products
            .Include(p => p.Category)
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, ct);

        foreach (var (productId, quantity) in quantities)
        {
            if (!products.TryGetValue(productId, out var product))
            {
                throw new BusinessRuleException("Tanlangan taom menyuda topilmadi.");
            }

            if (!product.IsAvailable || !product.Category.IsActive)
            {
                throw new BusinessRuleException($"\"{product.Name}\" hozircha mavjud emas.");
            }

            order.Items.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                UnitPrice = product.Price,
                Quantity = quantity,
                LineTotal = product.Price * quantity,
            });
        }

        order.SubTotal = order.Items.Sum(i => i.LineTotal);
        order.EstimatedMinutes = InHouseMinutes;

        if (isDelivery)
        {
            var zone = await db.DeliveryZones.FirstOrDefaultAsync(z => z.Id == request.DeliveryZoneId && z.IsActive, ct)
                ?? throw new BusinessRuleException("Yetkazib berish hududini tanlang.");

            if (order.SubTotal < zone.MinOrderAmount)
            {
                throw new BusinessRuleException(
                    $"\"{zone.Name}\" hududi uchun eng kam buyurtma {Money.Format(zone.MinOrderAmount)}.");
            }

            order.DeliveryZoneId = zone.Id;
            order.DeliveryZoneName = zone.Name;
            order.DeliveryFee = zone.FreeDeliveryFrom is { } freeFrom && order.SubTotal >= freeFrom ? 0 : zone.Fee;
            order.EstimatedMinutes = zone.MaxMinutes;
        }

        order.TotalAmount = order.SubTotal + order.DeliveryFee;

        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);

        var dto = order.ToDto();
        await notifier.OrderCreatedAsync(dto, ct);
        return dto;
    }

    public async Task<OrderDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var order = await this.WithDetails(db.Orders.AsNoTracking()).FirstOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new NotFoundException("Buyurtma topilmadi.");
        return order.ToDto();
    }

    public async Task<OrderTrackingDto> TrackAsync(int id, string phone, CancellationToken ct = default)
    {
        string normalized;
        try
        {
            normalized = Phone.Normalize(phone);
        }
        catch (BusinessRuleException)
        {
            throw new NotFoundException("Buyurtma topilmadi.");
        }

        // A wrong phone looks exactly like a missing order, so order numbers can't be probed.
        var order = await this.WithDetails(db.Orders.AsNoTracking())
            .FirstOrDefaultAsync(o => o.Id == id && o.CustomerPhone == normalized, ct)
            ?? throw new NotFoundException("Buyurtma topilmadi.");
        return order.ToDto().ToTracking();
    }

    public async Task<PagedResult<OrderDto>> GetPagedAsync(OrderQuery query, CancellationToken ct = default)
    {
        var orders = db.Orders.AsNoTracking();

        if (query.Status is { } status)
        {
            orders = orders.Where(o => o.Status == status);
        }

        if (query.Date is { } date)
        {
            var from = RestaurantTime.StartOfDayUtc(date);
            var to = RestaurantTime.StartOfDayUtc(date.AddDays(1));
            orders = orders.Where(o => o.CreatedAt >= from && o.CreatedAt < to);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var text = query.Search.Trim().TrimStart('#');
            var digits = new string(text.Where(char.IsDigit).ToArray());
            var pattern = $"%{text}%";
            var phonePattern = $"%{digits}%";
            var orderId = int.TryParse(text, out var parsed) ? parsed : 0;

            orders = orders.Where(o =>
                o.Id == orderId
                || EF.Functions.Like(o.CustomerName, pattern)
                || (digits.Length >= 3 && EF.Functions.Like(o.CustomerPhone, phonePattern)));
        }

        var total = await orders.CountAsync(ct);
        var page = await this.WithDetails(orders)
            .OrderByDescending(o => o.CreatedAt).ThenByDescending(o => o.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);

        return new PagedResult<OrderDto>(page.Select(o => o.ToDto()).ToList(), total, query.Page, query.PageSize);
    }

    public async Task<IReadOnlyList<OrderDto>> GetActiveAsync(CancellationToken ct = default)
    {
        var orders = await this.WithDetails(db.Orders.AsNoTracking())
            .Where(o => o.Status != OrderStatus.Completed && o.Status != OrderStatus.Cancelled)
            .OrderBy(o => o.CreatedAt)
            .ToListAsync(ct);
        return orders.Select(o => o.ToDto()).ToList();
    }

    public async Task<OrderDto> UpdateStatusAsync(int id, UpdateOrderStatusRequest request, StaffActor actor, CancellationToken ct = default)
    {
        var order = await this.WithDetails(db.Orders).FirstOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new NotFoundException("Buyurtma topilmadi.");

        OrderWorkflow.EnsureAllowed(order.Status, order.DeliveryType, request.Status, actor.Role);

        if (request.Status == OrderStatus.OnTheWay)
        {
            var courierId = actor.Role == StaffRole.Courier
                ? actor.Id
                : request.CourierId ?? throw new BusinessRuleException("Buyurtmani olib ketadigan kuryerni tanlang.");

            order.Courier = await db.StaffUsers.FirstOrDefaultAsync(
                    u => u.Id == courierId && u.Role == StaffRole.Courier && u.IsActive, ct)
                ?? throw new BusinessRuleException("Kuryer topilmadi yoki faol emas.");
        }
        else if (actor.Role == StaffRole.Courier && order.CourierId is { } assigned && assigned != actor.Id)
        {
            throw new ForbiddenException("Bu buyurtma boshqa kuryerga biriktirilgan.");
        }

        order.Status = request.Status;
        await db.SaveChangesAsync(ct);

        var dto = order.ToDto();
        await notifier.OrderUpdatedAsync(dto, ct);
        return dto;
    }

    private IQueryable<Order> WithDetails(IQueryable<Order> orders) =>
        orders.Include(o => o.Items).Include(o => o.Courier);
}
