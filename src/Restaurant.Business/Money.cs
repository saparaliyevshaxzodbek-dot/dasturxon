using System.Globalization;

namespace Restaurant.Business;

public static class Money
{
    /// <summary>Formats an amount the way prices are written in Uzbekistan: "60 000 so'm".</summary>
    public static string Format(decimal amount) =>
        amount.ToString("#,0", CultureInfo.InvariantCulture).Replace(',', ' ') + " so'm";
}
