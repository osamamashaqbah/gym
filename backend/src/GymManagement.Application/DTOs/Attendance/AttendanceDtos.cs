namespace GymManagement.Application.DTOs.Attendance;

public record AttendanceDto(
    Guid Id,
    Guid MemberId,
    string MemberName,
    DateTime CheckInTime,
    string? Notes);

public record CheckInRequest(Guid MemberId, string? Notes);
