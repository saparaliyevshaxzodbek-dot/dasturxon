using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Restaurant.Data;

/// <summary>
/// SQLite hands DateTime back with Kind=Unspecified; marking it as UTC makes the API
/// serialize timestamps with a trailing "Z" so browsers convert them to local time correctly.
/// </summary>
public class UtcDateTimeConverter() : ValueConverter<DateTime, DateTime>(
    v => v.Kind == DateTimeKind.Utc ? v : v.ToUniversalTime(),
    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
