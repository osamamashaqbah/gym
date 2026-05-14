import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';
export interface Toast { id: number; kind: ToastKind; message: string; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _id = 0;
  readonly toasts = signal<Toast[]>([]);

  show(message: string, kind: ToastKind = 'info', duration = 3500): void {
    const id = ++this._id;
    this.toasts.update(list => [...list, { id, kind, message }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(m: string) { this.show(m, 'success'); }
  error(m: string) { this.show(m, 'error', 5000); }
  warning(m: string) { this.show(m, 'warning'); }
  info(m: string) { this.show(m, 'info'); }

  dismiss(id: number) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
