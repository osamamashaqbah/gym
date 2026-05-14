import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ChartCardComponent } from '../../shared/components/chart-card/chart-card.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { TPipe } from '../../core/i18n/t.pipe';
import { DashboardCharts, DashboardStats } from '../../core/models/models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, DecimalPipe, ReactiveFormsModule, StatCardComponent, ChartCardComponent, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ 'reports.title' | t }}</h1>
          <p class="page-subtitle">{{ 'reports.subtitle' | t }}</p>
        </div>
      </div>

      <div class="kpi-grid">
        <app-stat-card [label]="'reports.totalMembers' | t" [value]="stats()?.totalMembers ?? 0"        icon="groups"        tone="silver" [loading]="loading()" />
        <app-stat-card [label]="'reports.active' | t"       [value]="stats()?.activeMembers ?? 0"       icon="trending_up"   tone="green" [loading]="loading()" />
        <app-stat-card [label]="'reports.expired' | t"      [value]="stats()?.expiredMemberships ?? 0"  icon="event_busy"    tone="red" [loading]="loading()" />
        <app-stat-card [label]="'reports.revenueYTD' | t"   [value]="stats()?.revenueThisYear ?? 0"     icon="leaderboard"   tone="blue" suffix=" JOD" [loading]="loading()" />
      </div>

      <div class="charts-grid">
        <app-chart-card [title]="'reports.monthlyRevenue' | t" [subtitle]="'reports.last12Months' | t" type="line" [label]="'dashboard.revenueLabel' | t" color="#2ea0ff"
          [labels]="revenueLabels()" [data]="revenueData()" [height]="300" />
        <app-chart-card [title]="'reports.distribution' | t" type="doughnut"
          [labels]="distributionLabels()" [data]="distributionData()" [height]="300" />
      </div>

      <div class="card export-card">
        <h3>{{ 'reports.exports' | t }}</h3>
        <p style="color:var(--text-4);margin-top:6px;font-size:13px;">{{ 'reports.exportsSub' | t }}</p>

        <form [formGroup]="filterForm" class="row gap-3" style="margin-top: 16px; flex-wrap: wrap;">
          <div class="form-field"><label>{{ 'reports.from' | t }}</label><input class="input" type="date" formControlName="from" /></div>
          <div class="form-field"><label>{{ 'reports.to' | t }}</label><input class="input" type="date" formControlName="to" /></div>
        </form>

        <div class="exports">
          <button class="export-row" (click)="downloadMembers()">
            <span class="material-icons-round">groups</span>
            <div class="grow">
              <div class="export-name">{{ 'reports.membersReport' | t }}</div>
              <div class="export-desc">{{ 'reports.membersReportDesc' | t }}</div>
            </div>
            <span class="badge">CSV</span>
          </button>
          <button class="export-row" (click)="downloadPayments()">
            <span class="material-icons-round">payments</span>
            <div class="grow">
              <div class="export-name">{{ 'reports.paymentsReport' | t }}</div>
              <div class="export-desc">{{ 'reports.paymentsReportDesc' | t }}</div>
            </div>
            <span class="badge">CSV</span>
          </button>
          <button class="export-row" (click)="downloadAttendance()">
            <span class="material-icons-round">event_available</span>
            <div class="grow">
              <div class="export-name">{{ 'reports.attendanceReport' | t }}</div>
              <div class="export-desc">{{ 'reports.attendanceReportDesc' | t }}</div>
            </div>
            <span class="badge">CSV</span>
          </button>
        </div>
      </div>

      <div class="card" style="margin-top: 18px;">
        <div class="row between" style="margin-bottom: 12px;">
          <h3>{{ 'reports.printPage' | t }}</h3>
          <button class="btn btn-ghost" (click)="print()">
            <span class="material-icons-round">print</span> {{ 'reports.printBtn' | t }}
          </button>
        </div>
        <p style="color:var(--text-4);font-size:13px;">{{ 'reports.printDesc' | t }}</p>
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
      width: 100%;
      cursor: pointer;
      text-align: start;
      transition: all var(--duration) var(--ease);
    }
    .export-row:hover { background: var(--bg-glass-2); border-color: var(--border-strong); transform: translateX(2px); }
    html[dir="rtl"] .export-row:hover { transform: translateX(-2px); }
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

  downloadMembers() {
    this.api.reportMembers().subscribe(b => this.saveBlob(b, 'members.csv'));
  }
  downloadPayments() {
    const v = this.filterForm.getRawValue();
    this.api.reportPayments(
      v.from ? new Date(v.from).toISOString() : undefined,
      v.to ? new Date(v.to).toISOString() : undefined
    ).subscribe(b => this.saveBlob(b, 'payments.csv'));
  }
  downloadAttendance() {
    const v = this.filterForm.getRawValue();
    this.api.reportAttendance(
      v.from ? new Date(v.from).toISOString() : undefined,
      v.to ? new Date(v.to).toISOString() : undefined
    ).subscribe(b => this.saveBlob(b, 'attendance.csv'));
  }

  private saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  print() { window.print(); }
}
