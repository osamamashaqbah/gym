using GymManagement.Domain.Enums;

namespace GymManagement.Application.DTOs.Memberships;

public record MembershipPlanDto(
    Guid Id,
    string Name,
    string? Description,
    PlanDuration Duration,
    int DurationInMonths,
    decimal Price,
    bool IsActive);

public record CreatePlanRequest(
    string Name,
    string? Description,
    PlanDuration Duration,
    decimal Price);

public record UpdatePlanRequest(
    string Name,
    string? Description,
    decimal Price,
    bool IsActive);

public record MembershipDto(
    Guid Id,
    Guid MemberId,
    string MemberName,
    Guid PlanId,
    string PlanName,
    DateTime StartDate,
    DateTime ExpiryDate,
    MembershipStatus Status,
    decimal TotalPrice,
    decimal AmountPaid,
    decimal RemainingBalance,
    string? Notes);

public record CreateMembershipRequest(
    Guid MemberId,
    Guid PlanId,
    DateTime StartDate,
    decimal? CustomPrice,
    decimal InitialPayment,
    PaymentMethod PaymentMethod,
    string? Notes);

public record RenewMembershipRequest(
    Guid PlanId,
    DateTime StartDate,
    decimal? CustomPrice,
    decimal InitialPayment,
    PaymentMethod PaymentMethod,
    string? Notes);

public record FreezeMembershipRequest(int FreezeDays, string? Notes);
