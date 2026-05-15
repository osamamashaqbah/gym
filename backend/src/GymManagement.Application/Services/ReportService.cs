using System.Globalization;
using System.Text;
using GymManagement.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.Application.Services;

/// <summary>
/// Lightweight CSV/Excel-compatible export. Front-end is responsible for PDF generation.
/// CSV is opened natively by Excel, keeping deployment dependency-free.
/// </summary>
public class ReportService : IReportService
{
    private readonly IApplicationDbContext _db;

    public ReportService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<byte[]> ExportMembersExcelAsync(CancellationToken ct)
    {
        var members = await _db.Members
            .Include(m => m.Memberships).ThenInclude(x => x.Plan)
            .Where(m => !m.IsArchived)
            .OrderByDescending(m => m.JoinedAt)
            .ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine("Full Name,Phone,Gender,Age,Email,Address,Plan,Status,Start,Expiry,Joined");
        foreach (var m in members)
        {
            var latest = m.Memberships.OrderByDescending(x => x.ExpiryDate).FirstOrDefault();
            sb.AppendLine(string.Join(",",
                Csv(m.FullName), Csv(m.PhoneNumber), m.Gender, m.Age,
                Csv(m.Email ?? ""), Csv(m.Address ?? ""),
                Csv(latest?.Plan.Name ?? ""), latest?.Status.ToString() ?? "",
                latest?.StartDate.ToString("yyyy-MM-dd") ?? "",
                latest?.ExpiryDate.ToString("yyyy-MM-dd") ?? "",
                m.JoinedAt.ToString("yyyy-MM-dd")));
        }
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<byte[]> ExportPaymentsExcelAsync(DateTime? from, DateTime? to, CancellationToken ct)
    {
        var q = _db.Payments.Include(p => p.Member).AsQueryable();
        if (from.HasValue) q = q.Where(p => p.PaidAt >= from.Value);
        if (to.HasValue) q = q.Where(p => p.PaidAt <= to.Value);
        var rows = await q.OrderByDescending(p => p.PaidAt).ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine("Invoice,Member,Amount,Method,Paid At,Reference");
        var ci = CultureInfo.InvariantCulture;
        foreach (var p in rows)
        {
            sb.AppendLine(string.Join(",",
                Csv(p.InvoiceNumber), Csv(p.Member.FullName),
                p.Amount.ToString("F2", ci), p.Method,
                p.PaidAt.ToString("yyyy-MM-dd HH:mm"), Csv(p.ReferenceNumber ?? "")));
        }
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<byte[]> ExportAttendanceExcelAsync(DateTime? from, DateTime? to, CancellationToken ct)
    {
        var q = _db.Attendances.Include(a => a.Member).AsQueryable();
        if (from.HasValue) q = q.Where(a => a.CheckInTime >= from.Value);
        if (to.HasValue) q = q.Where(a => a.CheckInTime <= to.Value);
        var rows = await q.OrderByDescending(a => a.CheckInTime).ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine("Member,Check-in Time,Notes");
        foreach (var a in rows)
        {
            sb.AppendLine(string.Join(",",
                Csv(a.Member.FullName),
                a.CheckInTime.ToString("yyyy-MM-dd HH:mm"),
                Csv(a.Notes ?? "")));
        }
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static string Csv(string s)
    {
        if (string.IsNullOrEmpty(s)) return "";
        var needs = s.Contains(',') || s.Contains('"') || s.Contains('\n');
        var v = s.Replace("\"", "\"\"");
        return needs ? $"\"{v}\"" : v;
    }
}
