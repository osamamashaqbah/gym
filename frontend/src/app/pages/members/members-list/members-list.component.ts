import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { MemberDto, MembershipStatus, PagedResult, StatusLabels } from '../../../core/models/models';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MemberFormDialogComponent } from '../member-form-dialog/member-form-dialog.component';

@Component({
  selector: 'app-members-list',
  standalone: true,
  imports: [CommonModule, DatePipe, MemberFormDialogComponent, ConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './members-list.component.html',
  styleUrls: ['./members-list.component.scss']
})
export class MembersListComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  loading = signal(true);
  page = signal(1);
  pageSize = 10;
  search = signal('');
  statusFilter = signal('');

  paged = signal<PagedResult<MemberDto>>({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });

  pageEndIndex = computed(() => Math.min(this.paged().page * this.paged().pageSize, this.paged().totalCount));

  showForm = signal(false);
  editing = signal<MemberDto | null>(null);
  toArchive = signal<MemberDto | null>(null);

  canEdit = computed(() => this.auth.hasRole(['Owner', 'Admin', 'Reception']));
  canDelete = computed(() => this.auth.hasRole(['Owner', 'Admin']));

  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(v => {
      this.search.set(v);
      this.page.set(1);
      this.load();
    });
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.getMembers({
      page: this.page(),
      pageSize: this.pageSize,
      search: this.search() || undefined,
      status: this.statusFilter() || undefined
    }).subscribe({
      next: (res) => { this.paged.set(res); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch(e: Event) {
    this.searchSubject.next((e.target as HTMLInputElement).value);
  }

  onStatusChange(e: Event) {
    this.statusFilter.set((e.target as HTMLSelectElement).value);
    this.page.set(1);
    this.load();
  }

  reset() {
    this.search.set('');
    this.statusFilter.set('');
    this.page.set(1);
    this.load();
  }

  setPage(p: number) {
    this.page.set(p);
    this.load();
  }

  goTo(m: MemberDto) { this.router.navigate(['/members', m.id]); }

  openCreate() { this.editing.set(null); this.showForm.set(true); }
  openEdit(m: MemberDto) { this.editing.set(m); this.showForm.set(true); }
  closeForm() { this.showForm.set(false); }

  onSaved() {
    this.toast.success(this.editing() ? 'Member updated' : 'Member created');
    this.closeForm();
    this.load();
  }

  confirmArchive(m: MemberDto) { this.toArchive.set(m); }
  doArchive() {
    const m = this.toArchive();
    if (!m) return;
    this.api.archiveMember(m.id).subscribe(() => {
      this.toast.success(`${m.fullName} archived`);
      this.toArchive.set(null);
      this.load();
    });
  }

  statusLabel(s: MembershipStatus) { return StatusLabels[s]; }
}
