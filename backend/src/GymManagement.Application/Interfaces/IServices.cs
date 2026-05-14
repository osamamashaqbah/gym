using GymManagement.Application.Common;
using GymManagement.Application.DTOs.Attendance;
using GymManagement.Application.DTOs.Auth;
using GymManagement.Application.DTOs.Dashboard;
using GymManagement.Application.DTOs.Members;
using GymManagement.Application.DTOs.Memberships;
using GymManagement.Application.DTOs.Notifications;
using GymManagement.Application.DTOs.Payments;
using GymManagement.Application.DTOs.Settings;
using GymManagement.Domain.Entities;

namespace GymManagement.Application.Interfaces;

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}

public interface IJwtTokenGenerator
{
    (string token, DateTime expiresAt) Generate(User user);
}

public interface ICurrentUser
{
    Guid? UserId { get; }
    string? Username { get; }
    string? Role { get; }
    bool IsAuthenticated { get; }
}

public interface IAuthService
{
    Task<Result<AuthResponse>> LoginAsync(LoginRequest req, CancellationToken ct);
    Task<Result<bool>> ChangePasswordAsync(Guid userId, ChangePasswordRequest req, CancellationToken ct);
    Task<Result<string>> ForgotPasswordAsync(ForgotPasswordRequest req, CancellationToken ct);
}

public interface IMemberService
{
    Task<PagedResult<MemberDto>> GetAllAsync(PaginationQuery query, string? status, CancellationToken ct);
    Task<MemberDto?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<Result<MemberDto>> CreateAsync(CreateMemberRequest req, CancellationToken ct);
    Task<Result<MemberDto>> UpdateAsync(Guid id, UpdateMemberRequest req, CancellationToken ct);
    Task<Result<bool>> ArchiveAsync(Guid id, CancellationToken ct);
    Task<Result<bool>> DeleteAsync(Guid id, CancellationToken ct);
}

public interface IMembershipService
{
    Task<IReadOnlyList<MembershipPlanDto>> GetPlansAsync(CancellationToken ct);
    Task<Result<MembershipPlanDto>> CreatePlanAsync(CreatePlanRequest req, CancellationToken ct);
    Task<Result<MembershipPlanDto>> UpdatePlanAsync(Guid id, UpdatePlanRequest req, CancellationToken ct);
    Task<Result<bool>> DeletePlanAsync(Guid id, CancellationToken ct);

    Task<IReadOnlyList<MembershipDto>> GetByMemberAsync(Guid memberId, CancellationToken ct);
    Task<Result<MembershipDto>> CreateAsync(CreateMembershipRequest req, CancellationToken ct);
    Task<Result<MembershipDto>> RenewAsync(Guid memberId, RenewMembershipRequest req, CancellationToken ct);
    Task<Result<MembershipDto>> FreezeAsync(Guid membershipId, FreezeMembershipRequest req, CancellationToken ct);
    Task<Result<MembershipDto>> UnfreezeAsync(Guid membershipId, CancellationToken ct);
    Task<Result<MembershipDto>> CancelAsync(Guid membershipId, CancellationToken ct);
    Task<int> RefreshExpiredMembershipsAsync(CancellationToken ct);
}

public interface IPaymentService
{
    Task<PagedResult<PaymentDto>> GetAllAsync(PaginationQuery query, DateTime? from, DateTime? to, CancellationToken ct);
    Task<IReadOnlyList<PaymentDto>> GetByMemberAsync(Guid memberId, CancellationToken ct);
    Task<Result<PaymentDto>> CreateAsync(CreatePaymentRequest req, CancellationToken ct);
    Task<InvoiceDto?> GetInvoiceAsync(Guid paymentId, CancellationToken ct);
    Task<byte[]?> GetInvoicePdfAsync(Guid paymentId, CancellationToken ct);
}

public interface IAttendanceService
{
    Task<Result<AttendanceDto>> CheckInAsync(CheckInRequest req, CancellationToken ct);
    Task<PagedResult<AttendanceDto>> GetAllAsync(PaginationQuery query, DateTime? date, Guid? memberId, CancellationToken ct);
    Task<IReadOnlyList<AttendanceDto>> GetByMemberAsync(Guid memberId, CancellationToken ct);
}

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(CancellationToken ct);
    Task<DashboardChartsDto> GetChartsAsync(CancellationToken ct);
    Task<IReadOnlyList<PaymentDto>> GetRecentPaymentsAsync(int take, CancellationToken ct);
    Task<IReadOnlyList<MemberDto>> GetRecentMembersAsync(int take, CancellationToken ct);
}

public interface INotificationService
{
    Task<IReadOnlyList<NotificationDto>> GetAllAsync(bool unreadOnly, CancellationToken ct);
    Task MarkAsReadAsync(Guid id, CancellationToken ct);
    Task MarkAllAsReadAsync(CancellationToken ct);
    Task<int> GenerateExpiryAlertsAsync(CancellationToken ct);
}

public interface ISettingsService
{
    Task<GymSettingsDto> GetAsync(CancellationToken ct);
    Task<GymSettingsDto> UpdateAsync(UpdateGymSettingsRequest req, CancellationToken ct);

    Task<IReadOnlyList<StaffUserDto>> GetStaffAsync(CancellationToken ct);
    Task<Result<StaffUserDto>> CreateStaffAsync(CreateStaffRequest req, CancellationToken ct);
    Task<Result<StaffUserDto>> UpdateStaffAsync(Guid id, UpdateStaffRequest req, CancellationToken ct);
    Task<Result<bool>> DeleteStaffAsync(Guid id, CancellationToken ct);
}

public interface IReportService
{
    Task<byte[]> ExportMembersExcelAsync(CancellationToken ct);
    Task<byte[]> ExportPaymentsExcelAsync(DateTime? from, DateTime? to, CancellationToken ct);
    Task<byte[]> ExportAttendanceExcelAsync(DateTime? from, DateTime? to, CancellationToken ct);
}
