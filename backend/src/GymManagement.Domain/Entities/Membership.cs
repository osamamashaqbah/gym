using GymManagement.Domain.Common;
using GymManagement.Domain.Enums;

namespace GymManagement.Domain.Entities;

public class Membership : BaseEntity
{
    public Guid MemberId { get; set; }
    public Member Member { get; set; } = null!;

    public Guid PlanId { get; set; }
    public MembershipPlan Plan { get; set; } = null!;

    public DateTime StartDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public MembershipStatus Status { get; set; } = MembershipStatus.Active;

    public DateTime? FrozenAt { get; set; }
    public int? FreezeDays { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? Notes { get; set; }

    public decimal TotalPrice { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal RemainingBalance => TotalPrice - AmountPaid;

    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
