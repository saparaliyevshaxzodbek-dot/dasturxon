using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Restaurant.Business.Services;
using Restaurant.Data;
using Restaurant.Data.Entities;

namespace Restaurant.Business;

public class SeedStaffUser
{
    public string FullName { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public StaffRole Role { get; set; }
}

public class SeedOptions
{
    public const string SectionName = "Seed";

    public List<SeedStaffUser> Staff { get; set; } = [];

    /// <summary>Fills the last week with fake orders so the dashboard and kitchen screen aren't empty in a demo.</summary>
    public bool DemoOrders { get; set; }
}

public static class DbSeeder
{
    private record SeedDish(string Name, string Description, string Portion, decimal Price, string Image, string? Badge = null);

    private static readonly (string Category, SeedDish[] Dishes)[] Menu =
    [
        ("Shashliklar",
        [
            new("Qo'y go'shti shashlik", "Yangi qo'y go'shti, ko'mirda pishirilgan", "1 six · 180 g", 28_000, "qoy-shashlik", "Xit"),
            new("Mol go'shti shashlik", "Marinadlangan yumshoq mol go'shti", "1 six · 180 g", 26_000, "mol-shashlik"),
            new("Assorti shashlik", "Qo'y, mol, lula va tovuq — 4 xil shashlik, sabzavotlar bilan", "4 six · 700 g", 105_000, "assorti-shashlik", "Tavsiya"),
            new("Lula kabob", "Ziravorli qiyma go'sht, kartoshka fri bilan", "1 six · 200 g", 24_000, "lula-kabob"),
            new("Jigar shashlik", "Qo'y jigari dumba bilan", "1 six · 160 g", 22_000, "jigar-shashlik"),
            new("Tovuq shashlik", "Tovuq soni, maxsus marinad", "1 six · 200 g", 19_000, "tovuq-shashlik"),
            new("Qanot shashlik", "Tovuq qanotlari, lavash ustida", "1 six · 5 dona", 18_000, "qanot-shashlik"),
        ]),
        ("Baliq taomlari",
        [
            new("Qovurilgan laqqa baliq", "Qarsildoq qovurilgan laqqa, limon va fri bilan", "1 porsiya · 350 g", 45_000, "qovurilgan-laqqa", "Xit"),
            new("Sazan tandirda", "Butun sazan sabzavotlar bilan tandirda pishirilgan", "1 kg", 90_000, "sazan-tandir"),
            new("Forel grilda", "Butun forel, limon va ko'katlar bilan", "1 dona · 400 g", 85_000, "forel-grilda", "Yangi"),
            new("Baliq shashlik", "Laqqa baliq bo'laklari, ko'mirda", "1 six · 200 g", 32_000, "baliq-shashlik"),
            new("Baliq sho'rva", "Qozonda, o'choqda pishgan uy uslubidagi sho'rva", "1 kosa · 400 ml", 35_000, "baliq-shorva"),
        ]),
        ("Milliy taomlar",
        [
            new("Toshkent oshi", "Qo'y go'shti, sariq sabzi, bedana tuxum", "1 porsiya · 400 g", 45_000, "toshkent-oshi", "Xit"),
            new("Qozon kabob", "Kartoshka va go'sht qozonda", "1 porsiya · 450 g", 65_000, "qozon-kabob"),
            new("Lag'mon", "Qo'lda cho'zilgan lag'mon, go'shtli qayla", "1 kosa · 450 g", 38_000, "lagmon"),
            new("Manti", "Qo'y go'shti va piyoz, qatiq bilan", "5 dona", 35_000, "manti"),
            new("Sho'rva", "Qo'y go'shtidan qaynatma sho'rva", "1 kosa · 450 ml", 32_000, "shorva"),
            new("Tandir somsa", "Go'shtli, tandirdan yangi uzilgan", "1 dona", 12_000, "tandir-somsa"),
            new("Chuchvara", "Qatiq va qizil qalampir yog'i bilan", "1 porsiya · 20 dona", 32_000, "chuchvara"),
        ]),
        ("Salatlar",
        [
            new("Achchiq-chuchuk", "Pomidor, bodring, piyoz, ko'katlar", "250 g", 15_000, "achchiq-chuchuk"),
            new("Toshkent salati", "Turp, mol go'shti, tuxum, qovurilgan piyoz", "250 g", 30_000, "toshkent-salati"),
            new("Olivye", "Klassik olivye salati", "250 g", 28_000, "olivye"),
            new("Sezar", "Tovuq, kruton, parmezan, maxsus sous", "300 g", 38_000, "sezar"),
        ]),
        ("Non va garnirlar",
        [
            new("Tandir non", "Issiq patir non", "1 dona", 5_000, "tandir-non"),
            new("Kartoshka fri", "Qarsildoq kartoshka fri", "200 g", 18_000, "kartoshka-fri"),
            new("Guruch", "Sariyog'li guruch", "200 g", 12_000, "guruch"),
        ]),
        ("Ichimliklar",
        [
            new("Ko'k choy", "Choynakda, novvot bilan", "1 choynak", 8_000, "kok-choy"),
            new("Limonli choy", "Limon va asal bilan", "1 choynak", 18_000, "limonli-choy"),
            new("Kompot", "Uy kompoti, olcha va mevalardan", "1 L", 20_000, "kompot"),
            new("Ayron", "Muzdek ayron", "0.5 L", 10_000, "ayron"),
            new("Gazli ichimlik", "Muzdek gazli ichimlik", "0.5 L", 12_000, "gazli-ichimlik"),
            new("Mineral suv", "Gazli yoki gazsiz", "0.5 L", 7_000, "mineral-suv"),
        ]),
    ];

