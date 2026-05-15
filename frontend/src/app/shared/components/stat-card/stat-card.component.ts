import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stat" [class]="'tone-' + tone" [class.loading]="loading">
      <div class="stat-icon">
        <span class="material-icons-round">{{ icon }}</span>
      </div>
      <div class="stat-body">
        <div class="stat-label">{{ label }}</div>
        <div class="stat-value">
          @if (loading) { <span class="placeholder"></span> }
          @else { {{ prefix }}{{ value | number:'1.0-2' }}{{ suffix }} }
        </div>
        @if (subLabel) { <div class="stat-sub">{{ subLabel }}</div> }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .stat {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 22px 22px;
      background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
      border: 1px solid var(--border);
      border-radius: var(--radius);
      backdrop-filter: blur(16px);
      box-shadow: var(--shadow-glow);
      overflow: hidden;
      transition: transform var(--duration) var(--ease), border-color var(--duration) var(--ease);
    }
    .stat:hover { transform: translateY(-2px); border-color: var(--border-strong); }
    .stat::after {
      content: '';
      position: absolute;
      top: -1px; right: -1px;
      width: 80px; height: 80px;
      background: radial-gradient(circle, var(--tone-glow), transparent 70%);
      opacity: .6;
      pointer-events: none;
    }
    .stat-icon {
      width: 44px; height: 44px;
      border-radius: 12px;
      display: grid; place-items: center;
      background: var(--tone-bg);
      color: var(--tone-color);
      flex-shrink: 0;
      border: 1px solid var(--tone-border);
    }
    .stat-icon .material-icons-round { font-size: 22px; }
    .stat-body { min-width: 0; flex: 1; }
    .stat-label {
      font-size: 11.5px;
      letter-spacing: .14em;
      text-transform: uppercase;
      color: var(--text-4);
      font-weight: 600;
    }
    .stat-value {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 28px;
      color: var(--text-1);
      letter-spacing: -.01em;
      margin-top: 6px;
      line-height: 1.1;
    }
    .stat-sub {
      font-size: 12px;
      color: var(--text-4);
      margin-top: 6px;
    }
    .placeholder {
      display: inline-block;
      width: 60px; height: 22px;
      border-radius: 6px;
      background: linear-gradient(90deg, var(--surface-2), var(--surface-3), var(--surface-2));
      background-size: 200% 100%;
      animation: shimmer 1.4s linear infinite;
    }
    @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

    .tone-silver { --tone-bg: var(--silver-grad-soft); --tone-color: var(--silver-1); --tone-border: var(--border-strong); --tone-glow: rgba(216,218,223,0.15); }
    .tone-blue   { --tone-bg: var(--blue-soft);   --tone-color: var(--blue);   --tone-border: rgba(46,160,255,.3);  --tone-glow: rgba(46,160,255,0.2); }
    .tone-green  { --tone-bg: var(--green-soft);  --tone-color: var(--green);  --tone-border: rgba(31,209,130,.3);  --tone-glow: rgba(31,209,130,0.2); }
    .tone-red    { --tone-bg: var(--red-soft);    --tone-color: var(--red);    --tone-border: rgba(255,71,87,.3);   --tone-glow: rgba(255,71,87,0.2); }
    .tone-orange { --tone-bg: var(--orange-soft); --tone-color: var(--orange); --tone-border: rgba(255,166,48,.3);  --tone-glow: rgba(255,166,48,0.2); }
  `]
})
export class StatCardComponent {
  @Input({ required: true }) label!: string;
  @Input() value: number = 0;
  @Input() icon = 'insights';
  @Input() prefix = '';
  @Input() suffix = '';
  @Input() subLabel = '';
  @Input() tone: 'silver' | 'blue' | 'green' | 'red' | 'orange' = 'silver';
  @Input() loading = false;
}
