namespace Restaurant.Business;

public static class RestaurantTime
{
    /// <summary>Uzbekistan is UTC+5 all year (no daylight saving).</summary>
    public static readonly TimeSpan Offset = TimeSpan.FromHours(5);

    public static DateOnly Today(TimeProvider time) =>
        DateOnly.FromDateTime(time.GetUtcNow().ToOffset(Offset).DateTime);

    /// <summary>UTC instant at which the given local restaurant day starts.</summary>
    public static DateTime StartOfDayUtc(DateOnly date) =>
        new DateTimeOffset(date.ToDateTime(TimeOnly.MinValue), Offset).UtcDateTime;

    public static DateOnly ToLocalDate(DateTime utc) =>
        DateOnly.FromDateTime(new DateTimeOffset(DateTime.SpecifyKind(utc, DateTimeKind.Utc)).ToOffset(Offset).DateTime);
}
