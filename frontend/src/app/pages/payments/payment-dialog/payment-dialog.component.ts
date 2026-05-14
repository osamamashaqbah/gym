import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { MembershipDto, PaymentMethod } from '../../../core/models/models';

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog-backdrop" (click)="close.emit()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <h2>Add Payment</h2>
        <p style="color:var(--text-4);margin-top:4px;font-size:13px;">
          Record a new payment for this member.
        </p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="col gap-4" style="margin-top:20px;">
          @if (memberships.length > 0) {
            <div class="form-field">
              <label>Apply to membership</label>
              <select class="input" formControlName="membershipId">
                <option [ngValue]="null">— Standalone payment —</option>
                @for (m of memberships; track m.id) {
                  <option [ngValue]="m.id">{{ m.planName }} (balance: {{ m.remainingBalance | number:'1.2-2' }} JOD)</option>
                }
              </select>
            </div>
          }
          <div class="form-field">
            <label>Amount (JOD) *</label>
            <input class="input" type="number" step="0.01" min="0.01" formControlName="amount" autofocus />
          </div>
          <div class="form-field">
            <label>Method *</label>
            <div class="method-picker">
              @for (m of methods; track m.value) {
                <label class="method" [class.selected]="form.value.method === m.value">
                  <input type="radio" formControlName="method" [value]="m.value" />
                  <span class="material-icons-round">{{ m.icon }}</span>
                  <span>{{ m.label }}</span>
                </label>
              }
            </div>
          </div>
          <div class="form-field">
            <label>Reference Number</label>
            <input class="input" formControlName="referenceNumber" placeholder="optional" />
          </div>
          <div class="form-field">
            <label>Notes</label>
            <textarea class="input" formControlName="notes" rows="2"></textarea>
          </div>

          <div class="dialog-actions">
            <button type="button" class="btn btn-ghost" (click)="close.emit()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
              @if (saving()) { <span class="spinner" style="border-top-color:#0a0a0c;border-color:#0a0a0c40"></span> }
              @else { Record payment }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .method-picker { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .method {
      cursor: pointer;
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 14px 8px;
      border-radius: 11px;
      border: 1px solid var(--border);
      background: var(--bg-glass);
      transition: all var(--duration) var(--ease);
    }
    .method input { display: none; }
    .method .material-icons-round { font-size: 22px; color: var(--silver-3); }
    .method:hover { border-color: var(--border-strong); }
    .method.selected {
      border-color: var(--silver-3);
      background: linear-gradient(135deg, rgba(216,218,223,.12), rgba(216,218,223,.04));
      color: var(--text-1);
    }
    .method.selected .material-icons-round { color: var(--silver-1); }
  `]
})
export class PaymentDialogComponent {
  @Input({ required: true }) memberId!: string;
  @Input() memberships: MembershipDto[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private api = inject(ApiService);

  saving = signal(false);

  methods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 1, label: 'Cash',  icon: 'payments' },
    { value: 2, label: 'Visa',  icon: 'credit_card' },
    { value: 3, label: 'CliQ',  icon: 'qr_code_2' }
  ];

  form = this.fb.nonNullable.group({
    membershipId: [null as string | null],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    method: [1 as PaymentMethod, Validators.required],
    referenceNumber: [''],
    notes: ['']
  });

  submit() {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.api.createPayment({ ...this.form.getRawValue(), memberId: this.memberId } as any).subscribe({
      next: () => { this.saving.set(false); this.saved.emit(); },
      error: () => this.saving.set(false)
    });
  }
}
