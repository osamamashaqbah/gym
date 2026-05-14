namespace GymManagement.Domain.Common;

/// <summary>
/// Base entity providing identity and audit fields shared by every aggregate.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsArchived { get; set; }
}
