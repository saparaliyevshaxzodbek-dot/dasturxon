using Restaurant.Business;
using Restaurant.Business.Dtos;
using Restaurant.Business.Services;
using Restaurant.Data;

namespace Restaurant.Tests;

public class OrderServiceTests : IDisposable
{
    private static readonly StaffActor Admin = new(1, StaffRole.Admin);
    private static readonly StaffActor Cook = new(2, StaffRole.Cook);

    private readonly TestDb testDb = new();
    private readonly FakeNotifier notifier = new();

    public void Dispose() => this.testDb.Dispose();

    [Fact]
    public async Task CreateAsync_CalculatesTotalsAndMergesDuplicateLines()
    {
        var (_, shashlik, osh) = await this.testDb.SeedMenuAsync();
        await using var db = this.testDb.CreateContext();
        var service = new OrderService(db, this.notifier);

        var order = await service.CreateAsync(NewOrder((shashlik.Id, 2), (osh.Id, 1), (shashlik.Id, 3)));

        Assert.Equal(2, order.Items.Count);
        Assert.Equal(5, order.Items.Single(i => i.ProductId == shashlik.Id).Quantity);
        Assert.Equal((5 * 28_000m) + 45_000m, order.SubTotal);
        Assert.Equal(0, order.DeliveryFee);
        Assert.Equal(order.SubTotal, order.TotalAmount);
        Assert.Equal(OrderService.InHouseMinutes, order.EstimatedMinutes);
        Assert.Equal("+998901234567", order.CustomerPhone);
        Assert.Equal(OrderStatus.New, order.Status);
        Assert.Single(this.notifier.Created);
    }

    [Fact]
    public async Task CreateAsync_KeepsPriceSnapshotWhenMenuChangesLater()
    {
        var (_, shashlik, _) = await this.testDb.SeedMenuAsync();
        int orderId;
        await using (var db = this.testDb.CreateContext())
        {
            orderId = (await new OrderService(db, this.notifier).CreateAsync(NewOrder((shashlik.Id, 1)))).Id;
            var product = await db.Products.FindAsync(shashlik.Id);
            product!.Price = 99_000;
            product.Name = "Yangi nom";
            await db.SaveChangesAsync();
        }

        await using var readDb = this.testDb.CreateContext();
        var order = await new OrderService(readDb, this.notifier).GetByIdAsync(orderId);

        Assert.Equal("Shashlik", order.Items[0].ProductName);
        Assert.Equal(28_000m, order.Items[0].UnitPrice);
    }

    [Fact]
    public async Task CreateAsync_DeliveryAddsZoneFeeAndTime()
    {
        var (_, shashlik, osh) = await this.testDb.SeedMenuAsync();
        var zone = await this.testDb.SeedZoneAsync();
        await using var db = this.testDb.CreateContext();

        var order = await new OrderService(db, this.notifier).CreateAsync(Delivery(zone.Id, (shashlik.Id, 1), (osh.Id, 1)));

        Assert.Equal(73_000m, order.SubTotal);
        Assert.Equal(15_000m, order.DeliveryFee);
        Assert.Equal(88_000m, order.TotalAmount);
        Assert.Equal("Chilonzor", order.DeliveryZoneName);
        Assert.Equal(60, order.EstimatedMinutes);
    }

    [Fact]
    public async Task CreateAsync_DeliveryIsFreeAboveThreshold()
    {
        var (_, _, osh) = await this.testDb.SeedMenuAsync();
        var zone = await this.testDb.SeedZoneAsync();
        await using var db = this.testDb.CreateContext();

        var order = await new OrderService(db, this.notifier).CreateAsync(Delivery(zone.Id, (osh.Id, 5)));

        Assert.Equal(225_000m, order.SubTotal);
        Assert.Equal(0, order.DeliveryFee);
        Assert.Equal(225_000m, order.TotalAmount);
    }

    [Fact]
    public async Task CreateAsync_DeliveryBelowZoneMinimum_Throws()
    {
        var (_, shashlik, _) = await this.testDb.SeedMenuAsync();
        var zone = await this.testDb.SeedZoneAsync();
        await using var db = this.testDb.CreateContext();

        var error = await Assert.ThrowsAsync<BusinessRuleException>(
            () => new OrderService(db, this.notifier).CreateAsync(Delivery(zone.Id, (shashlik.Id, 1))));
        Assert.Contains("50 000 so'm", error.Message);
    }

