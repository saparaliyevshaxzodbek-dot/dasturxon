namespace Restaurant.Data;

public enum StaffRole
{
    Admin = 1,
    Manager = 2,
    Cook = 3,
    Courier = 4,
}

public enum DeliveryType
{
    Delivery = 1,
    Pickup = 2,
    DineIn = 3,
}

public enum OrderStatus
{
    New = 1,
    Preparing = 2,
    Ready = 3,
    OnTheWay = 4,
    Completed = 5,
    Cancelled = 6,
}

public enum PaymentMethod
{
    Cash = 1,
    Card = 2,
}
