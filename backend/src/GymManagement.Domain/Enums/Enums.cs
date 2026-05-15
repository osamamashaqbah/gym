namespace GymManagement.Domain.Enums;

public enum Gender
{
    Male = 1,
    Female = 2,
    Other = 3
}

public enum MembershipStatus
{
    Active = 1,
    Expired = 2,
    Frozen = 3,
    Cancelled = 4
}

public enum PlanDuration
{
    Monthly = 1,
    ThreeMonths = 3,
    SixMonths = 6,
    Yearly = 12
}

public enum PaymentMethod
{
    Cash = 1,
    Visa = 2,
    CliQ = 3
}

public enum NotificationType
{
    MembershipExpiry = 1,
    PaymentReminder = 2,
    System = 3,
    Warning = 4
}

public enum UserRole
{
    Owner = 1,
    Admin = 2,
    Reception = 3,
    Coach = 4
}
