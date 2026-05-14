using GymManagement.Domain.Common;
using GymManagement.Domain.Enums;

namespace GymManagement.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid MemberId { get; set; }
    public Member Member { get; set; } = null!;

    public Guid? MembershipId { get; set; }
    public Membership? Membership { get; set; }

    public decimal Amount { get; set; }
    public PaymentMethod Method { get; set; }
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
}
