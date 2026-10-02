namespace Restaurant.WebApi.Infrastructure;

/// <summary>Rate limiter policies for the endpoints anyone can call without logging in.</summary>
public static class RateLimits
{
    public const string Login = "login";
    public const string PublicOrders = "public-orders";
}
