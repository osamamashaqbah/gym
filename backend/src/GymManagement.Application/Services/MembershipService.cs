using AutoMapper;
using AutoMapper.QueryableExtensions;
using GymManagement.Application.Common;
using GymManagement.Application.DTOs.Memberships;
using GymManagement.Application.Interfaces;
using GymManagement.Domain.Entities;
using GymManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.Application.Services;

public class MembershipService : IMembershipService
{
    private readonly IApplicationDbContext _db;
    private readonly IMapper _mapper;

    public MembershipService(IApplicationDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<MembershipPlanDto>> GetPlansAsync(CancellationToken ct)
    {
        return await _db.MembershipPlans
            .OrderBy(p => p.DurationInMonths)
            .ProjectTo<MembershipPlanDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);
    }

    public async Task<Result<MembershipPlanDto>> CreatePlanAsync(CreatePlanRequest req, CancellationToken ct)
    {
        var plan = new MembershipPlan
        {
            Name = req.Name,
            Description = req.Description,
            Duration = req.Duration,
            DurationInMonths = (int)req.Duration,
            Price = req.Price,
            IsActive = true
        };
        _db.MembershipPlans.Add(plan);
        await _db.SaveChangesAsync(ct);
        return Result<MembershipPlanDto>.Ok(_mapper.Map<MembershipPlanDto>(plan));
    }

    public async Task<Result<MembershipPlanDto>> UpdatePlanAsync(Guid id, UpdatePlanRequest req, CancellationToken ct)
    {
        var plan = await _db.MembershipPlans.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (plan is null) return Result<MembershipPlanDto>.Fail("Plan not found", 404);
        plan.Name = req.Name;
        plan.Description = req.Description;
        plan.Price = req.Price;
        plan.IsActive = req.IsActive;
        plan.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Result<MembershipPlanDto>.Ok(_mapper.Map<MembershipPlanDto>(plan));
    }

    public async Task<Result<bool>> DeletePlanAsync(Guid id, CancellationToken ct)
    {
        var plan = await _db.MembershipPlans.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (plan is null) return Result<bool>.Fail("Plan not found", 404);
        var inUse = await _db.Memberships.AnyAsync(m => m.PlanId == id, ct);
        if (inUse)
        {
            plan.IsActive = false;
            plan.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.MembershipPlans.Remove(plan);
        }
        await _db.SaveChangesAsync(ct);
        return Result<bool>.Ok(true);
    }

    public async Task<IReadOnlyList<MembershipDto>> GetByMemberAsync(Guid memberId, CancellationToken ct)
    {
        return await _db.Memberships
            .Where(m => m.MemberId == memberId)
            .OrderByDescending(m => m.StartDate)
            .ProjectTo<MembershipDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);
    }

    public async Task<Result<MembershipDto>> CreateAsync(CreateMembershipRequest req, CancellationToken ct)
    {
        var member = await _db.Members.FirstOrDefaultAsync(m => m.Id == req.MemberId, ct);
        if (member is null) return Result<MembershipDto>.Fail("Member not found", 404);

        var plan = await _db.MembershipPlans.FirstOrDefaultAsync(p => p.Id == req.PlanId, ct);
        if (plan is null) return Result<MembershipDto>.Fail("Plan not found", 404);

        var price = req.CustomPrice ?? plan.Price;
        var membership = new Membership
        {
            MemberId = req.MemberId,
            PlanId = req.PlanId,
            StartDate = req.StartDate,
            ExpiryDate = req.StartDate.AddMonths(plan.DurationInMonths),
            TotalPrice = price,
            AmountPaid = 0,
            Status = MembershipStatus.Active,
            Notes = req.Notes
        };

        _db.Memberships.Add(membership);

        if (req.InitialPayment > 0)
        {
            var payment = new Payment
            {
                MemberId = req.MemberId,
                MembershipId = membership.Id,
                Amount = req.InitialPayment,
                Method = req.PaymentMethod,
                PaidAt = DateTime.UtcNow,
                InvoiceNumber = GenerateInvoiceNumber()
            };
            membership.AmountPaid = req.InitialPayment;
            _db.Payments.Add(payment);
        }

        await _db.SaveChangesAsync(ct);

        var dto = await _db.Memberships
            .Where(m => m.Id == membership.Id)
            .ProjectTo<MembershipDto>(_mapper.ConfigurationProvider)
            .FirstAsync(ct);
        return Result<MembershipDto>.Ok(dto);
    }

    public Task<Result<MembershipDto>> RenewAsync(Guid memberId, RenewMembershipRequest req, CancellationToken ct)
    {
        return CreateAsync(new CreateMembershipRequest(
            memberId, req.PlanId, req.StartDate, req.CustomPrice,
            req.InitialPayment, req.PaymentMethod, req.Notes), ct);
    }

    public async Task<Result<MembershipDto>> FreezeAsync(Guid membershipId, FreezeMembershipRequest req, CancellationToken ct)
    {
        var m = await _db.Memberships.FirstOrDefaultAsync(x => x.Id == membershipId, ct);
        if (m is null) return Result<MembershipDto>.Fail("Membership not found", 404);
        if (m.Status != MembershipStatus.Active)
            return Result<MembershipDto>.Fail("Only active memberships can be frozen", 400);

        m.Status = MembershipStatus.Frozen;
        m.FrozenAt = DateTime.UtcNow;
        m.FreezeDays = req.FreezeDays;
        m.ExpiryDate = m.ExpiryDate.AddDays(req.FreezeDays);
        m.Notes = req.Notes ?? m.Notes;
        m.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return await GetSingle(membershipId, ct);
    }

    public async Task<Result<MembershipDto>> UnfreezeAsync(Guid membershipId, CancellationToken ct)
    {
        var m = await _db.Memberships.FirstOrDefaultAsync(x => x.Id == membershipId, ct);
        if (m is null) return Result<MembershipDto>.Fail("Membership not found", 404);
        m.Status = m.ExpiryDate < DateTime.UtcNow ? MembershipStatus.Expired : MembershipStatus.Active;
        m.FrozenAt = null;
        m.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return await GetSingle(membershipId, ct);
    }

    public async Task<Result<MembershipDto>> CancelAsync(Guid membershipId, CancellationToken ct)
    {
        var m = await _db.Memberships.FirstOrDefaultAsync(x => x.Id == membershipId, ct);
        if (m is null) return Result<MembershipDto>.Fail("Membership not found", 404);
        m.Status = MembershipStatus.Cancelled;
        m.CancelledAt = DateTime.UtcNow;
        m.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return await GetSingle(membershipId, ct);
    }

    public async Task<int> RefreshExpiredMembershipsAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var expired = await _db.Memberships
            .Where(m => m.Status == MembershipStatus.Active && m.ExpiryDate < now)
            .ToListAsync(ct);
        foreach (var m in expired)
        {
            m.Status = MembershipStatus.Expired;
            m.UpdatedAt = now;
        }
        await _db.SaveChangesAsync(ct);
        return expired.Count;
    }

    private async Task<Result<MembershipDto>> GetSingle(Guid membershipId, CancellationToken ct)
    {
        var dto = await _db.Memberships
            .Where(x => x.Id == membershipId)
            .ProjectTo<MembershipDto>(_mapper.ConfigurationProvider)
            .FirstAsync(ct);
        return Result<MembershipDto>.Ok(dto);
    }

    private static string GenerateInvoiceNumber()
        => $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
}
