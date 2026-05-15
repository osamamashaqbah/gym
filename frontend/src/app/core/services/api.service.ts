import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  AttendanceDto, CreateMemberRequest, CreateMembershipRequest, CreatePaymentRequest,
  DashboardCharts, DashboardStats, GymSettingsDto, MemberDto, MembershipDto,
  MembershipPlanDto, NotificationDto, PagedResult, PaymentDto, StaffUserDto, UpdateMemberRequest
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ---------- Dashboard
  dashboardStats() { return this.http.get<DashboardStats>(`${this.base}/dashboard/stats`); }
  dashboardCharts() { return this.http.get<DashboardCharts>(`${this.base}/dashboard/charts`); }
  recentPayments(take = 6) { return this.http.get<PaymentDto[]>(`${this.base}/dashboard/recent-payments?take=${take}`); }
  recentMembers(take = 6) { return this.http.get<MemberDto[]>(`${this.base}/dashboard/recent-members?take=${take}`); }

  // ---------- Members
  getMembers(opts: { page?: number; pageSize?: number; search?: string; status?: string } = {}) {
    let params = new HttpParams();
    if (opts.page) params = params.set('page', opts.page);
    if (opts.pageSize) params = params.set('pageSize', opts.pageSize);
    if (opts.search) params = params.set('search', opts.search);
    if (opts.status) params = params.set('status', opts.status);
    return this.http.get<PagedResult<MemberDto>>(`${this.base}/members`, { params });
  }
  getMember(id: string) { return this.http.get<MemberDto>(`${this.base}/members/${id}`); }
  createMember(body: CreateMemberRequest) { return this.http.post<MemberDto>(`${this.base}/members`, body); }
  updateMember(id: string, body: UpdateMemberRequest) { return this.http.put<MemberDto>(`${this.base}/members/${id}`, body); }
  archiveMember(id: string) { return this.http.post(`${this.base}/members/${id}/archive`, {}); }
  deleteMember(id: string) { return this.http.delete(`${this.base}/members/${id}`); }

  // ---------- Memberships
  getPlans() { return this.http.get<MembershipPlanDto[]>(`${this.base}/memberships/plans`); }
  createPlan(body: any) { return this.http.post<MembershipPlanDto>(`${this.base}/memberships/plans`, body); }
  updatePlan(id: string, body: any) { return this.http.put<MembershipPlanDto>(`${this.base}/memberships/plans/${id}`, body); }
  deletePlan(id: string) { return this.http.delete(`${this.base}/memberships/plans/${id}`); }

  getMembershipsByMember(memberId: string) {
    return this.http.get<MembershipDto[]>(`${this.base}/memberships/by-member/${memberId}`);
  }
  createMembership(body: CreateMembershipRequest) { return this.http.post<MembershipDto>(`${this.base}/memberships`, body); }
  renewMembership(memberId: string, body: any) { return this.http.post<MembershipDto>(`${this.base}/memberships/renew/${memberId}`, body); }
  freeze(membershipId: string, body: { freezeDays: number; notes?: string | null }) {
    return this.http.post<MembershipDto>(`${this.base}/memberships/${membershipId}/freeze`, body);
  }
  unfreeze(membershipId: string) { return this.http.post<MembershipDto>(`${this.base}/memberships/${membershipId}/unfreeze`, {}); }
  cancel(membershipId: string) { return this.http.post<MembershipDto>(`${this.base}/memberships/${membershipId}/cancel`, {}); }

  // ---------- Payments
  getPayments(opts: { page?: number; pageSize?: number; search?: string; from?: string; to?: string } = {}) {
    let params = new HttpParams();
    if (opts.page) params = params.set('page', opts.page);
    if (opts.pageSize) params = params.set('pageSize', opts.pageSize);
    if (opts.search) params = params.set('search', opts.search);
    if (opts.from) params = params.set('from', opts.from);
    if (opts.to) params = params.set('to', opts.to);
    return this.http.get<PagedResult<PaymentDto>>(`${this.base}/payments`, { params });
  }
  paymentsByMember(memberId: string) { return this.http.get<PaymentDto[]>(`${this.base}/payments/by-member/${memberId}`); }
  createPayment(body: CreatePaymentRequest) { return this.http.post<PaymentDto>(`${this.base}/payments`, body); }
  invoice(id: string) { return this.http.get<any>(`${this.base}/payments/${id}/invoice`); }
  invoiceHtml(id: string) {
    return this.http.get(`${this.base}/payments/${id}/invoice/html`, { responseType: 'text' });
  }

  // ---------- Attendance
  getAttendance(opts: { page?: number; pageSize?: number; search?: string; date?: string; memberId?: string } = {}) {
    let params = new HttpParams();
    if (opts.page) params = params.set('page', opts.page);
    if (opts.pageSize) params = params.set('pageSize', opts.pageSize);
    if (opts.search) params = params.set('search', opts.search);
    if (opts.date) params = params.set('date', opts.date);
    if (opts.memberId) params = params.set('memberId', opts.memberId);
    return this.http.get<PagedResult<AttendanceDto>>(`${this.base}/attendance`, { params });
  }
  attendanceByMember(memberId: string) {
    return this.http.get<AttendanceDto[]>(`${this.base}/attendance/by-member/${memberId}`);
  }
  checkIn(memberId: string, notes?: string) {
    return this.http.post<AttendanceDto>(`${this.base}/attendance/check-in`, { memberId, notes });
  }

  // ---------- Notifications
  getNotifications(unreadOnly = false) {
    return this.http.get<NotificationDto[]>(`${this.base}/notifications?unreadOnly=${unreadOnly}`);
  }
  markRead(id: string) { return this.http.post(`${this.base}/notifications/${id}/read`, {}); }
  markAllRead() { return this.http.post(`${this.base}/notifications/read-all`, {}); }
  generateExpiryAlerts() { return this.http.post<{ created: number }>(`${this.base}/notifications/generate-expiry-alerts`, {}); }

  // ---------- Settings
  getSettings() { return this.http.get<GymSettingsDto>(`${this.base}/settings`); }
  updateSettings(body: any) { return this.http.put<GymSettingsDto>(`${this.base}/settings`, body); }
  getStaff() { return this.http.get<StaffUserDto[]>(`${this.base}/settings/staff`); }
  createStaff(body: any) { return this.http.post<StaffUserDto>(`${this.base}/settings/staff`, body); }
  updateStaff(id: string, body: any) { return this.http.put<StaffUserDto>(`${this.base}/settings/staff/${id}`, body); }
  deleteStaff(id: string) { return this.http.delete(`${this.base}/settings/staff/${id}`); }

  // ---------- Reports
  reportMembers() {
    return this.http.get(`${this.base}/reports/members.csv`, { responseType: 'blob' });
  }
  reportPayments(from?: string, to?: string) {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get(`${this.base}/reports/payments.csv`, { params, responseType: 'blob' });
  }
  reportAttendance(from?: string, to?: string) {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get(`${this.base}/reports/attendance.csv`, { params, responseType: 'blob' });
  }
}
