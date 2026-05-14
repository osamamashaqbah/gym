import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  loading = signal(false);
  showPassword = signal(false);

  form = this.fb.nonNullable.group({
    username: ['owner', [Validators.required, Validators.minLength(3)]],
    password: ['Owner@123', [Validators.required, Validators.minLength(4)]]
  });

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    const { username, password } = this.form.getRawValue();
    this.auth.login(username, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success(`Welcome back, ${this.auth.user()?.fullName}`);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
