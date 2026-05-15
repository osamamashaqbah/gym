using AutoMapper;
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
        // SQLite cannot SUM a decimal column directly (NotSupportedException
        // from the EF Core SQLite provider). We materialise the values as
        // double for aggregation and convert back to decimal in memory. The
        // numbers we're working with (gym revenue) easily fit in double.
        var revenueToday = (decimal)await _db.Payments
            .Where(p => p.PaidAt >= todayStart && p.PaidAt < todayEnd)
            .SumAsync(p => (double?)p.Amount, ct) ?? 0m;
        var revenueThisMonth = (decimal)await _db.Payments
            .Where(p => p.PaidAt >= monthStart)
            .SumAsync(p => (double?)p.Amount, ct) ?? 0m;
        var revenueThisYear = (decimal)await _db.Payments
            .Where(p => p.PaidAt >= yearStart)
            .SumAsync(p => (double?)p.Amount, ct) ?? 0m;
        var newMembersThisMonth = await _db.Members
            .CountAsync(m => m.JoinedAt >= monthStart, ct);

        return new DashboardStatsDto(
            totalMembers, activeMembers, expired, expiringSoon,
            attendanceToday, revenueToday, revenueThisMonth, revenueThisYear, newMembersThisMonth);
    }

    public async Task<DashboardChartsDto> GetChartsAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        // ----- Revenue last 12 months -----
        // We can't use server-side GroupBy(p.PaidAt.Year, p.PaidAt.Month) because
        // SQLite's EF Core provider stores DateTime as TEXT and cannot translate
        // DateTime.Year / DateTime.Month inside a GroupBy expression. Instead we
        // pull the raw (PaidAt, Amount) rows for the relevant window and bucket
        // them in memory. The row count is bounded by 12 months of payments.
        var start = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-11);
        var paymentRows = await _db.Payments
            .Where(p => p.PaidAt >= start)
            .Select(p => new { p.PaidAt, p.Amount })
            .ToListAsync(ct);

        var revenueLookup = paymentRows
            .GroupBy(p => new { p.PaidAt.Year, p.PaidAt.Month })
            .ToDictionary(g => (g.Key.Year, g.Key.Month), g => g.Sum(x => x.Amount));

        var revenueLast12 = new List<RevenuePointDto>();
        for (int i = 0; i < 12; i++)
        {
            var d = start.AddMonths(i);
            revenueLookup.TryGetValue((d.Year, d.Month), out var amount);
            revenueLast12.Add(new RevenuePointDto(d.ToString("MMM yy"), amount));
        }

        // ----- Attendance last 7 days -----
        // One query, bucketed in memory by day. Avoids 7 separate round-trips
        // and the same SQLite DateTime translation issue as above.
        var sevenDaysAgo = now.Date.AddDays(-6);
        var checkIns = await _db.Attendances
            .Where(a => a.CheckInTime >= sevenDaysAgo)
            .Select(a => a.CheckInTime)
            .ToListAsync(ct);

        var attendanceByDay = checkIns
            .GroupBy(t => t.Date)
            .ToDictionary(g => g.Key, g => g.Count());

        var attendanceLast7 = new List<AttendancePointDto>();
        for (int i = 6; i >= 0; i--)
        {
            var d = now.Date.AddDays(-i);
            attendanceByDay.TryGetValue(d, out var c);
            attendanceLast7.Add(new AttendancePointDto(d.ToString("ddd"), c));
        }

        // ----- Membership distribution -----
        // Status is an int-backed enum; this groups cleanly server-side on every
        // provider (no DateTime parts involved).
        var distGroups = await _db.Memberships
            .GroupBy(m => m.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);
        var distribution = distGroups
            .Select(x => new MembershipDistributionDto(x.Status.ToString(), x.Count))
            .ToList();

        // ----- Popular plans -----
        // Group by FK first (cheap, server-side), then resolve names in a second
        // query. This sidesteps EF Core's "GroupBy + Include" limitation.
        var planCounts = await _db.Memberships
            .GroupBy(m => m.PlanId)
            .Select(g => new { PlanId = g.Key, Count = g.Count() })
            .OrderByDescending(g => g.Count)
            .Take(5)
            .ToListAsync(ct);

        var planIds = planCounts.Select(p => p.PlanId).ToList();
        var planNames = await _db.MembershipPlans
            .Where(p => planIds.Contains(p.Id))
            .Select(p => new { p.Id, p.Name })
            .ToDictionaryAsync(p => p.Id, p => p.Name, ct);

        var popularPlans = planCounts
            .Select(p => new PlanPopularityDto(
                planNames.TryGetValue(p.PlanId, out var name) ? name : "—",
                p.Count))
            .ToList();

        return new DashboardChartsDto(revenueLast12, attendanceLast7, distribution, popularPlans);
    }

    public async Task<IReadOnlyList<PaymentDto>> GetRecentPaymentsAsync(int take, CancellationToken ct)
    {
        // Materialise first (Include avoids ProjectTo subqueries that don't
        // translate cleanly on every provider), then map in memory.
        var payments = await _db.Payments
            .Include(p => p.Member)
            .Include(p => p.Membership)!
                .ThenInclude(m => m!.Plan)
            .OrderByDescending(p => p.PaidAt)
            .Take(take)
            .ToListAsync(ct);

        return payments.Select(p => _mapper.Map<PaymentDto>(p)).ToList();
    }

    public async Task<IReadOnlyList<MemberDto>> GetRecentMembersAsync(int take, CancellationToken ct)
    {
        // Same approach as above: load with includes, map in memory. The
        // MemberDto mapping pulls "current plan / status / dates" from the
        // member's most recent membership, which works fine in memory.
        var members = await _db.Members
            .Include(m => m.Memberships).ThenInclude(x => x.Plan)
            .Where(m => !m.IsArchived)
            .OrderByDescending(m => m.JoinedAt)
            .Take(take)
            .ToListAsync(ct);

        return members.Select(m => _mapper.Map<MemberDto>(m)).ToList();
    }
}
