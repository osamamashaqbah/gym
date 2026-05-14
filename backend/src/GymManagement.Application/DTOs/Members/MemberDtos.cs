using GymManagement.Domain.Enums;

namespace GymManagement.Application.DTOs.Members;

public record MemberDto(
    Guid Id,
    string FullName,
    string PhoneNumber,
    Gender Gender,
    int Age,
    string? Address,
    string? Email,
    string? ProfileImageUrl,
    string? Notes,
    DateTime JoinedAt,
    MembershipStatus? CurrentStatus,
    string? CurrentPlanName,
    DateTime? MembershipStartDate,
    DateTime? MembershipExpiryDate);

public record CreateMemberRequest(
    string FullName,
    string PhoneNumber,
    Gender Gender,
    int Age,
    string? Address,
    string? Email,
    string? ProfileImageUrl,
    string? Notes,
    Guid? PlanId);

public record UpdateMemberRequest(
    string FullName,
    string PhoneNumber,
    Gender Gender,
    int Age,
    string? Address,
    string? Email,
    string? ProfileImageUrl,
    string? Notes);
