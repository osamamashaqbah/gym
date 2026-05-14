using System.Globalization;
using System.Text;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using GymManagement.Application.Common;
using GymManagement.Application.DTOs.Payments;
using GymManagement.Application.Interfaces;
using GymManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.Application.Services;

public class PaymentService : IPaymentService
{
    private readonly IApplicationDbContext _db;
    private readonly IMapper _mapper;

    public PaymentService(IApplicationDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<PagedResult<PaymentDto>> GetAllAsync(PaginationQuery q, DateTime? from, DateTime? to, CancellationToken ct)
    {
        var query = _db.Payments.AsQueryable();
        if (from.HasValue) query = query.Where(p => p.PaidAt >= from.Value);
        if (to.HasValue) query = query.Where(p => p.PaidAt <= to.Value);

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim().ToLower();
            query = query.Where(p =>
                p.Member.FullName.ToLower().Contains(s) ||
                p.InvoiceNumber.ToLower().Contains(s));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(p => p.PaidAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .ProjectTo<PaymentDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return new PagedResult<PaymentDto>
        {
            Items = items, TotalCount = total, Page = q.Page, PageSize = q.PageSize
        };
    }

    public async Task<IReadOnlyList<PaymentDto>> GetByMemberAsync(Guid memberId, CancellationToken ct)
    {
        return await _db.Payments
            .Where(p => p.MemberId == memberId)
            .OrderByDescending(p => p.PaidAt)
            .ProjectTo<PaymentDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);
    }

    public async Task<Result<PaymentDto>> CreateAsync(CreatePaymentRequest req, CancellationToken ct)
    {
        var member = await _db.Members.FirstOrDefaultAsync(m => m.Id == req.MemberId, ct);
        if (member is null) return Result<PaymentDto>.Fail("Member not found", 404);

        Membership? membership = null;
        if (req.MembershipId.HasValue)
        {
            membership = await _db.Memberships.FirstOrDefaultAsync(m => m.Id == req.MembershipId, ct);
            if (membership is null) return Result<PaymentDto>.Fail("Membership not found", 404);
        }

        var payment = new Payment
        {
            MemberId = req.MemberId,
            MembershipId = req.MembershipId,
            Amount = req.Amount,
            Method = req.Method,
            PaidAt = DateTime.UtcNow,
            ReferenceNumber = req.ReferenceNumber,
            Notes = req.Notes,
            InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}"
        };

        if (membership is not null)
        {
            membership.AmountPaid += req.Amount;
            membership.UpdatedAt = DateTime.UtcNow;
        }

        _db.Payments.Add(payment);
        await _db.SaveChangesAsync(ct);

        var dto = await _db.Payments
            .Where(p => p.Id == payment.Id)
            .ProjectTo<PaymentDto>(_mapper.ConfigurationProvider)
            .FirstAsync(ct);
        return Result<PaymentDto>.Ok(dto);
    }

    public async Task<InvoiceDto?> GetInvoiceAsync(Guid paymentId, CancellationToken ct)
    {
        var payment = await _db.Payments
            .Include(p => p.Member)
            .Include(p => p.Membership)!
                .ThenInclude(m => m!.Plan)
            .FirstOrDefaultAsync(p => p.Id == paymentId, ct);
        if (payment is null) return null;

        var settings = await _db.GymSettings.FirstOrDefaultAsync(ct);

        return new InvoiceDto(
            payment.InvoiceNumber,
            payment.PaidAt,
            settings?.GymName ?? "Iron Forge Gym",
            settings?.Address,
            settings?.PhoneNumber,
            payment.Member.FullName,
            payment.Member.PhoneNumber,
            payment.Membership?.Plan.Name,
            payment.Amount,
            payment.Method,
            settings?.Currency ?? "JOD",
            payment.Membership is null ? 0 : payment.Membership.TotalPrice - payment.Membership.AmountPaid);
    }

    public async Task<byte[]?> GetInvoicePdfAsync(Guid paymentId, CancellationToken ct)
    {
        // Lightweight HTML invoice the API exposes; the frontend renders/prints to PDF.
        var inv = await GetInvoiceAsync(paymentId, ct);
        if (inv is null) return null;
        var html = BuildInvoiceHtml(inv);
        return Encoding.UTF8.GetBytes(html);
    }

    private static string BuildInvoiceHtml(InvoiceDto inv)
    {
        var ci = CultureInfo.InvariantCulture;
        return $@"<!DOCTYPE html><html><head><meta charset=""utf-8"">
<title>Invoice {inv.InvoiceNumber}</title>
<style>
body {{ font-family: Arial, sans-serif; padding: 40px; color: #111; }}
.header {{ display:flex; justify-content:space-between; border-bottom:3px solid #111; padding-bottom:16px; }}
.gym {{ font-size: 24px; font-weight: bold; }}
.label {{ color: #666; font-size: 12px; text-transform: uppercase; }}
table {{ width:100%; margin-top: 24px; border-collapse: collapse; }}
th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }}
.total {{ font-size: 22px; font-weight: bold; text-align:right; margin-top: 24px; }}
</style></head><body>
<div class=""header"">
  <div><div class=""gym"">{inv.GymName}</div><div>{inv.GymAddress}</div><div>{inv.GymPhone}</div></div>
  <div><div class=""label"">Invoice #</div><div><strong>{inv.InvoiceNumber}</strong></div>
  <div class=""label"">Date</div><div>{inv.IssuedAt:yyyy-MM-dd}</div></div>
</div>
<h3>Billed to</h3>
<div>{inv.MemberName}</div><div>{inv.MemberPhone}</div>
<table><thead><tr><th>Description</th><th>Method</th><th style=""text-align:right"">Amount</th></tr></thead>
<tbody><tr><td>{inv.PlanName ?? "Payment"}</td><td>{inv.Method}</td><td style=""text-align:right"">{inv.Amount.ToString("N2", ci)} {inv.Currency}</td></tr></tbody></table>
<div class=""total"">Total: {inv.Amount.ToString("N2", ci)} {inv.Currency}</div>
<p>Remaining balance: {inv.RemainingBalance.ToString("N2", ci)} {inv.Currency}</p>
<p style=""margin-top:60px;text-align:center;color:#666;"">Thank you for choosing {inv.GymName}</p>
</body></html>";
    }
}
