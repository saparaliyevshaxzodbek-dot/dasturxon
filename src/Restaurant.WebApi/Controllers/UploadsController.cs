using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Restaurant.WebApi.Infrastructure;

namespace Restaurant.WebApi.Controllers;

/// <summary>Dish photos, stored under wwwroot/uploads and served as static files.</summary>
[ApiController]
[Route("api/uploads")]
[Authorize(Roles = Roles.Management)]
public class UploadsController(IWebHostEnvironment environment) : ControllerBase
{
    private const long MaxImageBytes = 5 * 1024 * 1024;

    // SVG is left out on purpose: it can carry scripts.
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

    [HttpPost("image")]
    [RequestSizeLimit(MaxImageBytes + (64 * 1024))]
    public async Task<ActionResult<UploadResult>> UploadImage(IFormFile file, CancellationToken ct)
    {
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension) || !file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            return this.Problem(statusCode: StatusCodes.Status400BadRequest, title: "Faqat JPG, PNG yoki WEBP rasm yuklash mumkin.");
        }

        if (file.Length is 0 or > MaxImageBytes)
        {
            return this.Problem(statusCode: StatusCodes.Status400BadRequest, title: "Rasm hajmi 5 MB dan oshmasligi kerak.");
        }

        var folder = Path.Combine(environment.WebRootPath, "uploads");
        Directory.CreateDirectory(folder);

        var fileName = $"{Guid.NewGuid():N}{extension}";
        await using (var stream = System.IO.File.Create(Path.Combine(folder, fileName)))
        {
            await file.CopyToAsync(stream, ct);
        }

        return new UploadResult($"/uploads/{fileName}");
    }
}

public record UploadResult(string Url);
