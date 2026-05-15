namespace GymManagement.Application.DTOs.Dashboard;

public record DashboardStatsDto(
    int TotalMembers,
    int ActiveMembers,
    int ExpiredMemberships,
    int ExpiringSoonMemberships,
    int AttendanceToday,
    decimal RevenueToday,
    decimal RevenueThisMonth,
    decimal RevenueThisYear,
    int NewMembersThisMonth);

public record RevenuePointDto(string Label, decimal Revenue);
public record AttendancePointDto(string Label, int Count);
public record MembershipDistributionDto(string Status, int Count);
public record PlanPopularityDto(string PlanName, int Count);

public record DashboardChartsDto(
    IReadOnlyList<RevenuePointDto> RevenueLast12Months,
    IReadOnlyList<AttendancePointDto> AttendanceLast7Days,
    IReadOnlyList<MembershipDistributionDto> MembershipDistribution,
    IReadOnlyList<PlanPopularityDto> PopularPlans);
