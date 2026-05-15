import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';

/**
 * Two-state language toggle. Click to switch between English and Arabic.
 * The active language is persisted by I18nService and applied to <html dir>
 * automatically, so the entire app re-mirrors RTL/LTR on every toggle.
 */
@Component({
  selector: 'app-lang-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="lang-switch"
      (click)="i18n.toggle()"
      [attr.aria-label]="i18n.lang() === 'en' ? 'Switch language to Arabic' : 'تبديل اللغة إلى الإنجليزية'"
      [title]="i18n.lang() === 'en' ? 'العربية' : 'English'">
      <span class="material-icons-round">language</span>
      <span class="label">{{ i18n.lang() === 'en' ? 'AR' : 'EN' }}</span>
    </button>
  `,
  styles: [`
    .lang-switch {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: 999px;
      background: var(--bg-glass);
      border: 1px solid var(--border);
      color: var(--text-2);
      font-weight: 600;
      font-size: 12.5px;
      letter-spacing: .08em;
      cursor: pointer;
      transition: all var(--duration) var(--ease);
    }
    .lang-switch:hover {
      background: var(--bg-glass-2);
      border-color: var(--border-strong);
      color: var(--text-1);
    }
    .lang-switch .material-icons-round { font-size: 16px; }
    .lang-switch .label { font-family: 'Space Grotesk', sans-serif; }
  `]
})
export class LangSwitchComponent {
  i18n = inject(I18nService);
}
