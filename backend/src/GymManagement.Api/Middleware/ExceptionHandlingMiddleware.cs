using System.Net;
using System.Text.Json;
using FluentValidation;

namespace GymManagement.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException vex)
        {
            _logger.LogWarning(vex, "Validation failed");
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            context.Response.ContentType = "application/json";
            var payload = new
            {
                success = false,
                error = "Validation failed",
                details = vex.Errors.Select(e => new { e.PropertyName, e.ErrorMessage })
            };
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
        catch (Exception ex)
        {
            // Print the full exception (with stack trace) to the API console
            // window. When the user is running the single-file EXE this is the
            // black console behind the browser — we want it loud and obvious
            // so problems can be diagnosed without attaching a debugger.
            _logger.LogError(ex, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);

            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";

            // Surface the actual exception type + message back to the client.
            // For a single-tenant gym management system running locally this
            // is far more useful than a generic "Server error" toast.
            var rootCause = ex;
            while (rootCause.InnerException != null) rootCause = rootCause.InnerException;

            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                success = false,
                error = $"{rootCause.GetType().Name}: {rootCause.Message}"
            }));
        }
    }
}
