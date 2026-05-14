using GymManagement.Domain.Enums;

namespace GymManagement.Application.DTOs.Notifications;

public record NotificationDto(
    Guid Id,
    string Title,
    string Message,
    NotificationType Type,
    bool IsRead,
    DateTime CreatedAt,
    Guid? MemberId);
