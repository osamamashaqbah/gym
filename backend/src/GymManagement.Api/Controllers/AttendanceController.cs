using GymManagement.Application.Common;
using GymManagement.Application.DTOs.Attendance;
using GymManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymManagement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/attendance")]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _service;

    public AttendanceController(IAttendanceService service) => _service = service;

    [HttpPost("check-in")]
    [Authorize(Roles = "Owner,Admin,Reception,Coach")]
    public async Task<IActionResult> CheckIn([FromBody] CheckInRequest req, CancellationToken ct)
    {
        var r = await _service.CheckInAsync(req, ct);
        return r.Success ? Ok(r.Data) : StatusCode(r.StatusCode, new { error = r.Error });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] PaginationQuery q,
        [FromQuery] DateTime? date,
        [FromQuery] Guid? memberId,
        CancellationToken ct) => Ok(await _service.GetAllAsync(q, date, memberId, ct));

    [HttpGet("by-member/{memberId:guid}")]
    public async Task<IActionResult> GetByMember(Guid memberId, CancellationToken ct)
        => Ok(await _service.GetByMemberAsync(memberId, ct));
}
