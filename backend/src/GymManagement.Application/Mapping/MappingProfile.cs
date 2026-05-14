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

        CreateMap<Member, MemberDto>()
            .ForCtorParam(nameof(MemberDto.CurrentStatus), opt => opt.MapFrom(s =>
                s.Memberships.OrderByDescending(m => m.ExpiryDate).Select(m => (Domain.Enums.MembershipStatus?)m.Status).FirstOrDefault()))
            .ForCtorParam(nameof(MemberDto.CurrentPlanName), opt => opt.MapFrom(s =>
                s.Memberships.OrderByDescending(m => m.ExpiryDate).Select(m => m.Plan.Name).FirstOrDefault()))
            .ForCtorParam(nameof(MemberDto.MembershipStartDate), opt => opt.MapFrom(s =>
                s.Memberships.OrderByDescending(m => m.ExpiryDate).Select(m => (DateTime?)m.StartDate).FirstOrDefault()))
            .ForCtorParam(nameof(MemberDto.MembershipExpiryDate), opt => opt.MapFrom(s =>
                s.Memberships.OrderByDescending(m => m.ExpiryDate).Select(m => (DateTime?)m.ExpiryDate).FirstOrDefault()));

        CreateMap<Membership, MembershipDto>()
            .ForCtorParam(nameof(MembershipDto.MemberName), opt => opt.MapFrom(s => s.Member.FullName))
            .ForCtorParam(nameof(MembershipDto.PlanName), opt => opt.MapFrom(s => s.Plan.Name))
            .ForCtorParam(nameof(MembershipDto.RemainingBalance), opt => opt.MapFrom(s => s.TotalPrice - s.AmountPaid));

        CreateMap<Payment, PaymentDto>()
            .ForCtorParam(nameof(PaymentDto.MemberName), opt => opt.MapFrom(s => s.Member.FullName))
            .ForCtorParam(nameof(PaymentDto.PlanName), opt => opt.MapFrom(s => s.Membership != null ? s.Membership.Plan.Name : null));

        CreateMap<Attendance, AttendanceDto>()
            .ForCtorParam(nameof(AttendanceDto.MemberName), opt => opt.MapFrom(s => s.Member.FullName));

        CreateMap<Notification, NotificationDto>();

        CreateMap<GymSettings, GymSettingsDto>();
    }
}
