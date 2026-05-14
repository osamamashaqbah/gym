import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { GymSettingsDto, StaffUserDto, UserRole } from '../../core/models/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  private i18n = inject(I18nService);

  tab = signal<'gym' | 'staff' | 'account'>('gym');

  loadingGym = signal(true);
  savingGym = signal(false);
  gymSettings = signal<GymSettingsDto | null>(null);

  loadingStaff = signal(false);
  savingStaff = signal(false);
  staff = signal<StaffUserDto[]>([]);
  showStaffDialog = signal(false);
  editingStaff = signal<StaffUserDto | null>(null);

  changingPwd = signal(false);

  gymForm = this.fb.nonNullable.group({
    gymName: ['', Validators.required],
    address: [''],
    phoneNumber: [''],
    email: [''],
    logoUrl: [''],
    currency: ['JOD', Validators.required],
    taxNumber: [''],
    website: ['']
  });

  staffForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phoneNumber: [''],
    role: ['Reception' as UserRole, Validators.required],
    isActive: [true]
  });

  pwdForm = this.fb.nonNullable.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor() {
    this.loadGym();
    this.loadStaff();
  }

  loadGym() {
    this.loadingGym.set(true);
    this.api.getSettings().subscribe(s => {
      this.gymSettings.set(s);
      this.gymForm.patchValue({
        gymName: s.gymName,
        address: s.address ?? '',
        phoneNumber: s.phoneNumber ?? '',
        email: s.email ?? '',
        logoUrl: s.logoUrl ?? '',
        currency: s.currency,
        taxNumber: s.taxNumber ?? '',
        website: s.website ?? ''
      });
      this.loadingGym.set(false);
    });
  }

  loadStaff() {
    this.loadingStaff.set(true);
    this.api.getStaff().subscribe(s => { this.staff.set(s); this.loadingStaff.set(false); });
  }

  saveGym() {
    if (this.gymForm.invalid) return;
    this.savingGym.set(true);
    this.api.updateSettings(this.gymForm.getRawValue()).subscribe({
      next: (s) => {
        this.gymSettings.set(s);
        this.savingGym.set(false);
        this.toast.success(this.i18n.t('toast.settingsSaved'));
      },
      error: () => this.savingGym.set(false)
    });
  }

  openStaff(s: StaffUserDto | null) {
    this.editingStaff.set(s);
    if (s) {
      this.staffForm.controls.password.clearValidators();
      this.staffForm.controls.username.clearValidators();
      this.staffForm.patchValue({
        fullName: s.fullName, email: s.email, username: s.username,
        phoneNumber: s.phoneNumber ?? '', role: s.role, isActive: s.isActive
      });
    } else {
      this.staffForm.reset({ fullName: '', email: '', username: '', password: '', phoneNumber: '', role: 'Reception', isActive: true });
      this.staffForm.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
      this.staffForm.controls.username.setValidators([Validators.required, Validators.minLength(3)]);
    }
    this.staffForm.controls.password.updateValueAndValidity();
    this.staffForm.controls.username.updateValueAndValidity();
    this.showStaffDialog.set(true);
  }

  closeStaff() { this.showStaffDialog.set(false); }

  saveStaff() {
    if (this.staffForm.invalid) return;
    this.savingStaff.set(true);
    const v = this.staffForm.getRawValue();
    const op$ = this.editingStaff()
      ? this.api.updateStaff(this.editingStaff()!.id, { fullName: v.fullName, email: v.email, phoneNumber: v.phoneNumber, role: v.role, isActive: v.isActive })
      : this.api.createStaff({ fullName: v.fullName, email: v.email, username: v.username, password: v.password, phoneNumber: v.phoneNumber, role: v.role });
    op$.subscribe({
      next: () => { this.savingStaff.set(false); this.toast.success(this.i18n.t('toast.saved')); this.closeStaff(); this.loadStaff(); },
      error: () => this.savingStaff.set(false)
    });
  }

  canDelete(s: StaffUserDto) {
    return this.auth.role() === 'Owner' && s.id !== this.auth.user()?.id;
  }

  deleteStaff(s: StaffUserDto) {
    if (!confirm(this.i18n.t('settings.deleteUserConfirm', { name: s.fullName }))) return;
    this.api.deleteStaff(s.id).subscribe(() => { this.toast.success(this.i18n.t('toast.userDeleted')); this.loadStaff(); });
  }

  changePassword() {
    if (this.pwdForm.invalid) return;
    this.changingPwd.set(true);
    const v = this.pwdForm.getRawValue();
    this.auth.changePassword(v.oldPassword, v.newPassword).subscribe({
      next: () => { this.changingPwd.set(false); this.toast.success(this.i18n.t('toast.passwordUpdated')); this.pwdForm.reset(); },
      error: () => this.changingPwd.set(false)
    });
  }
}
