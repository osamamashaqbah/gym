import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TPipe } from '../../../core/i18n/t.pipe';
import {
  AttendanceDto, MemberDto, MembershipDto, PaymentDto
} from '../../../core/models/models';
import { MemberFormDialogComponent } from '../member-form-dialog/member-form-dialog.component';
import { MembershipDialogComponent } from '../../memberships/membership-dialog/membership-dialog.component';
import { PaymentDialogComponent } from '../../payments/payment-dialog/payment-dialog.component';

@Component({
  selector: 'app-member-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, TPipe, MemberFormDialogComponent, MembershipDialogComponent, PaymentDialogComponent],
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
  private i18n = inject(I18nService);

  loading = signal(true);
  member = signal<MemberDto | null>(null);
  memberships = signal<MembershipDto[]>([]);
  payments = signal<PaymentDto[]>([]);
  attendance = signal<AttendanceDto[]>([]);

  showEdit = signal(false);
  showMembership = signal(false);
  showPayment = signal(false);

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

  reload() { if (this.member()) this.load(this.member()!.id); }

  onEdited() { this.toast.success(this.i18n.t('toast.memberUpdated')); this.showEdit.set(false); this.reload(); }
  onMembershipCreated() { this.toast.success(this.i18n.t('toast.membershipCreated')); this.showMembership.set(false); this.reload(); }
  onPaymentCreated() { this.toast.success(this.i18n.t('toast.paymentRecorded')); this.showPayment.set(false); this.reload(); }

  freeze(m: MembershipDto) {
    const days = window.prompt(this.i18n.t('memberProfile.freezePrompt'), '14');
    if (!days) return;
    const n = parseInt(days, 10);
    if (isNaN(n) || n < 1) return;
    this.api.freeze(m.id, { freezeDays: n }).subscribe(() => {
      this.toast.success(this.i18n.t('toast.frozen'));
      this.reload();
    });
  }
  unfreeze(m: MembershipDto) {
    this.api.unfreeze(m.id).subscribe(() => { this.toast.success(this.i18n.t('toast.unfrozen')); this.reload(); });
  }
  cancel(m: MembershipDto) {
    if (!confirm(this.i18n.t('memberProfile.cancelConfirm'))) return;
    this.api.cancel(m.id).subscribe(() => { this.toast.success(this.i18n.t('toast.cancelled')); this.reload(); });
  }
  checkIn() {
    if (!this.member()) return;
    this.api.checkIn(this.member()!.id).subscribe({
      next: () => { this.toast.success(this.i18n.t('toast.checkedIn')); this.reload(); },
      error: () => {}
    });
  }
  printInvoice(p: PaymentDto) {
    this.api.invoiceHtml(p.id).subscribe((html) => {
      const win = window.open('', '_blank');
      if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 300);
      }
    });
  }

  statusKey(s: number): string {
    return s === 1 ? 'status.active'
         : s === 2 ? 'status.expired'
         : s === 3 ? 'status.frozen'
         : 'status.cancelled';
  }
  genderKey(g: number): string {
    return g === 1 ? 'gender.male' : g === 2 ? 'gender.female' : 'gender.other';
  }
  paymentMethodKey(m: number): string {
    return m === 1 ? 'paymentMethod.cash' : m === 2 ? 'paymentMethod.visa' : 'paymentMethod.cliq';
  }
}
