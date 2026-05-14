import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AttendanceDto, MemberDto, PagedResult } from '../../core/models/models';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Attendance</h1>
          <p class="page-subtitle">Search a member and check them in instantly.</p>
        </div>
      </div>

      <div class="checkin-grid">
        <div class="card checkin-card">
          <div class="checkin-icon">
            <span class="material-icons-round">how_to_reg</span>
          </div>
          <h2>Quick Check-in</h2>
          <p style="color:var(--text-4);margin-top:6px;">Type a name or phone to find a member.</p>

          <div class="search-shell" style="margin-top:18px;">
            <span class="material-icons-round search-icon">search</span>
            <input class="input lg" placeholder="Search member..." [value]="query()" (input)="onSearch($event)" autofocus />
          </div>

          @if (query() && results().length > 0) {
            <div class="results">
              @for (m of results(); track m.id) {
                <div class="result-item" [class.expired]="m.currentStatus !== 1">
                  <div class="avatar">{{ m.fullName.charAt(0) }}</div>
                  <div class="grow">
                    <div class="name">{{ m.fullName }}</div>
                    <div class="meta">{{ m.phoneNumber }} · {{ m.currentPlanName || 'No plan' }}</div>
                  </div>
                  <span class="badge"
                    [class.badge-active]="m.currentStatus === 1"
                    [class.badge-expired]="m.currentStatus === 2"
                    [class.badge-frozen]="m.currentStatus === 3"
                    [class.badge-cancelled]="!m.currentStatus || m.currentStatus === 4">
                    @switch (m.currentStatus) {
                      @case (1) { Active }
                      @case (2) { Expired }
                      @case (3) { Frozen }
                      @case (4) { Cancelled }
                      @default  { No Plan }
                    }
                  </span>
                  <button class="btn btn-success btn-sm" (click)="checkIn(m)" [disabled]="m.currentStatus !== 1 || checking() === m.id">
                    @if (checking() === m.id) { <span class="spinner" style="width:14px;height:14px;border-width:2px;"></span> }
                    @else { <span class="material-icons-round">check</span> Check in }
                  </button>
                </div>
              }
            </div>
          } @else if (query() && !searching()) {
            <div class="empty-state" style="padding:32px;">
              <span class="material-icons-round">person_search</span>
              <p>No matches found.</p>
            </div>
          }
        </div>

        <div class="card today-card">
          <div class="row between" style="margin-bottom: 12px;">
            <h3>Today's Check-ins</h3>
            <span class="badge badge-active">{{ today().length }}</span>
          </div>
          @if (today().length === 0) {
            <div class="empty-state" style="padding:24px;">
              <span class="material-icons-round">event_available</span>
              <p>Nobody has checked in yet.</p>
            </div>
          } @else {
            <div class="today-list">
              @for (a of today(); track a.id) {
                <div class="today-item">
                  <div class="avatar sm">{{ a.memberName.charAt(0) }}</div>
                  <div class="grow">
                    <div class="name">{{ a.memberName }}</div>
                    <div class="meta">{{ a.checkInTime | date:'shortTime' }}</div>
                  </div>
                  <span class="material-icons-round check">check_circle</span>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <div class="card" style="margin-top: 22px;">
        <h3 style="margin-bottom:14px;">Recent Attendance</h3>
        @if (recent().items.length === 0) {
          <div class="empty-state"><span class="material-icons-round">history</span><p>No attendance records.</p></div>
        } @else {
          <table class="table">
            <thead><tr><th>Member</th><th>Check-in Time</th><th>Notes</th></tr></thead>
            <tbody>
              @for (a of recent().items; track a.id) {
                <tr>
                  <td>
                    <div class="name-cell">
                      <div class="avatar">{{ a.memberName.charAt(0) }}</div>
                      <span style="color:var(--text-1);font-weight:600;">{{ a.memberName }}</span>
                    </div>
                  </td>
                  <td>{{ a.checkInTime | date:'medium' }}</td>
                  <td style="color:var(--text-4);">{{ a.notes || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
  styles: [`
    .checkin-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 18px; }
    @media (max-width: 1000px) { .checkin-grid { grid-template-columns: 1fr; } }
    .checkin-card { padding: 28px; }
    .checkin-icon {
      width: 56px; height: 56px;
      border-radius: 16px;
      background: var(--green-soft);
      color: var(--green);
      display: grid; place-items: center;
      margin-bottom: 14px;
      border: 1px solid rgba(31,209,130,.3);
    }
    .checkin-icon .material-icons-round { font-size: 28px; }
    .search-shell { position: relative; }
    .search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-4); }
    .input.lg { padding: 16px 16px 16px 48px; font-size: 15px; }
    .results { margin-top: 18px; display: flex; flex-direction: column; gap: 8px; }
    .result-item {
      display: flex; align-items: center; gap: 14px;
      padding: 12px 14px;
      background: var(--bg-glass);
      border: 1px solid var(--border);
      border-radius: 12px;
      transition: all var(--duration) var(--ease);
    }
    .result-item:hover { border-color: var(--border-strong); }
    .avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--silver-grad); color: #0a0a0c; display: grid; place-items: center; font-weight: 700; font-size: 13px; border: 1px solid #d8dadf; }
    .avatar.sm { width: 32px; height: 32px; font-size: 12px; }
    .name { color: var(--text-1); font-weight: 600; }
    .meta { color: var(--text-4); font-size: 12px; margin-top: 2px; }
    .name-cell { display: flex; align-items: center; gap: 12px; }
    .today-list { display: flex; flex-direction: column; gap: 6px; max-height: 420px; overflow-y: auto; }
    .today-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px;
      border-radius: 10px;
      background: var(--bg-glass);
      border: 1px solid var(--border);
    }
    .check { color: var(--green); font-size: 22px; }
  `]
})
export class AttendanceComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  query = signal('');
  searching = signal(false);
  checking = signal<string | null>(null);
  results = signal<MemberDto[]>([]);
  today = signal<AttendanceDto[]>([]);
  recent = signal<PagedResult<AttendanceDto>>({ items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 });

  private subj = new Subject<string>();

  constructor() {
    this.subj
      .pipe(debounceTime(300), distinctUntilChanged(), switchMap(s => {
        this.searching.set(true);
        return this.api.getMembers({ search: s, pageSize: 8 });
      }))
      .subscribe({
        next: (r) => { this.results.set(r.items); this.searching.set(false); },
        error: () => this.searching.set(false)
      });
    this.loadToday();
    this.loadRecent();
  }

  onSearch(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    this.query.set(v);
    if (!v.trim()) { this.results.set([]); return; }
    this.subj.next(v);
  }

  loadToday() {
    const today = new Date().toISOString().substring(0, 10);
    this.api.getAttendance({ date: today, pageSize: 100 }).subscribe(r => this.today.set(r.items));
  }

  loadRecent() {
    this.api.getAttendance({ pageSize: 20 }).subscribe(r => this.recent.set(r));
  }

  checkIn(m: MemberDto) {
    if (m.currentStatus !== 1) return;
    this.checking.set(m.id);
    this.api.checkIn(m.id).subscribe({
      next: () => {
        this.toast.success(`${m.fullName} checked in!`);
        this.checking.set(null);
        this.query.set('');
        this.results.set([]);
        this.loadToday();
        this.loadRecent();
      },
      error: () => this.checking.set(null)
    });
  }
}
