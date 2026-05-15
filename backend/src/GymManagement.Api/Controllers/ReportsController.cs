using GymManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymManagement.Api.Controllers;

[ApiController]
[Authorize(Roles = "Owner,Admin")]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _service;

    public ReportsController(IReportService service) => _service = service;

    [HttpGet("members.csv")]
    public async Task<IActionResult> Members(CancellationToken ct)
    {
        var bytes = await _service.ExportMembersExcelAsync(ct);
        return File(bytes, "text/csv", "members.csv");
    }

    [HttpGet("payments.csv")]
    public async Task<IActionResult> Payments([FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
    {
        var bytes = await _service.ExportPaymentsExcelAsync(from, to, ct);
        return File(bytes, "text/csv", "payments.csv");
    }

    [HttpGet("attendance.csv")]
    public async Task<IActionResult> Attendance([FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
    {
        var bytes = await _service.ExportAttendanceExcelAsync(from, to, ct);
        return File(bytes, "text/csv", "attendance.csv");
    }
}
