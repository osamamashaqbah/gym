namespace GymManagement.Application.DTOs.Auth;

public record LoginRequest(string Username, string Password);

public record AuthResponse(
    string Token,
    DateTime ExpiresAt,
    UserDto User);

public record UserDto(
    Guid Id,
    string FullName,
    string Email,
    string Username,
    string Role,
    string? AvatarUrl);

public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Token, string NewPassword);
public record ChangePasswordRequest(string OldPassword, string NewPassword);
