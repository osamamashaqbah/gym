using GymManagement.Domain.Enums;

namespace GymManagement.Application.DTOs.Payments;

public record PaymentDto(
    Guid Id,
    Guid MemberId,
    string MemberName,
    Guid? MembershipId,
    string? PlanName,
    decimal Amount,
    PaymentMethod Method,
    DateTime PaidAt,
    string InvoiceNumber,
    string? ReferenceNumber,
    string? Notes);

public record CreatePaymentRequest(
    Guid MemberId,
    Guid? MembershipId,
    decimal Amount,
    PaymentMethod Method,
    string? ReferenceNumber,
    string? Notes);

public record InvoiceDto(
    string InvoiceNumber,
    DateTime IssuedAt,
    string GymName,
    string? GymAddress,
    string? GymPhone,
    string MemberName,
    string MemberPhone,
    string? PlanName,
    decimal Amount,
    PaymentMethod Method,
    string Currency,
    decimal RemainingBalance);
