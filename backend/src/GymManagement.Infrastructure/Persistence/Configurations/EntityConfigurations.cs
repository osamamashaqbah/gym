using GymManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymManagement.Infrastructure.Persistence.Configurations;

public class UserConfig : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> b)
    {
        b.ToTable("users");
        b.HasKey(x => x.Id);
        b.Property(x => x.FullName).HasMaxLength(150).IsRequired();
        b.Property(x => x.Email).HasMaxLength(200).IsRequired();
        b.Property(x => x.Username).HasMaxLength(50).IsRequired();
        b.Property(x => x.PasswordHash).IsRequired();
        b.HasIndex(x => x.Username).IsUnique();
        b.HasIndex(x => x.Email).IsUnique();
        b.HasOne(x => x.Role).WithMany(r => r.Users).HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class RoleConfig : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> b)
    {
        b.ToTable("roles");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(50).IsRequired();
        b.HasIndex(x => x.Name).IsUnique();
    }
}

public class MemberConfig : IEntityTypeConfiguration<Member>
{
    public void Configure(EntityTypeBuilder<Member> b)
    {
        b.ToTable("members");
        b.HasKey(x => x.Id);
        b.Property(x => x.FullName).HasMaxLength(150).IsRequired();
        b.Property(x => x.PhoneNumber).HasMaxLength(30).IsRequired();
        b.HasIndex(x => x.PhoneNumber);
        b.HasIndex(x => x.FullName);
        b.HasIndex(x => x.IsArchived);
    }
}

public class PlanConfig : IEntityTypeConfiguration<MembershipPlan>
{
    public void Configure(EntityTypeBuilder<MembershipPlan> b)
    {
        b.ToTable("membership_plans");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.Property(x => x.Price).HasColumnType("numeric(12,2)");
    }
}

public class MembershipConfig : IEntityTypeConfiguration<Membership>
{
    public void Configure(EntityTypeBuilder<Membership> b)
    {
        b.ToTable("memberships");
        b.HasKey(x => x.Id);
        b.Property(x => x.TotalPrice).HasColumnType("numeric(12,2)");
        b.Property(x => x.AmountPaid).HasColumnType("numeric(12,2)");
        b.HasOne(x => x.Member).WithMany(m => m.Memberships).HasForeignKey(x => x.MemberId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.Plan).WithMany(p => p.Memberships).HasForeignKey(x => x.PlanId).OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => x.ExpiryDate);
        b.HasIndex(x => x.Status);
    }
}

public class PaymentConfig : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> b)
    {
        b.ToTable("payments");
        b.HasKey(x => x.Id);
        b.Property(x => x.Amount).HasColumnType("numeric(12,2)");
        b.Property(x => x.InvoiceNumber).HasMaxLength(50).IsRequired();
        b.HasIndex(x => x.InvoiceNumber).IsUnique();
        b.HasIndex(x => x.PaidAt);
        b.HasOne(x => x.Member).WithMany(m => m.Payments).HasForeignKey(x => x.MemberId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.Membership).WithMany(m => m!.Payments).HasForeignKey(x => x.MembershipId).OnDelete(DeleteBehavior.SetNull);
    }
}

public class AttendanceConfig : IEntityTypeConfiguration<Attendance>
{
    public void Configure(EntityTypeBuilder<Attendance> b)
    {
        b.ToTable("attendances");
        b.HasKey(x => x.Id);
        b.HasOne(x => x.Member).WithMany(m => m.Attendances).HasForeignKey(x => x.MemberId).OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(x => x.CheckInTime);
    }
}

public class NotificationConfig : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> b)
    {
        b.ToTable("notifications");
        b.HasKey(x => x.Id);
        b.Property(x => x.Title).HasMaxLength(200).IsRequired();
        b.Property(x => x.Message).HasMaxLength(1000).IsRequired();
        b.HasOne(x => x.Member).WithMany().HasForeignKey(x => x.MemberId).OnDelete(DeleteBehavior.SetNull);
        b.HasIndex(x => x.IsRead);
        b.HasIndex(x => x.CreatedAt);
    }
}

public class GymSettingsConfig : IEntityTypeConfiguration<GymSettings>
{
    public void Configure(EntityTypeBuilder<GymSettings> b)
    {
        b.ToTable("gym_settings");
        b.HasKey(x => x.Id);
        b.Property(x => x.GymName).HasMaxLength(150).IsRequired();
        b.Property(x => x.Currency).HasMaxLength(10).IsRequired();
    }
}
