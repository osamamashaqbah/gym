using AutoMapper;
using GymManagement.Application.Common;
using GymManagement.Application.DTOs.Members;
using GymManagement.Application.Interfaces;
using GymManagement.Domain.Entities;
using GymManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.Application.Services;

public class MemberService : IMemberService
{
    private readonly IApplicationDbContext _db;
    private readonly IMapper _mapper;

    public MemberService(IApplicationDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<PagedResult<MemberDto>> GetAllAsync(PaginationQuery q, string? status, CancellationToken ct)
    {
        var query = _db.Members
            .Where(m => !m.IsArchived)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim().ToLower();
            query = query.Where(m =>
                m.FullName.ToLower().Contains(s) ||
                m.PhoneNumber.Contains(s) ||
                (m.Email != null && m.Email.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<MembershipStatus>(status, true, out var st))
        {
            // Members whose latest membership matches the requested status.
            // Implemented as an Any() with a subquery to keep both Postgres and SQLite happy.
            query = query.Where(m => m.Memberships
                .OrderByDescending(x => x.ExpiryDate)
                .Take(1)
                .Any(x => x.Status == st));
        }

        var total = await query.CountAsync(ct);

        var members = await query
            .Include(m => m.Memberships).ThenInclude(x => x.Plan)
            .OrderByDescending(m => m.JoinedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .ToListAsync(ct);

        var items = members.Select(m => _mapper.Map<MemberDto>(m)).ToList();

        return new PagedResult<MemberDto>
        {
            Items = items,
            TotalCount = total,
            Page = q.Page,
            PageSize = q.PageSize
        };
    }

    public async Task<MemberDto?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var member = await _db.Members
            .Include(m => m.Memberships).ThenInclude(x => x.Plan)
            .FirstOrDefaultAsync(m => m.Id == id, ct);
        return member is null ? null : _mapper.Map<MemberDto>(member);
    }

    public async Task<Result<MemberDto>> CreateAsync(CreateMemberRequest req, CancellationToken ct)
    {
        var member = new Member
        {
            FullName = req.FullName,
            PhoneNumber = req.PhoneNumber,
            Gender = req.Gender,
            Age = req.Age,
            Address = req.Address,
            Email = req.Email,
            ProfileImageUrl = req.ProfileImageUrl,
            Notes = req.Notes
        };
        _db.Members.Add(member);
        await _db.SaveChangesAsync(ct);

        var dto = await GetByIdAsync(member.Id, ct);
        return Result<MemberDto>.Ok(dto!);
    }

    public async Task<Result<MemberDto>> UpdateAsync(Guid id, UpdateMemberRequest req, CancellationToken ct)
    {
        var member = await _db.Members.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (member is null) return Result<MemberDto>.Fail("Member not found", 404);

        member.FullName = req.FullName;
        member.PhoneNumber = req.PhoneNumber;
        member.Gender = req.Gender;
        member.Age = req.Age;
        member.Address = req.Address;
        member.Email = req.Email;
        member.ProfileImageUrl = req.ProfileImageUrl;
        member.Notes = req.Notes;
        member.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var dto = await GetByIdAsync(id, ct);
        return Result<MemberDto>.Ok(dto!);
    }

    public async Task<Result<bool>> ArchiveAsync(Guid id, CancellationToken ct)
    {
        var member = await _db.Members.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (member is null) return Result<bool>.Fail("Member not found", 404);
        member.IsArchived = true;
        member.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Result<bool>.Ok(true);
    }

    public async Task<Result<bool>> DeleteAsync(Guid id, CancellationToken ct)
    {
        var member = await _db.Members
            .Include(m => m.Memberships)
            .Include(m => m.Payments)
            .Include(m => m.Attendances)
            .FirstOrDefaultAsync(m => m.Id == id, ct);
        if (member is null) return Result<bool>.Fail("Member not found", 404);
        _db.Members.Remove(member);
        await _db.SaveChangesAsync(ct);
        return Result<bool>.Ok(true);
    }
}
