using System.Diagnostics;
using System.Runtime.InteropServices;
using FluentValidation;
using FluentValidation.AspNetCore;
using GymManagement.Api.Middleware;
using GymManagement.Application;
using GymManagement.Application.Interfaces;
using GymManagement.Application.Validators;
using GymManagement.Infrastructure;
using GymManagement.Infrastructure.Persistence;
using Microsoft.Extensions.FileProviders;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Bind URL from configuration so the EXE always knows where it lives.
var appUrl = builder.Configuration["App:Url"] ?? "http://localhost:5080";
builder.WebHost.UseUrls(appUrl);

// When published as a self-contained single file, the working directory may
// differ from the executable directory. Force ContentRoot to the EXE folder
// so wwwroot, ironforge.db, and appsettings.json are found.
var exeDir = Path.GetDirectoryName(Environment.ProcessPath) ?? AppContext.BaseDirectory;
builder.Environment.ContentRootPath = exeDir;
builder.Environment.WebRootPath = Path.Combine(exeDir, "wwwroot");

// Layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// MVC + Validators
builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

// CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:4200" };
builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
    p.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

// Swagger with JWT
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(o =>
{
    o.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Gym Management API",
        Version = "v1",
        Description = "Premium gym management platform — REST API"
    });
    var jwtScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Enter: Bearer {your JWT}",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    };
    o.AddSecurityDefinition("Bearer", jwtScheme);
    o.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() }
    });
});

var app = builder.Build();

// Migrate + Seed
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    try { await DataSeeder.SeedAsync(db, hasher); }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "DB seed failed. App will still start.");
    }
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(o =>
{
    o.SwaggerEndpoint("/swagger/v1/swagger.json", "Gym Management API v1");
    o.RoutePrefix = "swagger";
});

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// Serve the Angular SPA from wwwroot (single-EXE deployment).
var wwwroot = Path.Combine(exeDir, "wwwroot");
if (Directory.Exists(wwwroot))
{
    app.UseDefaultFiles(new DefaultFilesOptions
    {
        FileProvider = new PhysicalFileProvider(wwwroot),
        DefaultFileNames = new List<string> { "index.html" }
    });
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(wwwroot)
    });
}

app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok", time = DateTime.UtcNow }));

// SPA fallback: any unknown non-API path returns index.html so Angular routes work.
app.MapFallback(async ctx =>
{
    var indexPath = Path.Combine(wwwroot, "index.html");
    if (File.Exists(indexPath))
    {
        ctx.Response.ContentType = "text/html";
        await ctx.Response.SendFileAsync(indexPath);
    }
    else
    {
        ctx.Response.Redirect("/swagger");
    }
});

// Friendly console banner + auto-open browser.
PrintBanner(appUrl);
if (builder.Configuration.GetValue<bool>("App:OpenBrowserOnStart"))
{
    _ = Task.Run(async () =>
    {
        await Task.Delay(800);
        TryOpenBrowser(appUrl);
    });
}

app.Run();

static void PrintBanner(string url)
{
    var line = new string('═', 60);
    Console.ForegroundColor = ConsoleColor.Cyan;
    Console.WriteLine();
    Console.WriteLine(line);
    Console.WriteLine("   IRON FORGE — PREMIUM GYM MANAGEMENT");
    Console.WriteLine(line);
    Console.ResetColor();
    Console.WriteLine($"   App:     {url}");
    Console.WriteLine($"   Swagger: {url}/swagger");
    Console.WriteLine();
    Console.ForegroundColor = ConsoleColor.DarkGray;
    Console.WriteLine("   Press Ctrl+C to stop the server.");
    Console.ResetColor();
    Console.WriteLine();
}

static void TryOpenBrowser(string url)
{
    try
    {
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            Process.Start(new ProcessStartInfo { FileName = url, UseShellExecute = true });
        else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
            Process.Start("open", url);
        else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
            Process.Start("xdg-open", url);
    }
    catch { /* best effort */ }
}
