import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { GymSettingsDto, StaffUserDto, UserRole } from '../../core/models/models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Settings</h1>
          <p class="page-subtitle">Gym info, staff, and your account.</p>
        </div>
      </div>

      <div class="tabs">
        <button class="tab" [class.active]="tab() === 'gym'" (click)="tab.set('gym')">Gym Information</button>
        <button class="tab" [class.active]="tab() === 'staff'" (click)="tab.set('staff')">Staff & Roles</button>
        <button class="tab" [class.active]="tab() === 'account'" (click)="tab.set('account')">My Account</button>
      </div>

      @if (tab() === 'gym') {
        <div class="card">
          <h3 style="margin-bottom: 16px;">Gym Information</h3>
          @if (loadingGym()) {
            <div style="display:grid;place-items:center;padding:40px;"><span class="spinner"></span></div>
          } @else {
            <form [formGroup]="gymForm" (ngSubmit)="saveGym()" class="form-grid">
              <div class="form-field"><label>Gym Name *</label><input class="input" formControlName="gymName" /></div>
              <div class="form-field"><label>Currency *</label><input class="input" formControlName="currency" maxlength="10" /></div>
              <div class="form-field span-2"><label>Address</label><input class="input" formControlName="address" /></div>
              <div class="form-field"><label>Phone</label><input class="input" formControlName="phoneNumber" /></div>
              <div class="form-field"><label>Email</label><input class="input" type="email" formControlName="email" /></div>
              <div class="form-field"><label>Tax Number</label><input class="input" formControlName="taxNumber" /></div>
              <div class="form-field"><label>Website</label><input class="input" formControlName="website" /></div>
              <div class="form-field span-2"><label>Logo URL</label><input class="input" formControlName="logoUrl" /></div>
              <div class="span-2 row gap-3" style="justify-content: flex-end;">
                <button class="btn btn-primary" [disabled]="gymForm.invalid || savingGym()">
                  @if (savingGym()) { <span class="spinner" style="border-top-color:#0a0a0c;border-color:#0a0a0c40"></span> }
                  @else { Save changes }
                </button>
              </div>
            </form>
          }
        </div>
      }

      @if (tab() === 'staff') {
        <div class="card">
          <div class="row between" style="margin-bottom: 14px;">
            <h3>Staff & Roles</h3>
            <button class="btn btn-primary" (click)="openStaff(null)">
              <span class="material-icons-round">person_add</span> New user
            </button>
          </div>
          @if (loadingStaff()) {
            <div style="display:grid;place-items:center;padding:40px;"><span class="spinner"></span></div>
          } @else {
            <table class="table">
              <thead><tr><th>User</th><th>Username</th><th>Role</th><th>Status</th><th>Last login</th><th></th></tr></thead>
              <tbody>
                @for (s of staff(); track s.id) {
                  <tr>
                    <td>
                      <div class="name-cell">
                        <div class="avatar">{{ s.fullName.charAt(0) }}</div>
                        <div>
                          <div style="color:var(--text-1);font-weight:600;">{{ s.fullName }}</div>
                          <div style="color:var(--text-4);font-size:11.5px;">{{ s.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="mono">{{ s.username }}</span></td>
                    <td>
                      <span class="badge" [class.badge-active]="s.role === 'Owner'">{{ s.role }}</span>
                    </td>
                    <td>
                      @if (s.isActive) { <span class="badge badge-active">Active</span> }
                      @else { <span class="badge badge-cancelled">Disabled</span> }
                    </td>
                    <td>{{ s.lastLoginAt ? (s.lastLoginAt | date:'short') : '—' }}</td>
                    <td style="text-align:right;">
                      <button class="btn btn-ghost btn-icon" (click)="openStaff(s)"><span class="material-icons-round">edit</span></button>
                      @if (canDelete(s)) {
                        <button class="btn btn-ghost btn-icon" (click)="deleteStaff(s)"><span class="material-icons-round">delete</span></button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }

      @if (tab() === 'account') {
        <div class="card">
          <h3 style="margin-bottom: 16px;">Change Password</h3>
          <form [formGroup]="pwdForm" (ngSubmit)="changePassword()" class="col gap-4" style="max-width: 480px;">
            <div class="form-field"><label>Current Password *</label><input class="input" type="password" formControlName="oldPassword" /></div>
            <div class="form-field"><label>New Password *</label><input class="input" type="password" formControlName="newPassword" /></div>
            <div class="row gap-3" style="justify-content:flex-start;">
              <button class="btn btn-primary" [disabled]="pwdForm.invalid || changingPwd()">
                @if (changingPwd()) { <span class="spinner" style="border-top-color:#0a0a0c;border-color:#0a0a0c40"></span> }
                @else { Update password }
              </button>
            </div>
          </form>
        </div>
      }

      @if (showStaffDialog()) {
        <div class="dialog-backdrop" (click)="closeStaff()">
          <div class="dialog" (click)="$event.stopPropagation()">
            <h2>{{ editingStaff() ? 'Edit user' : 'New user' }}</h2>
            <form [formGroup]="staffForm" (ngSubmit)="saveStaff()" class="col gap-4" style="margin-top: 20px;">
              <div class="form-field"><label>Full Name *</label><input class="input" formControlName="fullName" /></div>
              <div class="form-field"><label>Email *</label><input class="input" type="email" formControlName="email" /></div>
              @if (!editingStaff()) {
                <div class="form-field"><label>Username *</label><input class="input" formControlName="username" /></div>
                <div class="form-field"><label>Password *</label><input class="input" type="password" formControlName="password" /></div>
              }
              <div class="form-field"><label>Phone</label><input class="input" formControlName="phoneNumber" /></div>
              <div class="form-field">
                <label>Role *</label>
                <select class="input" formControlName="role">
                  <option value="Owner">Owner</option>
                  <option value="Admin">Admin</option>
                  <option value="Reception">Reception</option>
                  <option value="Coach">Coach</option>
                </select>
              </div>
              @if (editingStaff()) {
                <div class="form-field"><label class="row gap-2"><input type="checkbox" formControlName="isActive" /> Active</label></div>
              }
              <div class="dialog-actions">
                <button type="button" class="btn btn-ghost" (click)="closeStaff()">Cancel</button>
                <button class="btn btn-primary" [disabled]="staffForm.invalid || savingStaff()">
                  @if (savingStaff()) { <span class="spinner" style="border-top-color:#0a0a0c;border-color:#0a0a0c40"></span> }
                  @else { Save }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tabs {
      display: flex; gap: 4px; padding: 4px;
      background: var(--bg-glass);
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 18px;
      width: fit-content;
    }
    .tab {
      padding: 10px 18px;
      border: 0; background: transparent;
      color: var(--text-3);
      border-radius: 9px;
      cursor: pointer;
      font-weight: 500;
      font-size: 13px;
      transition: all var(--duration) var(--ease);
    }
    .tab:hover { color: var(--text-1); }
    .tab.active {
      background: var(--silver-grad-soft);
      color: var(--text-1);
      border: 1px solid var(--border-strong);
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .span-2 { grid-column: 1 / -1; }
    @media (max-width: 700px) { .form-grid { grid-template-columns: 1fr; } .span-2 { grid-column: 1; } }
    .name-cell { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--silver-grad); color: #0a0a0c; display: grid; place-items: center; font-weight: 700; font-size: 13px; border: 1px solid #d8dadf; }
    .mono { font-family: ui-monospace, monospace; font-size: 12px; }
  `]
})
export class SettingsComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

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
        this.toast.success('Settings saved');
      },
      error: () => this.savingGym.set(false)
    });
  }

  openStaff(s: StaffUserDto | null) {
    this.editingStaff.set(s);
    if (s) {
      // remove password validators when editing
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
      next: () => { this.savingStaff.set(false); this.toast.success('Saved'); this.closeStaff(); this.loadStaff(); },
      error: () => this.savingStaff.set(false)
    });
  }

  canDelete(s: StaffUserDto) {
    return this.auth.role() === 'Owner' && s.id !== this.auth.user()?.id;
  }

  deleteStaff(s: StaffUserDto) {
    if (!confirm(`Delete ${s.fullName}?`)) return;
    this.api.deleteStaff(s.id).subscribe(() => { this.toast.success('User deleted'); this.loadStaff(); });
  }

  changePassword() {
    if (this.pwdForm.invalid) return;
    this.changingPwd.set(true);
    const v = this.pwdForm.getRawValue();
    this.auth.changePassword(v.oldPassword, v.newPassword).subscribe({
      next: () => { this.changingPwd.set(false); this.toast.success('Password updated'); this.pwdForm.reset(); },
      error: () => this.changingPwd.set(false)
    });
  }
}
