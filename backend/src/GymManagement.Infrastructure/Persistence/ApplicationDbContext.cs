using GymManagement.Application.Interfaces;
using GymManagement.Domain.Common;
using GymManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Member> Members => Set<Member>();
    public DbSet<MembershipPlan> MembershipPlans => Set<MembershipPlan>();
    public DbSet<Membership> Memberships => Set<Membership>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<GymSettings> GymSettings => Set<GymSettings>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        // Ignore the computed property — it must not become a column.
        b.Entity<Membership>().Ignore(m => m.RemainingBalance);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        foreach (var e in ChangeTracker.Entries<BaseEntity>())
        {
            if (e.State == EntityState.Added && e.Entity.CreatedAt == default) e.Entity.CreatedAt = now;
            if (e.State == EntityState.Modified) e.Entity.UpdatedAt = now;
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
