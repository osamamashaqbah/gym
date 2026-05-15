import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { NotificationDto } from '../../core/models/models';

@Component({
  selector: 'app-notifications-bell',
  standalone: true,
  imports: [CommonModule, DatePipe, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bell-wrap">
      <button class="btn btn-ghost btn-icon" (click)="toggle()">
        <span class="material-icons-round">notifications</span>
        @if (unreadCount() > 0) {
          <span class="dot">{{ unreadCount() > 9 ? '9+' : unreadCount() }}</span>
        }
      </button>

      @if (open()) {
        <div class="panel fade-in">
          <div class="panel-head">
            <h3>{{ 'notifications.title' | t }}</h3>
            @if (unreadCount() > 0) {
              <button class="btn btn-ghost btn-sm" (click)="markAllRead()">{{ 'notifications.markAllRead' | t }}</button>
            }
          </div>
          <div class="panel-body">
            @if (loading()) {
              <div class="loading"><span class="spinner"></span></div>
            } @else if (items().length === 0) {
              <div class="empty">
                <span class="material-icons-round">notifications_off</span>
                <p>{{ 'notifications.allCaughtUp' | t }}</p>
              </div>
            } @else {
              @for (n of items(); track n.id) {
                <div class="item" [class.unread]="!n.isRead" (click)="markRead(n)">
                  <div class="item-icon" [class.warn]="n.type === 1" [class.alert]="n.type === 4">
                    <span class="material-icons-round">{{ iconFor(n.type) }}</span>
                  </div>
                  <div class="item-body">
                    <div class="item-title">{{ n.title }}</div>
                    <div class="item-msg">{{ n.message }}</div>
                    <div class="item-time">{{ n.createdAt | date:'short' }}</div>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .bell-wrap { position: relative; }
    .dot {
      position: absolute;
      top: -4px; inset-inline-end: -4px;
      min-width: 18px; height: 18px;
      padding: 0 5px;
      background: var(--red);
      color: #fff;
      border-radius: 999px;
      font-size: 10.5px;
      font-weight: 700;
      display: grid; place-items: center;
      box-shadow: 0 0 0 2px var(--bg-deep), var(--red-glow);
      animation: fadeUp .4s var(--ease);
    }
    .panel {
      position: absolute;
      top: calc(100% + 12px); inset-inline-end: 0;
      width: 380px; max-width: 90vw;
      max-height: 70vh; overflow: hidden;
      display: flex; flex-direction: column;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius);
      box-shadow: var(--shadow-2);
      z-index: 100;
    }
    .panel-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
    }
    .panel-head h3 { font-size: 14px; }
    .panel-body { overflow-y: auto; flex: 1; }
    .loading { padding: 32px; display: grid; place-items: center; }
    .empty { padding: 40px 24px; text-align: center; color: var(--text-4); }
    .empty .material-icons-round { font-size: 32px; opacity: .4; margin-bottom: 8px; display: block; }
    .item {
      display: flex; gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      cursor: pointer;
      transition: background var(--duration) var(--ease);
    }
    .item:hover { background: var(--bg-glass); }
    .item.unread { background: rgba(46,160,255,.04); }
    .item.unread::before {
      content: ''; width: 6px; height: 6px; border-radius: 50%;
      background: var(--blue);
      box-shadow: var(--blue-glow);
      align-self: center;
      margin-inline-end: -6px;
    }
    .item-icon {
      width: 34px; height: 34px; border-radius: 9px;
      background: var(--bg-glass);
      display: grid; place-items: center;
      color: var(--silver-2);
      flex-shrink: 0;
    }
    .item-icon .material-icons-round { font-size: 18px; }
    .item-icon.warn { background: var(--orange-soft); color: var(--orange); }
    .item-icon.alert { background: var(--red-soft); color: var(--red); }
    .item-body { min-width: 0; flex: 1; }
    .item-title { color: var(--text-1); font-weight: 600; font-size: 13px; }
    .item-msg { color: var(--text-3); font-size: 12.5px; margin-top: 2px; line-height: 1.45; }
    .item-time { color: var(--text-4); font-size: 11px; margin-top: 6px; }
  `]
})
export class NotificationsBellComponent {
  private api = inject(ApiService);
  private host = inject(ElementRef<HTMLElement>);

  open = signal(false);
  loading = signal(false);
  items = signal<NotificationDto[]>([]);
  unreadCount = signal(0);

  constructor() {
    this.refresh();
  }

  toggle() {
    this.open.update(v => !v);
    if (this.open()) this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.api.getNotifications().subscribe({
      next: (list) => {
        this.items.set(list);
        this.unreadCount.set(list.filter(n => !n.isRead).length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  markRead(n: NotificationDto) {
    if (n.isRead) return;
    this.api.markRead(n.id).subscribe(() => this.refresh());
  }

  markAllRead() {
    this.api.markAllRead().subscribe(() => this.refresh());
  }

  iconFor(t: number): string {
    return t === 1 ? 'event_busy' : t === 2 ? 'payments' : t === 4 ? 'warning_amber' : 'campaign';
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (this.open() && !this.host.nativeElement.contains(e.target as Node)) {
      this.open.set(false);
    }
  }
}