    private static readonly (string Name, string Description, decimal Fee, decimal Min, decimal? FreeFrom, int MinMin, int MaxMin, string[] Addresses)[] Zones =
    [
        ("Markaz", "Mirobod, Yakkasaroy, Shayxontohur", 10_000, 50_000, 150_000, 30, 45,
            ["Mirobod, Afrosiyob ko'chasi 5", "Yakkasaroy, Shota Rustaveli 30", "Shayxontohur, Navoiy ko'chasi 18"]),
        ("Chilonzor va Yunusobod", "Chilonzor, Yunusobod, Olmazor, Uchtepa", 15_000, 70_000, 200_000, 40, 60,
            ["Chilonzor 9-kvartal, 12-uy", "Yunusobod 4-mavze, 7-uy", "Olmazor, Qorasaroy ko'chasi 14"]),
        ("Mirzo Ulug'bek va Yashnobod", "Mirzo Ulug'bek, Yashnobod, Yangihayot", 15_000, 70_000, 200_000, 40, 60,
            ["Mirzo Ulug'bek, Buyuk Ipak Yo'li 45", "Yashnobod, Parkent ko'chasi 120"]),
        ("Sergeli va Bektemir", "Sergeli, Bektemir", 25_000, 100_000, 300_000, 60, 80,
            ["Sergeli 3-mavze, 21-uy", "Bektemir, Husayniy ko'chasi 9"]),
        ("Toshkent viloyati", "Shahar chegarasidan 15 km gacha", 40_000, 150_000, null, 70, 100,
            ["Zangiota, Eshonguzar 2-uy"]),
    ];

    private static readonly string[] CustomerNames =
    [
        "Aziz", "Dilnoza", "Jasur", "Malika", "Sardor", "Nodira", "Bekzod", "Gulnora",
        "Otabek", "Madina", "Sherzod", "Kamola", "Rustam", "Zarina", "Farrux", "Shahlo",
    ];

