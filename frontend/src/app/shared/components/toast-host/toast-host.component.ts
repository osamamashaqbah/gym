import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-host">
      @for (t of toasts.toasts(); track t.id) {
        <div class="toast" [class.success]="t.kind === 'success'"
             [class.error]="t.kind === 'error'"
             [class.warning]="t.kind === 'warning'"
             [class.info]="t.kind === 'info'">
          <span class="material-icons-round">
            {{ t.kind === 'success' ? 'check_circle' : t.kind === 'error' ? 'error' : t.kind === 'warning' ? 'warning' : 'info' }}
          </span>
          <span class="grow">{{ t.message }}</span>
          <span class="material-icons-round" style="cursor:pointer;color:var(--text-4)" (click)="toasts.dismiss(t.id)">close</span>
        </div>
      }
    </div>
  `
})
export class ToastHostComponent {
  toasts = inject(ToastService);
}
