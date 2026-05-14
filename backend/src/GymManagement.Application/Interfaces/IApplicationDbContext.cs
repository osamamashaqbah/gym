using GymManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<Member> Members { get; }
    DbSet<MembershipPlan> MembershipPlans { get; }
    DbSet<Membership> Memberships { get; }
    DbSet<Payment> Payments { get; }
    DbSet<Attendance> Attendances { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<GymSettings> GymSettings { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
