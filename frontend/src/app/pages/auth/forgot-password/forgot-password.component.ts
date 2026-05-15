import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TPipe } from '../../../core/i18n/t.pipe';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-shell">
      <div class="auth-bg">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="grid"></div>
      </div>
      <div class="auth-card fade-in">
        <a routerLink="/login" class="back">
          <span class="material-icons-round">arrow_back</span> {{ 'auth.backToSignIn' | t }}
        </a>
        <h1 class="auth-title">{{ 'auth.forgotTitle' | t }}</h1>
        <p class="auth-subtitle">{{ 'auth.forgotSubtitle' | t }}</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="col gap-4" style="margin-top:24px;">
          <div class="form-field">
            <label>{{ 'auth.email' | t }}</label>
            <input class="input" type="email" formControlName="email" placeholder="you@example.com" />
          </div>
          <button class="btn btn-primary" type="submit" [disabled]="form.invalid || loading()">
            @if (loading()) { <span class="spinner"></span> } @else { {{ 'auth.sendInstructions' | t }} }
          </button>
          @if (sent()) {
            <p style="color:var(--green); font-size: 13px;">{{ sent() }}</p>
          }
        </form>
      </div>
    </div>
  `,
  styleUrls: ['../login/login.component.scss'],
  styles: [`
    .back { display:inline-flex; align-items:center; gap:6px; color: var(--silver-3); margin-bottom: 16px; font-size: 13px; }
    .back:hover { color: var(--text-1); }
    .back .material-icons-round { font-size: 16px; }
    html[dir="rtl"] .back .material-icons-round { transform: scaleX(-1); }
  `]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private i18n = inject(I18nService);

  loading = signal(false);
  sent = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  submit() {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.auth.forgotPassword(this.form.getRawValue().email).subscribe({
      next: (r) => {
        this.loading.set(false);
        this.sent.set(r.message);
        this.toast.success(this.i18n.t('toast.resetSent'));
      },
      error: () => this.loading.set(false)
    });
  }
}
