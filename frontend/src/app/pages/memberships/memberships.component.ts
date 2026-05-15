import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { MembershipPlanDto, PlanDuration } from '../../core/models/models';

@Component({
  selector: 'app-memberships',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ 'memberships.title' | t }}</h1>
          <p class="page-subtitle">{{ 'memberships.subtitle' | t }}</p>
        </div>
        @if (canEdit()) {
          <button class="btn btn-primary" (click)="openCreate()">
            <span class="material-icons-round">add</span> {{ 'memberships.newPlan' | t }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="card" style="display:grid;place-items:center;padding:60px;">
          <span class="spinner"></span>
        </div>
      } @else {
        <div class="plans-grid">
          @for (p of plans(); track p.id) {
            <div class="plan-card" [class.disabled]="!p.isActive">
              <div class="plan-head">
                <div class="plan-icon"><span class="material-icons-round">{{ iconFor(p.duration) }}</span></div>
                @if (!p.isActive) { <span class="badge badge-cancelled">{{ 'status.inactive' | t }}</span> }
              </div>
              <h2>{{ p.name }}</h2>
              <p class="plan-desc">{{ p.description || '—' }}</p>
              <div class="plan-price">
                <span class="amount">{{ p.price | number:'1.2-2' }}</span>
                <span class="curr">JOD</span>
                <span class="per">/ {{ planDurationKey(p.duration) | t }}</span>
              </div>
              <div class="plan-footer">
                <span class="duration">
                  {{ p.durationInMonths }}
                  {{ (p.durationInMonths === 1 ? 'planDuration.month' : 'planDuration.months') | t }}
                  {{ 'memberships.accessSuffix' | t }}
                </span>
                @if (canEdit()) {
                  <div class="row gap-2">
                    <button class="btn btn-ghost btn-sm" (click)="edit(p)"><span class="material-icons-round">edit</span></button>
                    <button class="btn btn-ghost btn-sm" (click)="del(p)"><span class="material-icons-round">delete</span></button>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      @if (showDialog()) {
        <div class="dialog-backdrop" (click)="closeDialog()">
          <div class="dialog" (click)="$event.stopPropagation()">
            <h2>{{ (editing() ? 'memberships.editPlan' : 'memberships.newPlanTitle') | t }}</h2>
            <form [formGroup]="form" (ngSubmit)="save()" class="col gap-4" style="margin-top: 20px;">
              <div class="form-field"><label>{{ 'memberships.name' | t }} *</label><input class="input" formControlName="name" /></div>
              <div class="form-field"><label>{{ 'memberships.description' | t }}</label><textarea class="input" formControlName="description" rows="2"></textarea></div>
              @if (!editing()) {
                <div class="form-field">
                  <label>{{ 'memberships.duration' | t }} *</label>
                  <select class="input" formControlName="duration">
                    <option [ngValue]="1">{{ 'planDuration.monthly' | t }}</option>
                    <option [ngValue]="3">{{ 'planDuration.quarterly' | t }}</option>
                    <option [ngValue]="6">{{ 'planDuration.semiAnnual' | t }}</option>
                    <option [ngValue]="12">{{ 'planDuration.annual' | t }}</option>
                  </select>
                </div>
              }
              <div class="form-field"><label>{{ 'memberships.price' | t }} *</label><input class="input" type="number" step="0.01" formControlName="price" /></div>
              @if (editing()) {
                <div class="form-field"><label class="row gap-2"><input type="checkbox" formControlName="isActive" /> {{ 'memberships.isActive' | t }}</label></div>
              }
              <div class="dialog-actions">
                <button type="button" class="btn btn-ghost" (click)="closeDialog()">{{ 'common.cancel' | t }}</button>
                <button class="btn btn-primary" [disabled]="form.invalid || saving()">
                  @if (saving()) { <span class="spinner" style="border-top-color:#0a0a0c;border-color:#0a0a0c40"></span> }
                  @else { {{ (editing() ? 'common.save' : 'common.create') | t }} }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 18px;
    }
    .plan-card {
      position: relative;
      padding: 26px;
      border-radius: var(--radius-lg);
      background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015));
      border: 1px solid var(--border);
      backdrop-filter: blur(16px);
      box-shadow: var(--shadow-glow);
      overflow: hidden;
      transition: transform var(--duration) var(--ease), border-color var(--duration) var(--ease);
    }
    .plan-card::before {
      content: '';
      position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: var(--silver-grad);
      opacity: .8;
    }
    .plan-card:hover { transform: translateY(-3px); border-color: var(--border-strong); }
    .plan-card.disabled { opacity: .55; }
    .plan-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .plan-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: var(--silver-grad-soft);
      display: grid; place-items: center;
      color: var(--silver-1);
      border: 1px solid var(--border-strong);
    }
    h2 { font-size: 20px; }
    .plan-desc { color: var(--text-4); font-size: 13px; margin-top: 4px; min-height: 38px; }
    .plan-price { margin: 22px 0 18px; display: flex; align-items: baseline; gap: 6px; }
    .plan-price .amount { font-family: 'Space Grotesk', sans-serif; font-weight: 800; font-size: 38px; color: var(--text-1); letter-spacing: -.02em; }
    .plan-price .curr { font-size: 14px; color: var(--silver-2); font-weight: 600; }
    .plan-price .per { color: var(--text-4); font-size: 12.5px; margin-inline-start: 4px; }
    .plan-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding-top: 16px; border-top: 1px solid var(--border);
    }
    .duration { color: var(--text-4); font-size: 12.5px; }
  `]
})
export class MembershipsComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  private i18n = inject(I18nService);

  loading = signal(true);
  saving = signal(false);
  plans = signal<MembershipPlanDto[]>([]);
  showDialog = signal(false);
  editing = signal<MembershipPlanDto | null>(null);

  canEdit = computed(() => this.auth.hasRole(['Owner', 'Admin']));

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    duration: [1 as PlanDuration, Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    isActive: [true]
  });

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getPlans().subscribe(p => { this.plans.set(p); this.loading.set(false); });
  }

  openCreate() {
    this.editing.set(null);
    this.form.reset({ name: '', description: '', duration: 1, price: 0, isActive: true });
    this.showDialog.set(true);
  }

  edit(p: MembershipPlanDto) {
    this.editing.set(p);
    this.form.patchValue({
      name: p.name,
      description: p.description ?? '',
      duration: p.duration,
      price: p.price,
      isActive: p.isActive
    });
    this.showDialog.set(true);
  }

  closeDialog() { this.showDialog.set(false); }

  save() {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    const op$ = this.editing()
      ? this.api.updatePlan(this.editing()!.id, { name: v.name, description: v.description, price: v.price, isActive: v.isActive })
      : this.api.createPlan({ name: v.name, description: v.description, duration: v.duration, price: v.price });
    op$.subscribe({
      next: () => { this.saving.set(false); this.toast.success(this.i18n.t('toast.saved')); this.closeDialog(); this.load(); },
      error: () => this.saving.set(false)
    });
  }

  del(p: MembershipPlanDto) {
    if (!confirm(this.i18n.t('memberships.deleteConfirm', { name: p.name }))) return;
    this.api.deletePlan(p.id).subscribe(() => { this.toast.success(this.i18n.t('toast.planDeleted')); this.load(); });
  }

  iconFor(d: PlanDuration) {
    return d === 1 ? 'looks_one' : d === 3 ? 'looks_3' : d === 6 ? 'looks_6' : 'workspace_premium';
  }

  planDurationKey(d: PlanDuration): string {
    return d === 1 ? 'planDuration.monthly'
         : d === 3 ? 'planDuration.quarterly'
         : d === 6 ? 'planDuration.semiAnnual'
         : 'planDuration.annual';
  }
}
