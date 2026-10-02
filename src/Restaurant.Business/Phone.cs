namespace Restaurant.Business;

public static class Phone
{
    /// <summary>
    /// Reduces a phone number to "+" and digits so "+998 90 123-45-67" and "901234567" match.
    /// A 9-digit local Uzbek number gets the 998 country code.
    /// </summary>
    public static string Normalize(string value)
    {
        var digits = new string(value.Where(char.IsDigit).ToArray());
        if (digits.Length == 9)
        {
            digits = "998" + digits;
        }

        if (digits.Length < 10 || digits.Length > 15)
        {
            throw new BusinessRuleException("Telefon raqam noto'g'ri kiritilgan.");
        }

        return "+" + digits;
    }
}
