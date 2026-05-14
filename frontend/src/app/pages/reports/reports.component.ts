import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ChartCardComponent } from '../../shared/components/chart-card/chart-card.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { DashboardCharts, DashboardStats } from '../../core/models/models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, DecimalPipe, ReactiveFormsModule, StatCardComponent, ChartCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Reports & Analytics</h1>
          <p class="page-subtitle">Insights and exports for your gym operations.</p>
        </div>
      </div>

      <div class="kpi-grid">
        <app-stat-card label="Total Members"      [value]="stats()?.totalMembers ?? 0"        icon="groups"        tone="silver" [loading]="loading()" />
        <app-stat-card label="Active"             [value]="stats()?.activeMembers ?? 0"       icon="trending_up"   tone="green" [loading]="loading()" />
        <app-stat-card label="Expired"            [value]="stats()?.expiredMemberships ?? 0"  icon="event_busy"    tone="red" [loading]="loading()" />
        <app-stat-card label="Revenue YTD"        [value]="stats()?.revenueThisYear ?? 0"     icon="leaderboard"   tone="blue" suffix=" JOD" [loading]="loading()" />
      </div>

      <div class="charts-grid">
        <app-chart-card title="Monthly Revenue" subtitle="Last 12 months" type="line" label="Revenue (JOD)" color="#2ea0ff"
          [labels]="revenueLabels()" [data]="revenueData()" [height]="300" />
        <app-chart-card title="Membership Distribution" type="doughnut"
          [labels]="distributionLabels()" [data]="distributionData()" [height]="300" />
      </div>

      <div class="card export-card">
        <h3>Exports</h3>
        <p style="color:var(--text-4);margin-top:6px;font-size:13px;">Download CSV reports (open in Excel, Numbers, Google Sheets).</p>

        <form [formGroup]="filterForm" class="row gap-3" style="margin-top: 16px; flex-wrap: wrap;">
          <div class="form-field"><label>From</label><input class="input" type="date" formControlName="from" /></div>
          <div class="form-field"><label>To</label><input class="input" type="date" formControlName="to" /></div>
        </form>

        <div class="exports">
          <a class="export-row" [href]="api.reportMembersUrl()" target="_blank" download>
            <span class="material-icons-round">groups</span>
            <div class="grow">
              <div class="export-name">Members report</div>
              <div class="export-desc">All active members with current plan and status</div>
            </div>
            <span class="badge">CSV</span>
          </a>
          <a class="export-row" [href]="paymentsUrl()" target="_blank" download>
            <span class="material-icons-round">payments</span>
            <div class="grow">
              <div class="export-name">Payments report</div>
              <div class="export-desc">Payments in selected date range</div>
            </div>
            <span class="badge">CSV</span>
          </a>
          <a class="export-row" [href]="attendanceUrl()" target="_blank" download>
            <span class="material-icons-round">event_available</span>
            <div class="grow">
              <div class="export-name">Attendance report</div>
              <div class="export-desc">Check-ins in selected date range</div>
            </div>
            <span class="badge">CSV</span>
          </a>
        </div>
      </div>

      <div class="card" style="margin-top: 18px;">
        <div class="row between" style="margin-bottom: 12px;">
          <h3>Print this page</h3>
          <button class="btn btn-ghost" (click)="print()">
            <span class="material-icons-round">print</span> Print / Save as PDF
          </button>
        </div>
        <p style="color:var(--text-4);font-size:13px;">Use your browser's native PDF export to save these analytics as a PDF.</p>
      </div>
    </div>
  `,
  styles: [`
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; margin-bottom: 22px; }
    .charts-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 18px; margin-bottom: 22px; }
    @media (max-width: 1100px) { .charts-grid { grid-template-columns: 1fr; } }

    .export-card { padding: 24px; }
    .exports { display: flex; flex-direction: column; gap: 8px; margin-top: 18px; }
    .export-row {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 16px;
      border-radius: 12px;
      background: var(--bg-glass);
      border: 1px solid var(--border);
      color: var(--text-1);
      transition: all var(--duration) var(--ease);
    }
    .export-row:hover { background: var(--bg-glass-2); border-color: var(--border-strong); transform: translateX(2px); }
    .export-row > .material-icons-round { color: var(--silver-2); font-size: 22px; }
    .export-name { font-weight: 600; }
    .export-desc { color: var(--text-4); font-size: 12.5px; margin-top: 2px; }

    @media print {
      :host { background: white; color: black; }
    }
  `]
})
export class ReportsComponent {
  api = inject(ApiService);
  private fb = inject(FormBuilder);

  loading = signal(true);
  stats = signal<DashboardStats | null>(null);
  charts = signal<DashboardCharts | null>(null);

  filterForm = this.fb.nonNullable.group({
    from: [''],
    to: ['']
  });

  revenueLabels = () => this.charts()?.revenueLast12Months.map(p => p.label) ?? [];
  revenueData   = () => this.charts()?.revenueLast12Months.map(p => p.revenue) ?? [];
  distributionLabels = () => this.charts()?.membershipDistribution.map(p => p.status) ?? [];
  distributionData   = () => this.charts()?.membershipDistribution.map(p => p.count) ?? [];

  constructor() {
    forkJoin({
      stats: this.api.dashboardStats(),
      charts: this.api.dashboardCharts()
    }).subscribe(r => {
      this.stats.set(r.stats);
      this.charts.set(r.charts);
      this.loading.set(false);
    });
  }

  paymentsUrl() {
    const v = this.filterForm.getRawValue();
    return this.api.reportPaymentsUrl(
      v.from ? new Date(v.from).toISOString() : undefined,
      v.to ? new Date(v.to).toISOString() : undefined);
  }
  attendanceUrl() {
    const v = this.filterForm.getRawValue();
    return this.api.reportAttendanceUrl(
      v.from ? new Date(v.from).toISOString() : undefined,
      v.to ? new Date(v.to).toISOString() : undefined);
  }

  print() { window.print(); }
}
