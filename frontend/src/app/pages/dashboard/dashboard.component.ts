import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ChartCardComponent } from '../../shared/components/chart-card/chart-card.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { DashboardCharts, DashboardStats, MemberDto, PaymentDto, PaymentMethodLabels } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, DecimalPipe, StatCardComponent, ChartCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  loading = signal(true);
  user = this.auth.user;

  stats = signal<DashboardStats | null>(null);
  charts = signal<DashboardCharts | null>(null);
  recentMembers = signal<MemberDto[]>([]);
  recentPayments = signal<PaymentDto[]>([]);

  greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  });

  PaymentMethodLabels = PaymentMethodLabels;

  // Cached chart data
  revenueLabels = computed(() => this.charts()?.revenueLast12Months.map(p => p.label) ?? []);
  revenueData   = computed(() => this.charts()?.revenueLast12Months.map(p => p.revenue) ?? []);
  attendanceLabels = computed(() => this.charts()?.attendanceLast7Days.map(p => p.label) ?? []);
  attendanceData   = computed(() => this.charts()?.attendanceLast7Days.map(p => p.count) ?? []);
  distributionLabels = computed(() => this.charts()?.membershipDistribution.map(p => p.status) ?? []);
  distributionData   = computed(() => this.charts()?.membershipDistribution.map(p => p.count) ?? []);
  planLabels = computed(() => this.charts()?.popularPlans.map(p => p.planName) ?? []);
  planData   = computed(() => this.charts()?.popularPlans.map(p => p.count) ?? []);

  constructor() {
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    forkJoin({
      stats: this.api.dashboardStats(),
      charts: this.api.dashboardCharts(),
      members: this.api.recentMembers(5),
      payments: this.api.recentPayments(5)
    }).subscribe({
      next: (r) => {
        this.stats.set(r.stats);
        this.charts.set(r.charts);
        this.recentMembers.set(r.members);
        this.recentPayments.set(r.payments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