    public static async Task SeedAsync(
        AppDbContext db,
        IPasswordHasher<StaffUser> hasher,
        SeedOptions options,
        TimeProvider time,
        CancellationToken ct = default)
    {
        await SeedStaffAsync(db, hasher, options.Staff, ct);

        if (!await db.Categories.IgnoreQueryFilters().AnyAsync(ct))
        {
            await SeedMenuAsync(db, ct);
        }

        if (!await db.DeliveryZones.AnyAsync(ct))
        {
            await SeedZonesAsync(db, ct);
        }

        if (options.DemoOrders && !await db.Orders.AnyAsync(ct))
        {
            await SeedOrdersAsync(db, time, ct);
        }
        else if (options.DemoOrders)
        {
            await RefreshDemoTimelineAsync(db, time, ct);
        }
    }

    /// <summary>
    /// Rebuilds the fake orders once they go stale. Without this a demo opened days later shows an
    /// empty "today" and kitchen tickets that have waited for 40 hours. Only runs with DemoOrders on.
    /// </summary>
    private static async Task RefreshDemoTimelineAsync(AppDbContext db, TimeProvider time, CancellationToken ct)
    {
        var latest = await db.Orders.MaxAsync(o => o.CreatedAt, ct);
        if (time.GetUtcNow().UtcDateTime - latest < TimeSpan.FromHours(3))
        {
            return;
        }

        // Order lines go with their orders through the cascade delete.
        await db.Orders.ExecuteDeleteAsync(ct);
        db.ChangeTracker.Clear();
        await SeedOrdersAsync(db, time, ct);
    }

