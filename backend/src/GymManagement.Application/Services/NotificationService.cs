using AutoMapper;
using GymManagement.Application.DTOs.Notifications;
using GymManagement.Application.Interfaces;
using GymManagement.Domain.Entities;
using GymManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.Application.Services;

public class NotificationService : INotificationService
{
    private readonly IApplicationDbContext _db;
    private readonly IMapper _mapper;

    public NotificationService(IApplicationDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<NotificationDto>> GetAllAsync(bool unreadOnly, CancellationToken ct)
    {
        var q = _db.Notifications.AsQueryable();
        if (unreadOnly) q = q.Where(n => !n.IsRead);
        var rows = await q.OrderByDescending(n => n.CreatedAt)
            .Take(100)
            .ToListAsync(ct);
        return rows.Select(n => _mapper.Map<NotificationDto>(n)).ToList();
    }

    public async Task MarkAsReadAsync(Guid id, CancellationToken ct)
    {
        var n = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (n is null) return;
        n.IsRead = true;
        n.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task MarkAllAsReadAsync(CancellationToken ct)
    {
        var unread = await _db.Notifications.Where(n => !n.IsRead).ToListAsync(ct);
        foreach (var n in unread) { n.IsRead = true; n.UpdatedAt = DateTime.UtcNow; }
        await _db.SaveChangesAsync(ct);
    }

    public async Task<int> GenerateExpiryAlertsAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var soon = now.AddDays(7);

        var expiring = await _db.Memberships
            .Include(m => m.Member)
            .Where(m => m.Status == MembershipStatus.Active &&
                        m.ExpiryDate >= now && m.ExpiryDate <= soon)
            .ToListAsync(ct);

        var created = 0;
        foreach (var m in expiring)
        {
            var exists = await _db.Notifications.AnyAsync(n =>
                n.MemberId == m.MemberId && n.Type == NotificationType.MembershipExpiry &&
                n.CreatedAt >= now.AddDays(-1), ct);
            if (exists) continue;

            _db.Notifications.Add(new Notification
            {
                Title = "Membership expiring soon",
                Message = $"{m.Member.FullName}'s membership expires on {m.ExpiryDate:yyyy-MM-dd}.",
                Type = NotificationType.MembershipExpiry,
                MemberId = m.MemberId
            });
            created++;
        }
        await _db.SaveChangesAsync(ct);
        return created;
    }
}
