using AutoMapper;
using AutoMapper.QueryableExtensions;
using GymManagement.Application.DTOs.Dashboard;
using GymManagement.Application.DTOs.Members;
using GymManagement.Application.DTOs.Payments;
using GymManagement.Application.Interfaces;
using GymManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IApplicationDbContext _db;
    private readonly IMapper _mapper;

    public DashboardService(IApplicationDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<DashboardStatsDto> GetStatsAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var todayEnd = todayStart.AddDays(1);
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var yearStart = new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var soon = now.AddDays(7);

        var totalMembers = await _db.Members.CountAsync(m => !m.IsArchived, ct);
        var activeMembers = await _db.Memberships
            .CountAsync(m => m.Status == MembershipStatus.Active && m.ExpiryDate >= now, ct);
        var expired = await _db.Memberships
            .CountAsync(m => m.Status == MembershipStatus.Expired || m.ExpiryDate < now, ct);
        var expiringSoon = await _db.Memberships
            .CountAsync(m => m.Status == MembershipStatus.Active && m.ExpiryDate >= now && m.ExpiryDate <= soon, ct);
        var attendanceToday = await _db.Attendances
            .CountAsync(a => a.CheckInTime >= todayStart && a.CheckInTime < todayEnd, ct);
        var revenueToday = (decimal)(await _db.Payments
            .Where(p => p.PaidAt >= todayStart && p.PaidAt < todayEnd)
            .SumAsync(p => (double?)p.Amount, ct) ?? 0d);
        var revenueThisMonth = (decimal)(await _db.Payments
            .Where(p => p.PaidAt >= monthStart)
            .SumAsync(p => (double?)p.Amount, ct) ?? 0d);
        var revenueThisYear = (decimal)(await _db.Payments
            .Where(p => p.PaidAt >= yearStart)
            .SumAsync(p => (double?)p.Amount, ct) ?? 0d);
        var newMembersThisMonth = await _db.Members
            .CountAsync(m => m.JoinedAt >= monthStart, ct);

        return new DashboardStatsDto(
            totalMembers, activeMembers, expired, expiringSoon,
            attendanceToday, revenueToday, revenueThisMonth, revenueThisYear, newMembersThisMonth);
    }

    public async Task<DashboardChartsDto> GetChartsAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        // Revenue last 12 months
        var start = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-11);
        var revenueRows = await _db.Payments
            .Where(p => p.PaidAt >= start)
            .GroupBy(p => new { p.PaidAt.Year, p.PaidAt.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Revenue = (decimal)g.Sum(x => (double)x.Amount) })
            .ToListAsync(ct);

        var revenueLast12 = new List<RevenuePointDto>();
        for (int i = 0; i < 12; i++)
        {
            var d = start.AddMonths(i);
            var match = revenueRows.FirstOrDefault(r => r.Year == d.Year && r.Month == d.Month);
            revenueLast12.Add(new RevenuePointDto(d.ToString("MMM yy"), match?.Revenue ?? 0m));
        }

        // Attendance last 7 days
        var attendanceLast7 = new List<AttendancePointDto>();
        for (int i = 6; i >= 0; i--)
        {
            var d = now.Date.AddDays(-i);
            var next = d.AddDays(1);
            var c = await _db.Attendances.CountAsync(a => a.CheckInTime >= d && a.CheckInTime < next, ct);
            attendanceLast7.Add(new AttendancePointDto(d.ToString("ddd"), c));
        }

        // Membership distribution
        var distGroups = await _db.Memberships
            .GroupBy(m => m.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);
        var distribution = distGroups
            .Select(x => new MembershipDistributionDto(x.Status.ToString(), x.Count))
            .ToList();

        // Popular plans
        var planGroups = await _db.Memberships
            .Include(m => m.Plan)
            .GroupBy(m => m.Plan.Name)
            .Select(g => new PlanPopularityDto(g.Key, g.Count()))
            .OrderByDescending(g => g.Count)
            .Take(5)
            .ToListAsync(ct);

        return new DashboardChartsDto(revenueLast12, attendanceLast7, distribution, planGroups);
    }

    public async Task<IReadOnlyList<PaymentDto>> GetRecentPaymentsAsync(int take, CancellationToken ct)
    {
        return await _db.Payments
            .OrderByDescending(p => p.PaidAt)
            .Take(take)
            .ProjectTo<PaymentDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<MemberDto>> GetRecentMembersAsync(int take, CancellationToken ct)
    {
        return await _db.Members
            .Where(m => !m.IsArchived)
            .OrderByDescending(m => m.JoinedAt)
            .Take(take)
            .ProjectTo<MemberDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);
    }
}