    private static async Task SeedStaffAsync(AppDbContext db, IPasswordHasher<StaffUser> hasher, List<SeedStaffUser> staff, CancellationToken ct)
    {
        foreach (var seed in staff)
        {
            var phone = Phone.Normalize(seed.PhoneNumber);
            if (await db.StaffUsers.AnyAsync(u => u.PhoneNumber == phone, ct))
            {
                continue;
            }

            var user = new StaffUser { FullName = seed.FullName, PhoneNumber = phone, Role = seed.Role };
            user.PasswordHash = hasher.HashPassword(user, seed.Password);
            db.StaffUsers.Add(user);
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedMenuAsync(AppDbContext db, CancellationToken ct)
    {
        for (var c = 0; c < Menu.Length; c++)
        {
            var (name, dishes) = Menu[c];
            var category = new Category { Name = name, SortOrder = (c + 1) * 10 };
            for (var p = 0; p < dishes.Length; p++)
            {
                var dish = dishes[p];
                category.Products.Add(new Product
                {
                    Name = dish.Name,
                    Description = dish.Description,
                    Portion = dish.Portion,
                    Badge = dish.Badge,
                    Price = dish.Price,
                    ImageUrl = $"/images/menu/{dish.Image}.jpg",
                    SortOrder = (p + 1) * 10,
                });
            }

            db.Categories.Add(category);
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedZonesAsync(AppDbContext db, CancellationToken ct)
    {
        for (var i = 0; i < Zones.Length; i++)
        {
            var z = Zones[i];
            db.DeliveryZones.Add(new DeliveryZone
            {
                Name = z.Name,
                Description = z.Description,
                Fee = z.Fee,
                MinOrderAmount = z.Min,
                FreeDeliveryFrom = z.FreeFrom,
                MinMinutes = z.MinMin,
                MaxMinutes = z.MaxMin,
                SortOrder = (i + 1) * 10,
            });
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedOrdersAsync(AppDbContext db, TimeProvider time, CancellationToken ct)
    {
        var random = new Random(2026);
        var products = await db.Products.ToListAsync(ct);
        var zones = await db.DeliveryZones.OrderBy(z => z.SortOrder).ToListAsync(ct);
        var couriers = await db.StaffUsers.Where(u => u.Role == StaffRole.Courier).ToListAsync(ct);
        var nowUtc = time.GetUtcNow().UtcDateTime;
        var today = RestaurantTime.Today(time);

        var orders = new List<Order>();

        // Past six days: finished business, roughly 15-25 orders a day between 11:00 and 23:00.
        for (var day = 6; day >= 1; day--)
        {
            var dayStart = RestaurantTime.StartOfDayUtc(today.AddDays(-day));
            var count = random.Next(15, 26);
            for (var i = 0; i < count; i++)
            {
                var createdAt = dayStart.AddHours(11).AddMinutes(random.Next(0, 12 * 60));
                var status = random.Next(100) < 7 ? OrderStatus.Cancelled : OrderStatus.Completed;
                orders.Add(CreateDemoOrder(random, products, zones, couriers, createdAt, status));
            }
        }

        // Today: the newest orders are still in progress so the kitchen screen has work on it.
        OrderStatus[] todayStatuses =
        [
            OrderStatus.New, OrderStatus.New, OrderStatus.Preparing, OrderStatus.Preparing, OrderStatus.Preparing,
            OrderStatus.Ready, OrderStatus.OnTheWay, OrderStatus.Completed, OrderStatus.Completed,
            OrderStatus.Completed, OrderStatus.Completed, OrderStatus.Cancelled,
        ];
        for (var i = 0; i < todayStatuses.Length; i++)
        {
            var createdAt = nowUtc.AddMinutes(-(3 + (i * 14)));
            orders.Add(CreateDemoOrder(random, products, zones, couriers, createdAt, todayStatuses[i]));
        }

        db.Orders.AddRange(orders.OrderBy(o => o.CreatedAt));
        await db.SaveChangesAsync(ct);
    }

    private static Order CreateDemoOrder(
        Random random,
        List<Product> products,
        List<DeliveryZone> zones,
        List<StaffUser> couriers,
        DateTime createdAt,
        OrderStatus status)
    {
        var deliveryType = random.Next(100) switch
        {
            < 60 => DeliveryType.Delivery,
            < 85 => DeliveryType.Pickup,
            _ => DeliveryType.DineIn,
        };

        // Only a delivery order can be on the way.
        if (status == OrderStatus.OnTheWay || zones.Count == 0)
        {
            deliveryType = zones.Count == 0 ? DeliveryType.Pickup : DeliveryType.Delivery;
        }

        string[] operatorCodes = ["90", "91", "93", "94", "97", "99", "33", "88"];
        var order = new Order
        {
            CustomerName = CustomerNames[random.Next(CustomerNames.Length)],
            CustomerPhone = $"+998{operatorCodes[random.Next(operatorCodes.Length)]}{random.Next(1_000_000, 10_000_000)}",
            DeliveryType = deliveryType,
            PaymentMethod = random.Next(100) < 60 ? PaymentMethod.Cash : PaymentMethod.Card,
            Status = status,
            CreatedAt = createdAt,
            UpdatedAt = status == OrderStatus.New ? null : createdAt.AddMinutes(random.Next(5, 45)),
            EstimatedMinutes = OrderService.InHouseMinutes,
        };

        foreach (var product in products.OrderBy(_ => random.Next()).Take(random.Next(2, 6)))
        {
            var quantity = random.Next(1, 4);
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

        if (deliveryType == DeliveryType.Delivery)
        {
            // Mostly the nearer zones, like a real restaurant's order mix.
            var zoneIndex = Math.Min(zones.Count - 1, (int)Math.Floor(Math.Pow(random.NextDouble(), 1.8) * zones.Count));
            var zone = zones[zoneIndex];
            var (_, _, _, _, _, _, _, addresses) = Zones.First(z => z.Name == zone.Name);

            order.DeliveryZoneId = zone.Id;
            order.DeliveryZoneName = zone.Name;
            order.Address = addresses[random.Next(addresses.Length)];
            order.DeliveryFee = zone.FreeDeliveryFrom is { } freeFrom && order.SubTotal >= freeFrom ? 0 : zone.Fee;
            order.EstimatedMinutes = zone.MaxMinutes;

            if (couriers.Count > 0 && status is OrderStatus.OnTheWay or OrderStatus.Completed)
            {
                order.CourierId = couriers[random.Next(couriers.Count)].Id;
            }
        }

        order.TotalAmount = order.SubTotal + order.DeliveryFee;
        return order;
    }
}
