import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  AttendanceDto, GenderLabels, MemberDto, MembershipDto, MembershipStatus,
  PaymentDto, PaymentMethodLabels, StatusLabels
} from '../../../core/models/models';
import { MemberFormDialogComponent } from '../member-form-dialog/member-form-dialog.component';
import { MembershipDialogComponent } from '../../memberships/membership-dialog/membership-dialog.component';
import { PaymentDialogComponent } from '../../payments/payment-dialog/payment-dialog.component';

@Component({
  selector: 'app-member-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, MemberFormDialogComponent, MembershipDialogComponent, PaymentDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './member-profile.component.html',
  styleUrls: ['./member-profile.component.scss']
})
export class MemberProfileComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  loading = signal(true);
  member = signal<MemberDto | null>(null);
  memberships = signal<MembershipDto[]>([]);
  payments = signal<PaymentDto[]>([]);
  attendance = signal<AttendanceDto[]>([]);

  showEdit = signal(false);
  showMembership = signal(false);
  showPayment = signal(false);

  GenderLabels = GenderLabels;
  StatusLabels = StatusLabels;
  PaymentMethodLabels = PaymentMethodLabels;

  canEdit = computed(() => this.auth.hasRole(['Owner', 'Admin', 'Reception']));

  activeMembership = computed(() =>
    this.memberships().find(m => m.status === 1) ?? this.memberships()[0]
  );

  totalPaid = computed(() => this.payments().reduce((s, p) => s + p.amount, 0));

  attendanceCount = computed(() => this.attendance().length);

  constructor() {
    this.route.paramMap.subscribe(p => {
      const id = p.get('id');
      if (id) this.load(id);
    });
  }

  load(id: string) {
    this.loading.set(true);
    forkJoin({
      member: this.api.getMember(id),
      memberships: this.api.getMembershipsByMember(id),
      payments: this.api.paymentsByMember(id),
      attendance: this.api.attendanceByMember(id)
    }).subscribe({
      next: (r) => {
        this.member.set(r.member);
        this.memberships.set(r.memberships);
        this.payments.set(r.payments);
        this.attendance.set(r.attendance);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.router.navigate(['/members']); }
    });
  }

  reload() {
    if (this.member()) this.load(this.member()!.id);
  }

  // Actions
  onEdited() { this.toast.success('Member updated'); this.showEdit.set(false); this.reload(); }
  onMembershipCreated() { this.toast.success('Membership created'); this.showMembership.set(false); this.reload(); }
  onPaymentCreated() { this.toast.success('Payment recorded'); this.showPayment.set(false); this.reload(); }

  freeze(m: MembershipDto) {
    const days = window.prompt('Freeze for how many days?', '14');
    if (!days) return;
    const n = parseInt(days, 10);
    if (isNaN(n) || n < 1) return;
    this.api.freeze(m.id, { freezeDays: n }).subscribe(() => {
      this.toast.success('Membership frozen');
      this.reload();
    });
  }

  unfreeze(m: MembershipDto) {
    this.api.unfreeze(m.id).subscribe(() => { this.toast.success('Unfrozen'); this.reload(); });
  }

  cancel(m: MembershipDto) {
    if (!confirm('Cancel this membership? This cannot be undone.')) return;
    this.api.cancel(m.id).subscribe(() => { this.toast.success('Cancelled'); this.reload(); });
  }

  checkIn() {
    if (!this.member()) return;
    this.api.checkIn(this.member()!.id).subscribe({
      next: () => { this.toast.success('Checked in'); this.reload(); },
      // error toast handled by interceptor
      error: () => {}
    });
  }

  printInvoice(p: PaymentDto) {
    window.open(this.api.invoiceHtmlUrl(p.id), '_blank');
  }
}
