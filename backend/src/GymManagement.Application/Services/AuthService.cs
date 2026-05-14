using AutoMapper;
using GymManagement.Application.Common;
using GymManagement.Application.DTOs.Auth;
using GymManagement.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.Application.Services;

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenGenerator _jwt;
    private readonly IMapper _mapper;

    public AuthService(IApplicationDbContext db, IPasswordHasher hasher, IJwtTokenGenerator jwt, IMapper mapper)
    {
        _db = db;
        _hasher = hasher;
        _jwt = jwt;
        _mapper = mapper;
    }

    public async Task<Result<AuthResponse>> LoginAsync(LoginRequest req, CancellationToken ct)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Username == req.Username || u.Email == req.Username, ct);

        if (user is null || !user.IsActive)
            return Result<AuthResponse>.Fail("Invalid credentials", 401);

        if (!_hasher.Verify(req.Password, user.PasswordHash))
            return Result<AuthResponse>.Fail("Invalid credentials", 401);

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var (token, expires) = _jwt.Generate(user);
        var dto = _mapper.Map<UserDto>(user);
        return Result<AuthResponse>.Ok(new AuthResponse(token, expires, dto));
    }

    public async Task<Result<bool>> ChangePasswordAsync(Guid userId, ChangePasswordRequest req, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null) return Result<bool>.Fail("User not found", 404);
        if (!_hasher.Verify(req.OldPassword, user.PasswordHash))
            return Result<bool>.Fail("Old password is incorrect", 400);
        user.PasswordHash = _hasher.Hash(req.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Result<bool>.Ok(true);
    }

    public async Task<Result<string>> ForgotPasswordAsync(ForgotPasswordRequest req, CancellationToken ct)
    {
        // For demo: returns a temporary token. In production, this would email a secure reset link.
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email, ct);
        if (user is null) return Result<string>.Ok("If the email exists, a reset link will be sent.");
        return Result<string>.Ok("Reset instructions sent to your email.");
    }
}
