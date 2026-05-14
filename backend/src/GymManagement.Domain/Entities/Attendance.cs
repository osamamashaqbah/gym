using GymManagement.Domain.Common;

namespace GymManagement.Domain.Entities;

public class Attendance : BaseEntity
{
    public Guid MemberId { get; set; }
    public Member Member { get; set; } = null!;
    public DateTime CheckInTime { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }
}
