using GymManagement.Application.Interfaces;
using GymManagement.Domain.Entities;
using GymManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.Infrastructure.Persistence;

/// <summary>
/// Seeds initial data: roles, default admin, plans, sample members, memberships, payments, attendance.
/// </summary>
public static class DataSeeder
{
    public static async Task SeedAsync(ApplicationDbContext db, IPasswordHasher hasher, CancellationToken ct = default)
    {
        // EnsureCreated creates the database from the model on first run.
        // Works for both SQLite (single-file EXE) and Postgres without migrations.
        await db.Database.EnsureCreatedAsync(ct);

        // Roles
        if (!await db.Roles.AnyAsync(ct))
        {
            db.Roles.AddRange(
                new Role { Name = "Owner", Description = "Full access" },
                new Role { Name = "Admin", Description = "Administrative access" },
                new Role { Name = "Reception", Description = "Front desk operations" },
                new Role { Name = "Coach", Description = "Coach access" });
            await db.SaveChangesAsync(ct);
        }

        // Settings
        if (!await db.GymSettings.AnyAsync(ct))
        {
            db.GymSettings.Add(new GymSettings
            {
                GymName = "Iron Forge Premium Gym",
                Address = "123 Performance Blvd, Amman, Jordan",
                PhoneNumber = "+962 6 123 4567",
                Email = "info@ironforge.gym",
                Currency = "JOD",
                Website = "https://ironforge.gym"
            });
            await db.SaveChangesAsync(ct);
        }

        // Initial admin
        if (!await db.Users.AnyAsync(ct))
        {
            var ownerRole = await db.Roles.FirstAsync(r => r.Name == "Owner", ct);
            var adminRole = await db.Roles.FirstAsync(r => r.Name == "Admin", ct);
            var reception = await db.Roles.FirstAsync(r => r.Name == "Reception", ct);
            var coach = await db.Roles.FirstAsync(r => r.Name == "Coach", ct);

            db.Users.AddRange(
                new User
                {
                    FullName = "System Owner",
                    Email = "owner@ironforge.gym",
                    Username = "owner",
                    PasswordHash = hasher.Hash("Owner@123"),
                    RoleId = ownerRole.Id,
                    PhoneNumber = "+962 79 000 0001",
                    IsActive = true
                },
                new User
                {
                    FullName = "Admin User",
                    Email = "admin@ironforge.gym",
                    Username = "admin",
                    PasswordHash = hasher.Hash("Admin@123"),
                    RoleId = adminRole.Id,
                    PhoneNumber = "+962 79 000 0002",
                    IsActive = true
                },
                new User
                {
                    FullName = "Reception Staff",
                    Email = "reception@ironforge.gym",
                    Username = "reception",
                    PasswordHash = hasher.Hash("Reception@123"),
                    RoleId = reception.Id,
                    PhoneNumber = "+962 79 000 0003",
                    IsActive = true
                },
                new User
                {
                    FullName = "Head Coach",
                    Email = "coach@ironforge.gym",
                    Username = "coach",
                    PasswordHash = hasher.Hash("Coach@123"),
                    RoleId = coach.Id,
                    PhoneNumber = "+962 79 000 0004",
                    IsActive = true
                });
            await db.SaveChangesAsync(ct);
        }

        // Plans
        if (!await db.MembershipPlans.AnyAsync(ct))
        {
            db.MembershipPlans.AddRange(
                new MembershipPlan { Name = "Monthly", Description = "1-month full access", Duration = PlanDuration.Monthly, DurationInMonths = 1, Price = 30m },
                new MembershipPlan { Name = "Quarterly", Description = "3-month full access", Duration = PlanDuration.ThreeMonths, DurationInMonths = 3, Price = 80m },
                new MembershipPlan { Name = "Semi-Annual", Description = "6-month full access", Duration = PlanDuration.SixMonths, DurationInMonths = 6, Price = 150m },
                new MembershipPlan { Name = "Annual", Description = "12-month full access", Duration = PlanDuration.Yearly, DurationInMonths = 12, Price = 280m });
            await db.SaveChangesAsync(ct);
        }

        // Demo members & memberships
        if (!await db.Members.AnyAsync(ct))
        {
            var plans = await db.MembershipPlans.OrderBy(p => p.DurationInMonths).ToListAsync(ct);
            var rng = new Random(42);
            var firstNames = new[] { "Omar", "Lina", "Ahmad", "Sara", "Khalid", "Mona", "Yousef", "Layla", "Bashar", "Reem", "Tariq", "Hala" };
            var lastNames = new[] { "Al-Hassan", "Khoury", "Saleh", "Nasser", "Hadid", "Mansour", "Odeh", "Daoud", "Karam", "Sabbagh" };

            var members = new List<Member>();
            for (int i = 0; i < 24; i++)
            {
                var fn = firstNames[rng.Next(firstNames.Length)];
                var ln = lastNames[rng.Next(lastNames.Length)];
                members.Add(new Member
                {
                    FullName = $"{fn} {ln}",
                    PhoneNumber = $"+962 79 {rng.Next(100, 999)} {rng.Next(1000, 9999)}",
                    Gender = rng.Next(2) == 0 ? Gender.Male : Gender.Female,
                    Age = rng.Next(18, 55),
                    Address = "Amman, Jordan",
                    Email = $"{fn.ToLower()}.{ln.ToLower().Replace("-", "").Replace(" ", "")}{i}@example.com",
                    JoinedAt = DateTime.UtcNow.AddDays(-rng.Next(5, 200))
                });
            }
            db.Members.AddRange(members);
            await db.SaveChangesAsync(ct);

            foreach (var m in members)
            {
                var plan = plans[rng.Next(plans.Count)];
                var start = DateTime.UtcNow.AddDays(-rng.Next(0, 180));
                var expiry = start.AddMonths(plan.DurationInMonths);

                MembershipStatus status;
                if (expiry < DateTime.UtcNow) status = MembershipStatus.Expired;
                else if (rng.Next(10) == 0) status = MembershipStatus.Frozen;
                else status = MembershipStatus.Active;

                var paid = rng.Next(2) == 0 ? plan.Price : plan.Price * (decimal)(0.5 + rng.NextDouble() * 0.5);
                var membership = new Membership
                {
                    MemberId = m.Id,
                    PlanId = plan.Id,
                    StartDate = start,
                    ExpiryDate = expiry,
                    TotalPrice = plan.Price,
                    AmountPaid = paid,
                    Status = status
                };
                db.Memberships.Add(membership);

                db.Payments.Add(new Payment
                {
                    MemberId = m.Id,
                    MembershipId = membership.Id,
                    Amount = paid,
                    Method = (PaymentMethod)rng.Next(1, 4),
                    PaidAt = start,
                    InvoiceNumber = $"INV-{start:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}"
                });

                // Attendance
                var attCount = rng.Next(3, 18);
                for (int i = 0; i < attCount; i++)
                {
                    db.Attendances.Add(new Attendance
                    {
                        MemberId = m.Id,
                        CheckInTime = DateTime.UtcNow.AddDays(-rng.Next(0, 30)).AddHours(-rng.Next(0, 8))
                    });
                }
            }
            await db.SaveChangesAsync(ct);
        }
    }
}
