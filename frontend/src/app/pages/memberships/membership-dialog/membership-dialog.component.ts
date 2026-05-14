import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { MembershipPlanDto } from '../../../core/models/models';
import { TPipe } from '../../../core/i18n/t.pipe';

@Component({
  selector: 'app-membership-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog-backdrop" (click)="close.emit()">
      <div class="dialog wide" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <h2>{{ 'membershipDialog.title' | t }}</h2>
        <p style="color:var(--text-4);margin-top:4px;font-size:13px;">
          {{ 'membershipDialog.subtitle' | t }}
        </p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid" style="margin-top:24px;">
          <div class="form-field span-2">
            <label>{{ 'membershipDialog.plan' | t }} *</label>
            <div class="plan-cards">
              @for (p of plans(); track p.id) {
                <label class="plan-card" [class.selected]="form.value.planId === p.id">
                  <input type="radio" formControlName="planId" [value]="p.id" />
                  <div class="plan-name">{{ p.name }}</div>
                  <div class="plan-price">{{ p.price | number:'1.2-2' }} <span>JOD</span></div>
                  <div class="plan-meta">{{ p.durationInMonths }} {{ (p.durationInMonths === 1 ? 'planDuration.month' : 'planDuration.months') | t }}</div>
                </label>
              }
            </div>
          </div>

          <div class="form-field">
            <label>{{ 'membershipDialog.startDate' | t }} *</label>
            <input class="input" type="date" formControlName="startDate" />
          </div>
          <div class="form-field">
            <label>{{ 'membershipDialog.customPrice' | t }}</label>
            <input class="input" type="number" step="0.01" formControlName="customPrice" [placeholder]="'membershipDialog.customPlaceholder' | t" />
          </div>
          <div class="form-field">
            <label>{{ 'membershipDialog.initialPayment' | t }}</label>
            <input class="input" type="number" step="0.01" formControlName="initialPayment" />
          </div>
          <div class="form-field">
            <label>{{ 'membershipDialog.paymentMethod' | t }}</label>
            <select class="input" formControlName="paymentMethod">
              <option [ngValue]="1">{{ 'paymentMethod.cash' | t }}</option>
              <option [ngValue]="2">{{ 'paymentMethod.visa' | t }}</option>
              <option [ngValue]="3">{{ 'paymentMethod.cliq' | t }}</option>
            </select>
          </div>
          <div class="form-field span-2">
            <label>{{ 'membershipDialog.notes' | t }}</label>
            <textarea class="input" formControlName="notes" rows="2"></textarea>
          </div>

          <div class="dialog-actions span-2">
            <button type="button" class="btn btn-ghost" (click)="close.emit()">{{ 'common.cancel' | t }}</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
              @if (saving()) { <span class="spinner" style="border-top-color:#0a0a0c;border-color:#0a0a0c40"></span> }
              @else { {{ 'membershipDialog.create' | t }} }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .dialog.wide { width: min(720px, 92vw); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .span-2 { grid-column: 1 / -1; }
    .plan-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
    .plan-card {
      cursor: pointer; padding: 14px; border-radius: 12px;
      border: 1px solid var(--border); background: var(--bg-glass);
      transition: all var(--duration) var(--ease);
      position: relative;
    }
    .plan-card input { position: absolute; opacity: 0; pointer-events: none; }
    .plan-card:hover { border-color: var(--border-strong); background: var(--bg-glass-2); }
    .plan-card.selected {
      border-color: var(--silver-3);
      background: linear-gradient(135deg, rgba(216,218,223,.12), rgba(216,218,223,.04));
      box-shadow: 0 0 0 3px rgba(216,218,223,.1);
    }
    .plan-card.selected::after {
      content: 'check_circle';
      font-family: 'Material Icons Round';
      position: absolute; top: 8px; inset-inline-end: 8px;
      color: var(--silver-1); font-size: 18px;
    }
    .plan-name { font-weight: 600; color: var(--text-1); font-size: 13.5px; margin-bottom: 4px; }
    .plan-price { font-family: 'Space Grotesk',sans-serif; font-size: 22px; font-weight: 700; color: var(--text-1); }
    .plan-price span { font-size: 11px; color: var(--text-4); margin-inline-start: 2px; font-weight: 500; }
    .plan-meta { color: var(--text-4); font-size: 11.5px; margin-top: 2px; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } .span-2 { grid-column: 1; } }
  `]
})
export class MembershipDialogComponent implements OnInit {
  @Input({ required: true }) memberId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private api = inject(ApiService);

  saving = signal(false);
  plans = signal<MembershipPlanDto[]>([]);

  form = this.fb.nonNullable.group({
    planId: ['', Validators.required],
    startDate: [new Date().toISOString().substring(0, 10), Validators.required],
    customPrice: [null as number | null],
    initialPayment: [0, [Validators.required, Validators.min(0)]],
    paymentMethod: [1, Validators.required],
    notes: ['']
  });

  ngOnInit() {
    this.api.getPlans().subscribe(p => this.plans.set(p.filter(x => x.isActive)));
  }

  submit() {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.api.createMembership({ ...v, memberId: this.memberId, startDate: new Date(v.startDate).toISOString() } as any)
      .subscribe({
        next: () => { this.saving.set(false); this.saved.emit(); },
        error: () => this.saving.set(false)
      });
  }
}