    [Fact]
    public async Task CreateAsync_DeliveryWithoutZoneOrAddress_Throws()
    {
        var (_, shashlik, _) = await this.testDb.SeedMenuAsync();
        var zone = await this.testDb.SeedZoneAsync();
        await using var db = this.testDb.CreateContext();
        var service = new OrderService(db, this.notifier);
        var noZone = Delivery(null, (shashlik.Id, 3));
        var noAddress = new CreateOrderRequest
        {
            CustomerName = "Aziz",
            CustomerPhone = "901234567",
            DeliveryType = DeliveryType.Delivery,
            DeliveryZoneId = zone.Id,
            Items = [new CreateOrderItemRequest { ProductId = shashlik.Id, Quantity = 3 }],
        };

        await Assert.ThrowsAsync<BusinessRuleException>(() => service.CreateAsync(noZone));
        await Assert.ThrowsAsync<BusinessRuleException>(() => service.CreateAsync(noAddress));
    }

    [Fact]
    public async Task CreateAsync_UnavailableProduct_Throws()
    {
        var (_, shashlik, _) = await this.testDb.SeedMenuAsync();
        await using var db = this.testDb.CreateContext();
        (await db.Products.FindAsync(shashlik.Id))!.IsAvailable = false;
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(
            () => new OrderService(db, this.notifier).CreateAsync(NewOrder((shashlik.Id, 1))));
    }

    [Fact]
    public async Task UpdateStatusAsync_CookMovesOrderThroughKitchen()
    {
        var order = await this.CreateOrderAsync(DeliveryType.Pickup);
        await using var db = this.testDb.CreateContext();
        var service = new OrderService(db, this.notifier);

        await service.UpdateStatusAsync(order.Id, Status(OrderStatus.Preparing), Cook);
        var ready = await service.UpdateStatusAsync(order.Id, Status(OrderStatus.Ready), Cook);

        Assert.Equal(OrderStatus.Ready, ready.Status);
        Assert.Equal(2, this.notifier.Updated.Count);
    }

    [Fact]
    public async Task UpdateStatusAsync_CookCannotCancel()
    {
        var order = await this.CreateOrderAsync(DeliveryType.Pickup);
        await using var db = this.testDb.CreateContext();

        await Assert.ThrowsAsync<ForbiddenException>(
            () => new OrderService(db, this.notifier).UpdateStatusAsync(order.Id, Status(OrderStatus.Cancelled), Cook));
    }

    [Fact]
    public async Task UpdateStatusAsync_SkippingSteps_Throws()
    {
        var order = await this.CreateOrderAsync(DeliveryType.Pickup);
        await using var db = this.testDb.CreateContext();

        await Assert.ThrowsAsync<BusinessRuleException>(
            () => new OrderService(db, this.notifier).UpdateStatusAsync(order.Id, Status(OrderStatus.Completed), Admin));
    }

    [Fact]
    public async Task UpdateStatusAsync_CourierTakingDeliveryIsAssigned()
    {
        var courier = await this.testDb.SeedCourierAsync("Sanjar");
        var order = await this.CreateReadyDeliveryAsync();
        await using var db = this.testDb.CreateContext();

        var onTheWay = await new OrderService(db, this.notifier)
            .UpdateStatusAsync(order.Id, Status(OrderStatus.OnTheWay), new StaffActor(courier.Id, StaffRole.Courier));

        Assert.Equal(courier.Id, onTheWay.CourierId);
        Assert.Equal("Sanjar", onTheWay.CourierName);
        Assert.Equal("Sanjar", onTheWay.ToTracking().CourierName);
    }

    [Fact]
    public async Task UpdateStatusAsync_ManagerMustPickCourier()
    {
        var courier = await this.testDb.SeedCourierAsync();
        var order = await this.CreateReadyDeliveryAsync();
        await using var db = this.testDb.CreateContext();
        var service = new OrderService(db, this.notifier);

        await Assert.ThrowsAsync<BusinessRuleException>(
            () => service.UpdateStatusAsync(order.Id, Status(OrderStatus.OnTheWay), Admin));
        await Assert.ThrowsAsync<BusinessRuleException>(
            () => service.UpdateStatusAsync(order.Id, Status(OrderStatus.OnTheWay, courierId: Cook.Id), Admin));
        var assigned = await service.UpdateStatusAsync(order.Id, Status(OrderStatus.OnTheWay, courier.Id), Admin);

        Assert.Equal(courier.Id, assigned.CourierId);
    }

    [Fact]
    public async Task UpdateStatusAsync_OtherCourierCannotCompleteDelivery()
    {
        var first = await this.testDb.SeedCourierAsync("Birinchi");
        var second = await this.testDb.SeedCourierAsync("Ikkinchi");
        var order = await this.CreateReadyDeliveryAsync();
        await using var db = this.testDb.CreateContext();
        var service = new OrderService(db, this.notifier);
        await service.UpdateStatusAsync(order.Id, Status(OrderStatus.OnTheWay), new StaffActor(first.Id, StaffRole.Courier));

        await Assert.ThrowsAsync<ForbiddenException>(() => service.UpdateStatusAsync(
            order.Id, Status(OrderStatus.Completed), new StaffActor(second.Id, StaffRole.Courier)));
    }

