import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { MemberDto, MembershipPlanDto } from '../../../core/models/models';

@Component({
  selector: 'app-member-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog-backdrop" (click)="close.emit()">
      <div class="dialog wide" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <h2>{{ member ? 'Edit Member' : 'New Member' }}</h2>
        <p style="color: var(--text-4); margin-top: 4px; font-size: 13px;">
          {{ member ? 'Update member information' : 'Add a new member to your gym' }}
        </p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
          <div class="form-field span-2">
            <label>Full Name *</label>
            <input class="input" formControlName="fullName" placeholder="e.g. Omar Khoury" />
          </div>
          <div class="form-field">
            <label>Phone Number *</label>
            <input class="input" formControlName="phoneNumber" placeholder="+962 79 ..." />
          </div>
          <div class="form-field">
            <label>Email</label>
            <input class="input" type="email" formControlName="email" placeholder="optional" />
          </div>
          <div class="form-field">
            <label>Gender *</label>
            <select class="input" formControlName="gender">
              <option [ngValue]="1">Male</option>
              <option [ngValue]="2">Female</option>
              <option [ngValue]="3">Other</option>
            </select>
          </div>
          <div class="form-field">
            <label>Age *</label>
            <input class="input" type="number" formControlName="age" min="5" max="120" />
          </div>
          <div class="form-field span-2">
            <label>Address</label>
            <input class="input" formControlName="address" placeholder="optional" />
          </div>
          @if (!member) {
            <div class="form-field span-2">
              <label>Initial Plan</label>
              <select class="input" formControlName="planId">
                <option [ngValue]="null">— No plan (assign later) —</option>
                @for (p of plans(); track p.id) {
                  <option [ngValue]="p.id">{{ p.name }} · {{ p.price | number:'1.2-2' }} JOD · {{ p.durationInMonths }} mo</option>
                }
              </select>
            </div>
          }
          <div class="form-field span-2">
            <label>Notes</label>
            <textarea class="input" formControlName="notes" rows="3" placeholder="Health info, preferences, etc."></textarea>
          </div>

          <div class="dialog-actions span-2" style="margin-top: 8px;">
            <button type="button" class="btn btn-ghost" (click)="close.emit()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
              @if (saving()) { <span class="spinner" style="border-top-color:#0a0a0c;border-color:#0a0a0c40"></span> }
              @else { {{ member ? 'Save changes' : 'Create member' }} }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .dialog.wide { width: min(720px, 92vw); }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 24px;
    }
    .span-2 { grid-column: 1 / -1; }
    @media (max-width: 600px) {
      .form-grid { grid-template-columns: 1fr; }
      .span-2 { grid-column: 1; }
    }
  `]
})
export class MemberFormDialogComponent implements OnInit {
  @Input() member: MemberDto | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<MemberDto>();

  private fb = inject(FormBuilder);
  private api = inject(ApiService);

  saving = signal(false);
  plans = signal<MembershipPlanDto[]>([]);

  form: FormGroup = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(150)]],
    phoneNumber: ['', [Validators.required]],
    gender: [1, Validators.required],
    age: [25, [Validators.required, Validators.min(5), Validators.max(120)]],
    email: [''],
    address: [''],
    notes: [''],
    planId: [null as string | null]
  });

  ngOnInit() {
    this.api.getPlans().subscribe(p => this.plans.set(p.filter(x => x.isActive)));
    if (this.member) {
      this.form.patchValue(this.member);
    }
  }

  submit() {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    const op$ = this.member
      ? this.api.updateMember(this.member.id, v)
      : this.api.createMember(v);
    op$.subscribe({
      next: (m) => { this.saving.set(false); this.saved.emit(m); },
      error: () => this.saving.set(false)
    });
  }
}
