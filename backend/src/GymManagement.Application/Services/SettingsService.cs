using AutoMapper;
using GymManagement.Application.Common;
using GymManagement.Application.DTOs.Settings;
using GymManagement.Application.Interfaces;
using GymManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.Application.Services;

public class SettingsService : ISettingsService
{
    private readonly IApplicationDbContext _db;
    private readonly IMapper _mapper;
    private readonly IPasswordHasher _hasher;

    public SettingsService(IApplicationDbContext db, IMapper mapper, IPasswordHasher hasher)
    {
        _db = db;
        _mapper = mapper;
        _hasher = hasher;
    }

    public async Task<GymSettingsDto> GetAsync(CancellationToken ct)
    {
        var s = await _db.GymSettings.FirstOrDefaultAsync(ct);
        if (s is null)
        {
            s = new GymSettings();
            _db.GymSettings.Add(s);
            await _db.SaveChangesAsync(ct);
        }
        return _mapper.Map<GymSettingsDto>(s);
    }

    public async Task<GymSettingsDto> UpdateAsync(UpdateGymSettingsRequest req, CancellationToken ct)
    {
        var s = await _db.GymSettings.FirstOrDefaultAsync(ct);
        if (s is null)
        {
            s = new GymSettings();
            _db.GymSettings.Add(s);
        }
        s.GymName = req.GymName;
        s.Address = req.Address;
        s.PhoneNumber = req.PhoneNumber;
        s.Email = req.Email;
        s.LogoUrl = req.LogoUrl;
        s.Currency = req.Currency;
        s.TaxNumber = req.TaxNumber;
        s.Website = req.Website;
        s.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return _mapper.Map<GymSettingsDto>(s);
    }

    public async Task<IReadOnlyList<StaffUserDto>> GetStaffAsync(CancellationToken ct)
    {
        var users = await _db.Users
            .Include(u => u.Role)
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync(ct);
        return users.Select(u => _mapper.Map<StaffUserDto>(u)).ToList();
    }

    public async Task<Result<StaffUserDto>> CreateStaffAsync(CreateStaffRequest req, CancellationToken ct)
    {
        if (await _db.Users.AnyAsync(u => u.Username == req.Username || u.Email == req.Email, ct))
            return Result<StaffUserDto>.Fail("Username or email already exists", 400);

        var role = await _db.Roles.FirstOrDefaultAsync(r => r.Name == req.Role, ct);
        if (role is null) return Result<StaffUserDto>.Fail("Role not found", 400);

        var user = new User
        {
            FullName = req.FullName,
            Email = req.Email,
            Username = req.Username,
            PhoneNumber = req.PhoneNumber,
            PasswordHash = _hasher.Hash(req.Password),
            RoleId = role.Id,
            IsActive = true
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        user.Role = role;
        return Result<StaffUserDto>.Ok(_mapper.Map<StaffUserDto>(user));
    }

    public async Task<Result<StaffUserDto>> UpdateStaffAsync(Guid id, UpdateStaffRequest req, CancellationToken ct)
    {
        var user = await _db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return Result<StaffUserDto>.Fail("User not found", 404);

        var role = await _db.Roles.FirstOrDefaultAsync(r => r.Name == req.Role, ct);
        if (role is null) return Result<StaffUserDto>.Fail("Role not found", 400);

        user.FullName = req.FullName;
        user.Email = req.Email;
        user.PhoneNumber = req.PhoneNumber;
        user.RoleId = role.Id;
        user.IsActive = req.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        user.Role = role;
        return Result<StaffUserDto>.Ok(_mapper.Map<StaffUserDto>(user));
    }

    public async Task<Result<bool>> DeleteStaffAsync(Guid id, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return Result<bool>.Fail("User not found", 404);
        _db.Users.Remove(user);
        await _db.SaveChangesAsync(ct);
        return Result<bool>.Ok(true);
    }
}
