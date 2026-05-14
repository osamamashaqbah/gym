using AutoMapper;
using AutoMapper.QueryableExtensions;
using GymManagement.Application.Common;
using GymManagement.Application.DTOs.Attendance;
using GymManagement.Application.Interfaces;
using GymManagement.Domain.Entities;
using GymManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.Application.Services;

public class AttendanceService : IAttendanceService
{
    private readonly IApplicationDbContext _db;
    private readonly IMapper _mapper;

    public AttendanceService(IApplicationDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<Result<AttendanceDto>> CheckInAsync(CheckInRequest req, CancellationToken ct)
    {
        var member = await _db.Members
            .Include(m => m.Memberships)
            .FirstOrDefaultAsync(m => m.Id == req.MemberId, ct);
        if (member is null) return Result<AttendanceDto>.Fail("Member not found", 404);

        var hasActive = member.Memberships.Any(m =>
            m.Status == MembershipStatus.Active && m.ExpiryDate >= DateTime.UtcNow);
        if (!hasActive)
            return Result<AttendanceDto>.Fail("Member has no active membership. Cannot check in.", 400);

        var att = new Attendance { MemberId = req.MemberId, Notes = req.Notes };
        _db.Attendances.Add(att);
        await _db.SaveChangesAsync(ct);

        var dto = await _db.Attendances
            .Where(a => a.Id == att.Id)
            .ProjectTo<AttendanceDto>(_mapper.ConfigurationProvider)
            .FirstAsync(ct);
        return Result<AttendanceDto>.Ok(dto);
    }

    public async Task<PagedResult<AttendanceDto>> GetAllAsync(PaginationQuery q, DateTime? date, Guid? memberId, CancellationToken ct)
    {
        var query = _db.Attendances.AsQueryable();
        if (date.HasValue)
        {
            var d = date.Value.Date;
            query = query.Where(a => a.CheckInTime >= d && a.CheckInTime < d.AddDays(1));
        }
        if (memberId.HasValue) query = query.Where(a => a.MemberId == memberId.Value);

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim().ToLower();
            query = query.Where(a => a.Member.FullName.ToLower().Contains(s));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(a => a.CheckInTime)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .ProjectTo<AttendanceDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return new PagedResult<AttendanceDto>
        {
            Items = items, TotalCount = total, Page = q.Page, PageSize = q.PageSize
        };
    }

    public async Task<IReadOnlyList<AttendanceDto>> GetByMemberAsync(Guid memberId, CancellationToken ct)
    {
        return await _db.Attendances
            .Where(a => a.MemberId == memberId)
            .OrderByDescending(a => a.CheckInTime)
            .Take(100)
            .ProjectTo<AttendanceDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);
    }
}
