import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { MemberDto, MembershipPlanDto } from '../../../core/models/models';
import { TPipe } from '../../../core/i18n/t.pipe';

@Component({
  selector: 'app-member-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog-backdrop" (click)="close.emit()">
      <div class="dialog wide" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <h2>{{ (member ? 'memberForm.edit' : 'memberForm.new') | t }}</h2>
        <p style="color: var(--text-4); margin-top: 4px; font-size: 13px;">
          {{ (member ? 'memberForm.editSubtitle' : 'memberForm.newSubtitle') | t }}
        </p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
          <div class="form-field span-2">
            <label>{{ 'memberForm.fullName' | t }} *</label>
            <input class="input" formControlName="fullName" [placeholder]="'memberForm.fullNamePlaceholder' | t" />
          </div>
          <div class="form-field">
            <label>{{ 'memberForm.phoneNumber' | t }} *</label>
            <input class="input" formControlName="phoneNumber" [placeholder]="'memberForm.phonePlaceholder' | t" />
          </div>
          <div class="form-field">
            <label>{{ 'memberForm.email' | t }}</label>
            <input class="input" type="email" formControlName="email" [placeholder]="'common.optional' | t" />
          </div>
          <div class="form-field">
            <label>{{ 'memberForm.gender' | t }} *</label>
            <select class="input" formControlName="gender">
              <option [ngValue]="1">{{ 'gender.male' | t }}</option>
              <option [ngValue]="2">{{ 'gender.female' | t }}</option>
              <option [ngValue]="3">{{ 'gender.other' | t }}</option>
            </select>
          </div>
          <div class="form-field">
            <label>{{ 'memberForm.age' | t }} *</label>
            <input class="input" type="number" formControlName="age" min="5" max="120" />
          </div>
          <div class="form-field span-2">
            <label>{{ 'memberForm.address' | t }}</label>
            <input class="input" formControlName="address" [placeholder]="'common.optional' | t" />
          </div>
          @if (!member) {
            <div class="form-field span-2">
              <label>{{ 'memberForm.initialPlan' | t }}</label>
              <select class="input" formControlName="planId">
                <option [ngValue]="null">{{ 'memberForm.noPlanLater' | t }}</option>
                @for (p of plans(); track p.id) {
                  <option [ngValue]="p.id">{{ p.name }} · {{ p.price | number:'1.2-2' }} JOD · {{ p.durationInMonths }} mo</option>
                }
              </select>
            </div>
          }
          <div class="form-field span-2">
            <label>{{ 'memberForm.notes' | t }}</label>
            <textarea class="input" formControlName="notes" rows="3" [placeholder]="'memberForm.notesPlaceholder' | t"></textarea>
          </div>

          <div class="dialog-actions span-2" style="margin-top: 8px;">
            <button type="button" class="btn btn-ghost" (click)="close.emit()">{{ 'common.cancel' | t }}</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
              @if (saving()) { <span class="spinner" style="border-top-color:#0a0a0c;border-color:#0a0a0c40"></span> }
              @else { {{ (member ? 'memberForm.saveChanges' : 'memberForm.create') | t }} }
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
      this.form.patchValue({
        fullName: this.member.fullName,
        phoneNumber: this.member.phoneNumber,
        gender: this.member.gender,
        age: this.member.age,
        email: this.member.email ?? '',
        address: this.member.address ?? '',
        notes: this.member.notes ?? ''
      });
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
