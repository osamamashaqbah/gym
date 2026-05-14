using GymManagement.Application.DTOs.Memberships;
using GymManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymManagement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/memberships")]
public class MembershipsController : ControllerBase
{
    private readonly IMembershipService _service;

    public MembershipsController(IMembershipService service) => _service = service;

    [HttpGet("plans")]
    public async Task<IActionResult> GetPlans(CancellationToken ct) => Ok(await _service.GetPlansAsync(ct));

    [HttpPost("plans")]
    [Authorize(Roles = "Owner,Admin")]
    public async Task<IActionResult> CreatePlan([FromBody] CreatePlanRequest req, CancellationToken ct)
    {
        var r = await _service.CreatePlanAsync(req, ct);
        return r.Success ? Ok(r.Data) : StatusCode(r.StatusCode, new { error = r.Error });
    }

    [HttpPut("plans/{id:guid}")]
    [Authorize(Roles = "Owner,Admin")]
    public async Task<IActionResult> UpdatePlan(Guid id, [FromBody] UpdatePlanRequest req, CancellationToken ct)
    {
        var r = await _service.UpdatePlanAsync(id, req, ct);
        return r.Success ? Ok(r.Data) : StatusCode(r.StatusCode, new { error = r.Error });
    }

    [HttpDelete("plans/{id:guid}")]
    [Authorize(Roles = "Owner,Admin")]
    public async Task<IActionResult> DeletePlan(Guid id, CancellationToken ct)
    {
        var r = await _service.DeletePlanAsync(id, ct);
        return r.Success ? NoContent() : StatusCode(r.StatusCode, new { error = r.Error });
    }

    [HttpGet("by-member/{memberId:guid}")]
    public async Task<IActionResult> GetByMember(Guid memberId, CancellationToken ct)
        => Ok(await _service.GetByMemberAsync(memberId, ct));

    [HttpPost]
    [Authorize(Roles = "Owner,Admin,Reception")]
    public async Task<IActionResult> Create([FromBody] CreateMembershipRequest req, CancellationToken ct)
    {
        var r = await _service.CreateAsync(req, ct);
        return r.Success ? Ok(r.Data) : StatusCode(r.StatusCode, new { error = r.Error });
    }

    [HttpPost("renew/{memberId:guid}")]
    [Authorize(Roles = "Owner,Admin,Reception")]
    public async Task<IActionResult> Renew(Guid memberId, [FromBody] RenewMembershipRequest req, CancellationToken ct)
    {
        var r = await _service.RenewAsync(memberId, req, ct);
        return r.Success ? Ok(r.Data) : StatusCode(r.StatusCode, new { error = r.Error });
    }

    [HttpPost("{id:guid}/freeze")]
    [Authorize(Roles = "Owner,Admin,Reception")]
    public async Task<IActionResult> Freeze(Guid id, [FromBody] FreezeMembershipRequest req, CancellationToken ct)
    {
        var r = await _service.FreezeAsync(id, req, ct);
        return r.Success ? Ok(r.Data) : StatusCode(r.StatusCode, new { error = r.Error });
    }

    [HttpPost("{id:guid}/unfreeze")]
    [Authorize(Roles = "Owner,Admin,Reception")]
    public async Task<IActionResult> Unfreeze(Guid id, CancellationToken ct)
    {
        var r = await _service.UnfreezeAsync(id, ct);
        return r.Success ? Ok(r.Data) : StatusCode(r.StatusCode, new { error = r.Error });
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize(Roles = "Owner,Admin")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct)
    {
        var r = await _service.CancelAsync(id, ct);
        return r.Success ? Ok(r.Data) : StatusCode(r.StatusCode, new { error = r.Error });
    }

    [HttpPost("refresh-expired")]
    [Authorize(Roles = "Owner,Admin")]
    public async Task<IActionResult> RefreshExpired(CancellationToken ct)
        => Ok(new { updated = await _service.RefreshExpiredMembershipsAsync(ct) });
}