    [Theory]
    [InlineData(DeliveryType.Delivery, OrderStatus.OnTheWay, true)]
    [InlineData(DeliveryType.Pickup, OrderStatus.OnTheWay, false)]
    [InlineData(DeliveryType.Pickup, OrderStatus.Completed, true)]
    [InlineData(DeliveryType.Delivery, OrderStatus.Completed, false)]
    public void Workflow_ReadyOrderNextStepDependsOnDeliveryType(DeliveryType type, OrderStatus next, bool allowed)
    {
        var steps = OrderWorkflow.NextSteps(OrderStatus.Ready, type);

        Assert.Equal(allowed, steps.Any(s => s.To == next));
    }

    [Fact]
    public async Task TrackAsync_WrongPhone_LooksLikeMissingOrder()
    {
        var order = await this.CreateOrderAsync(DeliveryType.Pickup);
        await using var db = this.testDb.CreateContext();
        var service = new OrderService(db, this.notifier);

        var tracked = await service.TrackAsync(order.Id, "90 123 45 67");
        Assert.Equal(order.Id, tracked.Id);
        await Assert.ThrowsAsync<NotFoundException>(() => service.TrackAsync(order.Id, "+998 99 999 99 99"));
    }

    [Fact]
    public async Task GetPagedAsync_FiltersByStatusAndSearch()
    {
        var first = await this.CreateOrderAsync(DeliveryType.Pickup);
        await this.CreateOrderAsync(DeliveryType.Pickup);
        await using var db = this.testDb.CreateContext();
        var service = new OrderService(db, this.notifier);
        await service.UpdateStatusAsync(first.Id, Status(OrderStatus.Preparing), Cook);

        var preparing = await service.GetPagedAsync(new OrderQuery { Status = OrderStatus.Preparing });
        var byName = await service.GetPagedAsync(new OrderQuery { Search = "aziz" });

        Assert.Equal(first.Id, Assert.Single(preparing.Items).Id);
        Assert.Equal(2, byName.TotalCount);
    }

    private static UpdateOrderStatusRequest Status(OrderStatus status, int? courierId = null) =>
        new() { Status = status, CourierId = courierId };

    private static CreateOrderRequest NewOrder(params (int ProductId, int Quantity)[] items) => new()
    {
        CustomerName = "Aziz",
        CustomerPhone = "90 123-45-67",
        DeliveryType = DeliveryType.Pickup,
        Items = items.Select(i => new CreateOrderItemRequest { ProductId = i.ProductId, Quantity = i.Quantity }).ToList(),
    };

    private static CreateOrderRequest Delivery(int? zoneId, params (int ProductId, int Quantity)[] items) => new()
    {
        CustomerName = "Aziz",
        CustomerPhone = "90 123-45-67",
        DeliveryType = DeliveryType.Delivery,
        DeliveryZoneId = zoneId,
        Address = "Chilonzor 9-kvartal",
        PaymentMethod = PaymentMethod.Card,
        Items = items.Select(i => new CreateOrderItemRequest { ProductId = i.ProductId, Quantity = i.Quantity }).ToList(),
    };

    private async Task<OrderDto> CreateOrderAsync(DeliveryType type)
    {
        var productId = await this.EnsureMenuAsync();
        await using var db = this.testDb.CreateContext();
        return await new OrderService(db, this.notifier).CreateAsync(new CreateOrderRequest
        {
            CustomerName = "Aziz",
            CustomerPhone = "901234567",
            DeliveryType = type,
            Items = [new CreateOrderItemRequest { ProductId = productId, Quantity = 1 }],
        });
    }

    private async Task<OrderDto> CreateReadyDeliveryAsync()
    {
        var productId = await this.EnsureMenuAsync();
        var zone = await this.testDb.SeedZoneAsync();
        await using var db = this.testDb.CreateContext();
        var service = new OrderService(db, this.notifier);
        var order = await service.CreateAsync(Delivery(zone.Id, (productId, 2)));
        await service.UpdateStatusAsync(order.Id, Status(OrderStatus.Preparing), Cook);
        return await service.UpdateStatusAsync(order.Id, Status(OrderStatus.Ready), Cook);
    }

    private async Task<int> EnsureMenuAsync()
    {
        await using var db = this.testDb.CreateContext();
        var existing = db.Products.Select(p => p.Id).FirstOrDefault();
        return existing != 0 ? existing : (await this.testDb.SeedMenuAsync()).Shashlik.Id;
    }
}
