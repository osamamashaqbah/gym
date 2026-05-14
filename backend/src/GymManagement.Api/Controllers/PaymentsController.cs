using GymManagement.Application.Common;
using GymManagement.Application.DTOs.Payments;
using GymManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymManagement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _service;

    public PaymentsController(IPaymentService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] PaginationQuery q,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken ct) => Ok(await _service.GetAllAsync(q, from, to, ct));

    [HttpGet("by-member/{memberId:guid}")]
    public async Task<IActionResult> GetByMember(Guid memberId, CancellationToken ct)
        => Ok(await _service.GetByMemberAsync(memberId, ct));

    [HttpPost]
    [Authorize(Roles = "Owner,Admin,Reception")]
    public async Task<IActionResult> Create([FromBody] CreatePaymentRequest req, CancellationToken ct)
    {
        var r = await _service.CreateAsync(req, ct);
        return r.Success ? Ok(r.Data) : StatusCode(r.StatusCode, new { error = r.Error });
    }

    [HttpGet("{id:guid}/invoice")]
    public async Task<IActionResult> GetInvoice(Guid id, CancellationToken ct)
    {
        var inv = await _service.GetInvoiceAsync(id, ct);
        return inv is null ? NotFound() : Ok(inv);
    }

    [HttpGet("{id:guid}/invoice/html")]
    public async Task<IActionResult> GetInvoiceHtml(Guid id, CancellationToken ct)
    {
        var bytes = await _service.GetInvoicePdfAsync(id, ct);
        if (bytes is null) return NotFound();
        return File(bytes, "text/html", $"invoice-{id}.html");
    }
}
