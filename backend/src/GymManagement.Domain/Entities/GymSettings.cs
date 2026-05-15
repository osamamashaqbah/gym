using GymManagement.Domain.Common;

namespace GymManagement.Domain.Entities;

public class GymSettings : BaseEntity
{
    public string GymName { get; set; } = "Iron Forge Gym";
    public string? Address { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string? LogoUrl { get; set; }
    public string Currency { get; set; } = "JOD";
    public string? TaxNumber { get; set; }
    public string? Website { get; set; }
}
