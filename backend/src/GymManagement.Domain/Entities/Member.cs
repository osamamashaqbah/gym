using GymManagement.Domain.Common;
using GymManagement.Domain.Enums;

namespace GymManagement.Domain.Entities;

public class Member : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public Gender Gender { get; set; }
    public int Age { get; set; }
    public string? Address { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? Email { get; set; }
    public string? Notes { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Membership> Memberships { get; set; } = new List<Membership>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
}
