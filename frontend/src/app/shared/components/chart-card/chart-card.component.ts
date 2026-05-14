import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card chart-card">
      <div class="head">
        <div>
          <div class="card-title">{{ title }}</div>
          @if (subtitle) { <div class="sub">{{ subtitle }}</div> }
        </div>
        <ng-content></ng-content>
      </div>
      <div class="canvas-wrap" [style.height.px]="height">
        <canvas #cv></canvas>
      </div>
    </div>
  `,
  styles: [`
    .chart-card { padding: 22px; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .sub { color: var(--text-4); font-size: 12px; margin-top: 4px; }
    .canvas-wrap { position: relative; }
  `]
})
export class ChartCardComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('cv', { static: true }) cv!: ElementRef<HTMLCanvasElement>;

  @Input({ required: true }) title!: string;
  @Input() subtitle = '';
  @Input() height = 260;
  @Input() type: 'line' | 'bar' | 'doughnut' = 'line';
  @Input() labels: string[] = [];
  @Input() data: number[] = [];
  @Input() label = '';
  @Input() color = '#2ea0ff';

  private chart?: Chart;

  ngAfterViewInit(): void {
    this.render();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart) this.render();
  }
  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(): void {
    this.chart?.destroy();
    const ctx = this.cv.nativeElement.getContext('2d');
    if (!ctx) return;

    let dataset: any;
    if (this.type === 'doughnut') {
      const palette = ['#2ea0ff', '#1fd182', '#ffa630', '#ff4757', '#a9adb6'];
      dataset = {
        data: this.data,
        backgroundColor: this.labels.map((_, i) => palette[i % palette.length] + 'cc'),
        borderColor: '#0a0a0c',
        borderWidth: 2,
        hoverBorderWidth: 3,
      };
    } else if (this.type === 'bar') {
      dataset = {
        label: this.label,
        data: this.data,
        backgroundColor: this.color + '66',
        borderColor: this.color,
        borderWidth: 1,
        borderRadius: 8,
        hoverBackgroundColor: this.color + 'cc',
      };
    } else {
      // line with gradient fill
      const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, this.color + '55');
      gradient.addColorStop(1, this.color + '00');
      dataset = {
        label: this.label,
        data: this.data,
        borderColor: this.color,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: this.color,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      };
    }

    this.chart = new Chart(ctx, {
      type: this.type,
      data: { labels: this.labels, datasets: [dataset] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: this.type === 'doughnut', position: 'bottom', labels: { color: '#b6b8c0', padding: 14, usePointStyle: true } },
          tooltip: {
            backgroundColor: '#14141a',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleColor: '#fff',
            bodyColor: '#e6e7ec',
            padding: 12,
            cornerRadius: 8,
            displayColors: this.type === 'doughnut',
          }
        },
        scales: this.type === 'doughnut' ? {} : {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)', drawTicks: false },
            ticks: { color: '#7e828c', font: { size: 11 } },
            border: { display: false }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)', drawTicks: false },
            ticks: { color: '#7e828c', font: { size: 11 } },
            border: { display: false },
            beginAtZero: true,
          }
        },
        animation: { duration: 700, easing: 'easeOutQuart' }
      }
    });
  }
}
