export type UserRole = 'Owner' | 'Admin' | 'Reception' | 'Coach';

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: UserRole;
  avatarUrl?: string | null;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: UserDto;
}

export type Gender = 1 | 2 | 3;
export type MembershipStatus = 1 | 2 | 3 | 4;   // Active, Expired, Frozen, Cancelled
export type PaymentMethod = 1 | 2 | 3;          // Cash, Visa, CliQ
export type PlanDuration = 1 | 3 | 6 | 12;

export const GenderLabels: Record<number, string> = { 1: 'Male', 2: 'Female', 3: 'Other' };
export const StatusLabels: Record<number, string> = { 1: 'Active', 2: 'Expired', 3: 'Frozen', 4: 'Cancelled' };
export const PaymentMethodLabels: Record<number, string> = { 1: 'Cash', 2: 'Visa', 3: 'CliQ' };
export const PlanDurationLabels: Record<number, string> = { 1: 'Monthly', 3: 'Quarterly', 6: 'Semi-Annual', 12: 'Annual' };

export interface MemberDto {
  id: string;
  fullName: string;
  phoneNumber: string;
  gender: Gender;
  age: number;
  address?: string | null;
  email?: string | null;
  profileImageUrl?: string | null;
  notes?: string | null;
  joinedAt: string;
  currentStatus?: MembershipStatus | null;
  currentPlanName?: string | null;
  membershipStartDate?: string | null;
  membershipExpiryDate?: string | null;
}

export interface CreateMemberRequest {
  fullName: string;
  phoneNumber: string;
  gender: Gender;
  age: number;
  address?: string | null;
  email?: string | null;
  profileImageUrl?: string | null;
  notes?: string | null;
  planId?: string | null;
}

export type UpdateMemberRequest = Omit<CreateMemberRequest, 'planId'>;

export interface MembershipPlanDto {
  id: string;
  name: string;
  description?: string | null;
  duration: PlanDuration;
  durationInMonths: number;
  price: number;
  isActive: boolean;
}

export interface MembershipDto {
  id: string;
  memberId: string;
  memberName: string;
  planId: string;
  planName: string;
  startDate: string;
  expiryDate: string;
  status: MembershipStatus;
  totalPrice: number;
  amountPaid: number;
  remainingBalance: number;
  notes?: string | null;
}

export interface CreateMembershipRequest {
  memberId: string;
  planId: string;
  startDate: string;
  customPrice?: number | null;
  initialPayment: number;
  paymentMethod: PaymentMethod;
  notes?: string | null;
}

export interface PaymentDto {
  id: string;
  memberId: string;
  memberName: string;
  membershipId?: string | null;
  planName?: string | null;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  invoiceNumber: string;
  referenceNumber?: string | null;
  notes?: string | null;
}

export interface CreatePaymentRequest {
  memberId: string;
  membershipId?: string | null;
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string | null;
  notes?: string | null;
}

export interface AttendanceDto {
  id: string;
  memberId: string;
  memberName: string;
  checkInTime: string;
  notes?: string | null;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  expiredMemberships: number;
  expiringSoonMemberships: number;
  attendanceToday: number;
  revenueToday: number;
  revenueThisMonth: number;
  revenueThisYear: number;
  newMembersThisMonth: number;
}

export interface RevenuePoint { label: string; revenue: number; }
export interface AttendancePoint { label: string; count: number; }
export interface MembershipDistribution { status: string; count: number; }
export interface PlanPopularity { planName: string; count: number; }

export interface DashboardCharts {
  revenueLast12Months: RevenuePoint[];
  attendanceLast7Days: AttendancePoint[];
  membershipDistribution: MembershipDistribution[];
  popularPlans: PlanPopularity[];
}

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: number;
  isRead: boolean;
  createdAt: string;
  memberId?: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GymSettingsDto {
  id: string;
  gymName: string;
  address?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  currency: string;
  taxNumber?: string | null;
  website?: string | null;
}

export interface StaffUserDto {
  id: string;
  fullName: string;
  email: string;
  username: string;
  phoneNumber?: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}
