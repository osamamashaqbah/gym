namespace GymManagement.Application.DTOs.Settings;

public record GymSettingsDto(
    Guid Id,
    string GymName,
    string? Address,
    string? PhoneNumber,
    string? Email,
    string? LogoUrl,
    string Currency,
    string? TaxNumber,
    string? Website);

public record UpdateGymSettingsRequest(
    string GymName,
    string? Address,
    string? PhoneNumber,
    string? Email,
    string? LogoUrl,
    string Currency,
    string? TaxNumber,
    string? Website);

public record StaffUserDto(
    Guid Id,
    string FullName,
    string Email,
    string Username,
    string? PhoneNumber,
    string Role,
    bool IsActive,
    DateTime? LastLoginAt,
    DateTime CreatedAt);

public record CreateStaffRequest(
    string FullName,
    string Email,
    string Username,
    string Password,
    string? PhoneNumber,
    string Role);

public record UpdateStaffRequest(
    string FullName,
    string Email,
    string? PhoneNumber,
    string Role,
    bool IsActive);
