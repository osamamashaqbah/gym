using GymManagement.Application.Interfaces;
using GymManagement.Domain.Entities;
using GymManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.Infrastructure.Persistence;

/// <summary>
/// Seeds the absolute minimum needed for the system to work on first run:
///   - The four roles (Owner, Admin, Reception, Coach)
///   - A single owner account so the user can sign in
///   - A default GymSettings row
///   - The four standard membership plans (which the owner can edit/delete)
///
/// No demo members, payments, attendance, or extra staff users are created;
/// the gym starts with a clean dataset.
/// </summary>
public static class DataSeeder
{
    public static async Task SeedAsync(ApplicationDbContext db, IPasswordHasher hasher, CancellationToken ct = default)
    {
        // EnsureCreated creates the database from the model on first run.
        // Works for both SQLite (single-file EXE) and Postgres without migrations.
        await db.Database.EnsureCreatedAsync(ct);

        // Roles (always required for role-based authorization to work).
        if (!await db.Roles.AnyAsync(ct))
        {
            db.Roles.AddRange(
                new Role { Name = "Owner", Description = "Full access" },
                new Role { Name = "Admin", Description = "Administrative access" },
                new Role { Name = "Reception", Description = "Front desk operations" },
                new Role { Name = "Coach", Description = "Coach access" });
            await db.SaveChangesAsync(ct);
        }

        // Default gym settings row.
        if (!await db.GymSettings.AnyAsync(ct))
        {
            db.GymSettings.Add(new GymSettings
            {
                GymName = "My Gym",
                Currency = "JOD"
            });
            await db.SaveChangesAsync(ct);
        }

        // The single owner account, so the user has somewhere to sign in.
        // Everything else (admins, reception, coaches) is added later from the UI.
        if (!await db.Users.AnyAsync(ct))
        {
            var ownerRole = await db.Roles.FirstAsync(r => r.Name == "Owner", ct);

            db.Users.Add(new User
            {
                FullName = "Owner",
                Email = "owner@gym.local",
                Username = "owner",
                PasswordHash = hasher.Hash("Owner@123"),
                RoleId = ownerRole.Id,
                IsActive = true
            });
            await db.SaveChangesAsync(ct);
        }

        // Standard plans the owner can rename, re-price, deactivate, or delete.
        if (!await db.MembershipPlans.AnyAsync(ct))
        {
            db.MembershipPlans.AddRange(
                new MembershipPlan { Name = "Monthly",     Description = "1-month full access",  Duration = PlanDuration.Monthly,     DurationInMonths = 1,  Price = 30m },
                new MembershipPlan { Name = "Quarterly",   Description = "3-month full access",  Duration = PlanDuration.ThreeMonths, DurationInMonths = 3,  Price = 80m },
                new MembershipPlan { Name = "Semi-Annual", Description = "6-month full access",  Duration = PlanDuration.SixMonths,   DurationInMonths = 6,  Price = 150m },
                new MembershipPlan { Name = "Annual",      Description = "12-month full access", Duration = PlanDuration.Yearly,      DurationInMonths = 12, Price = 280m });
            await db.SaveChangesAsync(ct);
        }
    }
}
