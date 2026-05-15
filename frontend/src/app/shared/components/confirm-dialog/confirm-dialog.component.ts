import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog-backdrop" (click)="cancel.emit()">
      <div class="dialog" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <div class="row gap-3" style="margin-bottom: 12px;">
          <div class="icon" [class.danger]="danger">
            <span class="material-icons-round">{{ danger ? 'warning_amber' : 'help_outline' }}</span>
          </div>
          <div>
            <h2>{{ title }}</h2>
            <p style="color: var(--text-3); margin-top: 6px;">{{ message }}</p>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="btn btn-ghost" (click)="cancel.emit()">{{ cancelLabel || (i18n.t('common.cancel')) }}</button>
          <button class="btn" [class.btn-danger]="danger" [class.btn-primary]="!danger" (click)="confirm.emit()">
            {{ confirmLabel || (i18n.t('common.confirm')) }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .icon {
      width: 44px; height: 44px; border-radius: 50%;
      background: var(--bg-glass);
      display: grid; place-items: center;
      color: var(--silver-2);
    }
    .icon.danger { background: var(--red-soft); color: var(--red); }
  `]
})
export class ConfirmDialogComponent {
  @Input() title = '';
  @Input() message = '';
  @Input() confirmLabel = '';
  @Input() cancelLabel = '';
  @Input() danger = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  i18n = inject(I18nService);
}
