using GymManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymManagement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _service;

    public NotificationsController(INotificationService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool unreadOnly = false, CancellationToken ct = default)
        => Ok(await _service.GetAllAsync(unreadOnly, ct));

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct)
    {
        await _service.MarkAsReadAsync(id, ct);
        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        await _service.MarkAllAsReadAsync(ct);
        return NoContent();
    }

    [HttpPost("generate-expiry-alerts")]
    [Authorize(Roles = "Owner,Admin")]
    public async Task<IActionResult> Generate(CancellationToken ct)
        => Ok(new { created = await _service.GenerateExpiryAlertsAsync(ct) });
}
