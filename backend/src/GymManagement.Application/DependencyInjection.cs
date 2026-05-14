using FluentValidation;
using GymManagement.Application.Interfaces;
using GymManagement.Application.Mapping;
using GymManagement.Application.Services;
using GymManagement.Application.Validators;
using Microsoft.Extensions.DependencyInjection;

namespace GymManagement.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddAutoMapper(typeof(MappingProfile).Assembly);
        services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IMemberService, MemberService>();
        services.AddScoped<IMembershipService, MembershipService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IAttendanceService, AttendanceService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<ISettingsService, SettingsService>();
        services.AddScoped<IReportService, ReportService>();

        return services;
    }
}
