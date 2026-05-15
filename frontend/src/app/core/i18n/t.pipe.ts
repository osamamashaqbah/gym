import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from './i18n.service';

/**
 * Translation pipe. Used as `{{ 'nav.dashboard' | t }}` in templates.
 *
 * The pipe is impure on purpose so it re-evaluates whenever the I18nService
 * signal changes, even with OnPush change detection.
 */
@Pipe({ name: 't', standalone: true, pure: false })
export class TPipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(key: string, params?: Record<string, string | number | null | undefined>): string {
    // Touching the signal here is what wires re-evaluation to language changes.
    this.i18n.lang();
    return this.i18n.t(key, params);
  }
}
