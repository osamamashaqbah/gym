using GymManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymManagement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;

    public DashboardController(IDashboardService service) => _service = service;

    [HttpGet("stats")]
    public async Task<IActionResult> Stats(CancellationToken ct) => Ok(await _service.GetStatsAsync(ct));

    [HttpGet("charts")]
    public async Task<IActionResult> Charts(CancellationToken ct) => Ok(await _service.GetChartsAsync(ct));

    [HttpGet("recent-payments")]
    public async Task<IActionResult> RecentPayments([FromQuery] int take = 6, CancellationToken ct = default)
        => Ok(await _service.GetRecentPaymentsAsync(take, ct));

    [HttpGet("recent-members")]
    public async Task<IActionResult> RecentMembers([FromQuery] int take = 6, CancellationToken ct = default)
        => Ok(await _service.GetRecentMembersAsync(take, ct));
}
