using GymManagement.Application.DTOs.Auth;
using GymManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymManagement.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    private readonly ICurrentUser _currentUser;

    public AuthController(IAuthService auth, ICurrentUser currentUser)
    {
        _auth = auth;
        _currentUser = currentUser;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        var result = await _auth.LoginAsync(req, ct);
        if (!result.Success) return StatusCode(result.StatusCode, new { error = result.Error });
        return Ok(result.Data);
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> Forgot([FromBody] ForgotPasswordRequest req, CancellationToken ct)
    {
        var r = await _auth.ForgotPasswordAsync(req, ct);
        return Ok(new { message = r.Data });
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req, CancellationToken ct)
    {
        if (_currentUser.UserId is null) return Unauthorized();
        var r = await _auth.ChangePasswordAsync(_currentUser.UserId.Value, req, ct);
        if (!r.Success) return StatusCode(r.StatusCode, new { error = r.Error });
        return Ok(new { success = true });
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me() => Ok(new
    {
        userId = _currentUser.UserId,
        username = _currentUser.Username,
        role = _currentUser.Role
    });
}
