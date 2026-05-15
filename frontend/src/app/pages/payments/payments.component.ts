import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { PagedResult, PaymentDto } from '../../core/models/models';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ 'payments.title' | t }}</h1>
          <p class="page-subtitle">{{ 'payments.subtitle' | t }}</p>
        </div>
      </div>

      <div class="card" style="padding:18px;margin-bottom:18px;">
        <div class="row gap-3" style="flex-wrap: wrap;">
          <div style="position:relative;flex:1;min-width:240px;">
            <span class="material-icons-round" style="position:absolute;inset-inline-start:14px;top:50%;transform:translateY(-50%);color:var(--text-4);font-size:18px;">search</span>
            <input class="input" style="padding-inline-start:42px;" [placeholder]="'payments.searchPlaceholder' | t"
                   [value]="search()" (input)="onSearch($event)" />
          </div>
          <input class="input" type="date" [value]="from()" (change)="onFrom($event)" style="width:170px;" />
          <input class="input" type="date" [value]="to()"   (change)="onTo($event)"   style="width:170px;" />
          @if (search() || from() || to()) {
            <button class="btn btn-ghost" (click)="reset()"><span class="material-icons-round">close</span> {{ 'common.clear' | t }}</button>
          }
        </div>
      </div>

      <div class="card" style="padding:0;overflow:hidden;">
        @if (loading()) {
          <div style="padding:60px;text-align:center;"><span class="spinner"></span></div>
        } @else if (paged().items.length === 0) {
          <div class="empty-state">
            <span class="material-icons-round">receipt_long</span>
            <h3>{{ 'payments.noPaymentsFound' | t }}</h3>
            <p>{{ 'payments.tryAdjustOrAdd' | t }}</p>
          </div>
        } @else {
          <div style="overflow:auto;">
            <table class="table">
              <thead>
                <tr>
                  <th>{{ 'payments.invoice' | t }}</th>
                  <th>{{ 'payments.member' | t }}</th>
                  <th>{{ 'payments.plan' | t }}</th>
                  <th>{{ 'payments.method' | t }}</th>
                  <th>{{ 'payments.date' | t }}</th>
                  <th style="text-align:end;">{{ 'payments.amount' | t }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (p of paged().items; track p.id) {
                  <tr>
                    <td><span class="mono" style="font-size:12px;">{{ p.invoiceNumber }}</span></td>
                    <td>
                      <div class="name-cell">
                        <div class="avatar">{{ p.memberName.charAt(0) }}</div>
                        <span style="color:var(--text-1);font-weight:600;">{{ p.memberName }}</span>
                      </div>
                    </td>
                    <td>{{ p.planName || '—' }}</td>
                    <td>
                      <span class="row gap-2">
                        <span class="material-icons-round" style="font-size:16px;color:var(--silver-3);">{{ iconFor(p.method) }}</span>
                        {{ paymentMethodKey(p.method) | t }}
                      </span>
                    </td>
                    <td>{{ p.paidAt | date:'medium' }}</td>
                    <td style="text-align:end;">
                      <strong style="font-family:'Space Grotesk',sans-serif;color:var(--green);">
                        {{ p.amount | number:'1.2-2' }} JOD
                      </strong>
                    </td>
                    <td>
                      <button class="btn btn-ghost btn-icon" (click)="invoice(p)" [title]="'payments.openInvoice' | t">
                        <span class="material-icons-round">print</span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="pagination" style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-top:1px solid var(--border);">
            <div style="color:var(--text-4);font-size:12.5px;">
              <strong style="color:var(--text-1);">{{ paged().totalCount }}</strong> {{ 'payments.total' | t }} ·
              {{ totalSum() | number:'1.2-2' }} JOD {{ 'payments.onPage' | t }}
            </div>
            <div class="row gap-2">
              <button class="btn btn-ghost btn-sm" [disabled]="page() === 1" (click)="setPage(page() - 1)">
                <span class="material-icons-round">chevron_left</span>
              </button>
              <span style="font-family:'Space Grotesk',sans-serif;color:var(--text-1);padding:0 12px;">{{ page() }} / {{ paged().totalPages || 1 }}</span>
              <button class="btn btn-ghost btn-sm" [disabled]="page() >= (paged().totalPages || 1)" (click)="setPage(page() + 1)">
                <span class="material-icons-round">chevron_right</span>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .mono { font-family: ui-monospace, monospace; }
    .name-cell { display: flex; align-items: center; gap: 12px; }
    .avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--silver-grad);
      color: #0a0a0c;
      display: grid; place-items: center;
      font-weight: 700; font-size: 12px;
      border: 1px solid #d8dadf;
    }
  `]
})
export class PaymentsComponent {
  private api = inject(ApiService);
  loading = signal(true);
  page = signal(1);
  pageSize = 15;
  search = signal('');
  from = signal('');
  to = signal('');

  paged = signal<PagedResult<PaymentDto>>({ items: [], totalCount: 0, page: 1, pageSize: 15, totalPages: 0 });
  totalSum = computed(() => this.paged().items.reduce((s, p) => s + p.amount, 0));

  private subj = new Subject<string>();

  constructor() {
    this.subj.pipe(debounceTime(300), distinctUntilChanged()).subscribe(v => {
      this.search.set(v); this.page.set(1); this.load();
    });
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.getPayments({
      page: this.page(),
      pageSize: this.pageSize,
      search: this.search() || undefined,
      from: this.from() ? new Date(this.from()).toISOString() : undefined,
      to: this.to() ? new Date(this.to()).toISOString() : undefined
    }).subscribe({
      next: (r) => { this.paged.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch(e: Event) { this.subj.next((e.target as HTMLInputElement).value); }
  onFrom(e: Event)   { this.from.set((e.target as HTMLInputElement).value); this.page.set(1); this.load(); }
  onTo(e: Event)     { this.to.set((e.target as HTMLInputElement).value);   this.page.set(1); this.load(); }
  reset() { this.search.set(''); this.from.set(''); this.to.set(''); this.page.set(1); this.load(); }
  setPage(p: number) { this.page.set(p); this.load(); }
  invoice(p: PaymentDto) {
    this.api.invoiceHtml(p.id).subscribe((html) => {
      const win = window.open('', '_blank');
      if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 300);
      }
    });
  }
  iconFor(m: number) { return m === 1 ? 'payments' : m === 2 ? 'credit_card' : 'qr_code_2'; }
  paymentMethodKey(m: number): string {
    return m === 1 ? 'paymentMethod.cash' : m === 2 ? 'paymentMethod.visa' : 'paymentMethod.cliq';
  }
}
