using GymManagement.Application.DTOs.Settings;
using GymManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymManagement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/settings")]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _service;

    public SettingsController(ISettingsService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct) => Ok(await _service.GetAsync(ct));

    [HttpPut]
    [Authorize(Roles = "Owner,Admin")]
    public async Task<IActionResult> Update([FromBody] UpdateGymSettingsRequest req, CancellationToken ct)
        => Ok(await _service.UpdateAsync(req, ct));

    [HttpGet("staff")]
    [Authorize(Roles = "Owner,Admin")]
    public async Task<IActionResult> GetStaff(CancellationToken ct) => Ok(await _service.GetStaffAsync(ct));

    [HttpPost("staff")]
    [Authorize(Roles = "Owner,Admin")]
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffRequest req, CancellationToken ct)
    {
        var r = await _service.CreateStaffAsync(req, ct);
        return r.Success ? Ok(r.Data) : StatusCode(r.StatusCode, new { error = r.Error });
    }

    [HttpPut("staff/{id:guid}")]
    [Authorize(Roles = "Owner,Admin")]
    public async Task<IActionResult> UpdateStaff(Guid id, [FromBody] UpdateStaffRequest req, CancellationToken ct)
    {
        var r = await _service.UpdateStaffAsync(id, req, ct);
        return r.Success ? Ok(r.Data) : StatusCode(r.StatusCode, new { error = r.Error });
    }

    [HttpDelete("staff/{id:guid}")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> DeleteStaff(Guid id, CancellationToken ct)
    {
        var r = await _service.DeleteStaffAsync(id, ct);
        return r.Success ? NoContent() : StatusCode(r.StatusCode, new { error = r.Error });
    }
}
