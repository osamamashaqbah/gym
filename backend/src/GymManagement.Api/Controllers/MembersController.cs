using GymManagement.Application.Common;
using GymManagement.Application.DTOs.Members;
using GymManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QRCoder;

namespace GymManagement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/members")]
public class MembersController : ControllerBase
{
    private readonly IMemberService _service;

    public MembersController(IMemberService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PaginationQuery q, [FromQuery] string? status, CancellationToken ct)
        => Ok(await _service.GetAllAsync(q, status, ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost]
    [Authorize(Roles = "Owner,Admin,Reception")]
    public async Task<IActionResult> Create([FromBody] CreateMemberRequest req, CancellationToken ct)
    {
        var r = await _service.CreateAsync(req, ct);
        return r.Success ? Ok(r.Data) : StatusCode(r.StatusCode, new { error = r.Error });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Owner,Admin,Reception")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMemberRequest req, CancellationToken ct)
    {
        var r = await _service.UpdateAsync(id, req, ct);
        return r.Success ? Ok(r.Data) : StatusCode(r.StatusCode, new { error = r.Error });
    }

    [HttpPost("{id:guid}/archive")]
    [Authorize(Roles = "Owner,Admin")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken ct)
    {
        var r = await _service.ArchiveAsync(id, ct);
        return r.Success ? NoContent() : StatusCode(r.StatusCode, new { error = r.Error });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Owner,Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var r = await _service.DeleteAsync(id, ct);
        return r.Success ? NoContent() : StatusCode(r.StatusCode, new { error = r.Error });
    }

    [HttpGet("{id:guid}/qrcode")]
    public async Task<IActionResult> QrCode(Guid id, CancellationToken ct)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        if (dto is null) return NotFound();

        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode($"GYM-MEMBER:{id}", QRCodeGenerator.ECCLevel.Q);
        var png = new PngByteQRCode(data).GetGraphic(10);
        return File(png, "image/png");
    }
}
