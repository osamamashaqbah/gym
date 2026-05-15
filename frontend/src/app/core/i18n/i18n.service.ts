import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ar, en } from './translations';

export type Lang = 'en' | 'ar';

const STORAGE_KEY = 'ironforge.lang';

/**
 * Application-wide i18n service.
 * - Persists the chosen language in localStorage.
 * - Applies <html lang> and <html dir> reactively whenever language changes.
 * - Exposes t(key, params) for templates and components.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private doc = inject(DOCUMENT);

  readonly lang = signal<Lang>(this.loadInitial());
  readonly isRtl = computed(() => this.lang() === 'ar');

  constructor() {
    effect(() => {
      const l = this.lang();
      const html = this.doc.documentElement;
      html.setAttribute('lang', l);
      html.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr');
    });
  }

  setLang(lang: Lang): void {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
    this.lang.set(lang);
  }

  toggle(): void {
    this.setLang(this.lang() === 'en' ? 'ar' : 'en');
  }

  /**
   * Translate a dotted key path with optional named placeholders.
   * Falls back to the key itself if a translation is missing.
   *
   * @example
   * i18n.t('toast.welcomeBack', { name: 'Omar' })  // -> "Welcome back, Omar"
   */
  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    const dict = this.lang() === 'ar' ? ar : en;
    let value: unknown = dict;
    for (const part of key.split('.')) {
      if (value && typeof value === 'object' && part in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return key;
      }
    }
    if (typeof value !== 'string') return key;
    if (!params) return value;
    return value.replace(/\{(\w+)\}/g, (_, k) => {
      const v = params[k];
      return v === null || v === undefined ? '' : String(v);
    });
  }

  private loadInitial(): Lang {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'ar' || raw === 'en') return raw;
    } catch { /* ignore */ }
    return 'en';
  }
}
