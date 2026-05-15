using AutoMapper;
using GymManagement.Application.DTOs.Attendance;
using GymManagement.Application.DTOs.Auth;
using GymManagement.Application.DTOs.Members;
using GymManagement.Application.DTOs.Memberships;
using GymManagement.Application.DTOs.Notifications;
using GymManagement.Application.DTOs.Payments;
using GymManagement.Application.DTOs.Settings;
using GymManagement.Domain.Entities;

namespace GymManagement.Application.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<User, UserDto>()
            .ForCtorParam(nameof(UserDto.Role), opt => opt.MapFrom(s => s.Role.Name));

        CreateMap<User, StaffUserDto>()
            .ForCtorParam(nameof(StaffUserDto.Role), opt => opt.MapFrom(s => s.Role.Name));

        CreateMap<MembershipPlan, MembershipPlanDto>();

        // MemberDto extracts "current" plan/status/dates from the most recent
        // membership. We pre-compute that single membership in a helper so the
        // expression tree that AutoMapper sees never has to chain through a
        // potentially-null navigation (m.Plan, m.Member). Anything missing
        // becomes null instead of throwing NullReferenceException.
        CreateMap<Member, MemberDto>()
            .ForCtorParam(nameof(MemberDto.CurrentStatus), opt => opt.MapFrom(s =>
                LatestMembership(s) != null ? (Domain.Enums.MembershipStatus?)LatestMembership(s)!.Status : null))
            .ForCtorParam(nameof(MemberDto.CurrentPlanName), opt => opt.MapFrom(s =>
                LatestMembership(s) != null && LatestMembership(s)!.Plan != null
                    ? LatestMembership(s)!.Plan!.Name
                    : null))
            .ForCtorParam(nameof(MemberDto.MembershipStartDate), opt => opt.MapFrom(s =>
                LatestMembership(s) != null ? (DateTime?)LatestMembership(s)!.StartDate : null))
            .ForCtorParam(nameof(MemberDto.MembershipExpiryDate), opt => opt.MapFrom(s =>
                LatestMembership(s) != null ? (DateTime?)LatestMembership(s)!.ExpiryDate : null));

        CreateMap<Membership, MembershipDto>()
            .ForCtorParam(nameof(MembershipDto.MemberName), opt => opt.MapFrom(s => s.Member != null ? s.Member.FullName : ""))
            .ForCtorParam(nameof(MembershipDto.PlanName), opt => opt.MapFrom(s => s.Plan != null ? s.Plan.Name : ""))
            .ForCtorParam(nameof(MembershipDto.RemainingBalance), opt => opt.MapFrom(s => s.TotalPrice - s.AmountPaid));

        CreateMap<Payment, PaymentDto>()
            .ForCtorParam(nameof(PaymentDto.MemberName), opt => opt.MapFrom(s => s.Member != null ? s.Member.FullName : ""))
            .ForCtorParam(nameof(PaymentDto.PlanName), opt => opt.MapFrom(s =>
                s.Membership != null && s.Membership.Plan != null ? s.Membership.Plan.Name : null));

        CreateMap<Attendance, AttendanceDto>()
            .ForCtorParam(nameof(AttendanceDto.MemberName), opt => opt.MapFrom(s => s.Member != null ? s.Member.FullName : ""));

        CreateMap<Notification, NotificationDto>();

        CreateMap<GymSettings, GymSettingsDto>();
    }

    /// <summary>
    /// Returns the most recently expiring membership for a member, or null
    /// when the navigation collection is empty / not loaded. Centralised here
    /// so the four <see cref="MemberDto"/> ctor mappings stay consistent and
    /// null-safe in memory.
    /// </summary>
    private static Membership? LatestMembership(Member m)
    {
        if (m.Memberships == null || m.Memberships.Count == 0) return null;
        Membership? latest = null;
        foreach (var x in m.Memberships)
        {
            if (latest == null || x.ExpiryDate > latest.ExpiryDate)
                latest = x;
        }
        return latest;
    }
}
