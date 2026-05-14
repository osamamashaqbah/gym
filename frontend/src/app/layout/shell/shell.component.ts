import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TopbarComponent } from '../topbar/topbar.component';
import { UserRole } from '../../core/models/models';
import { TPipe } from '../../core/i18n/t.pipe';

interface NavItem {
  path: string;
  labelKey: string;
  icon: string;
  roles?: UserRole[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TopbarComponent, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  collapsed = signal(false);
  mobileOpen = signal(false);

  user = this.auth.user;

  private readonly allItems: NavItem[] = [
    { path: '/dashboard',   labelKey: 'nav.dashboard',    icon: 'space_dashboard' },
    { path: '/members',     labelKey: 'nav.members',      icon: 'groups' },
    { path: '/memberships', labelKey: 'nav.memberships',  icon: 'card_membership' },
    { path: '/payments',    labelKey: 'nav.payments',     icon: 'payments' },
    { path: '/attendance',  labelKey: 'nav.attendance',   icon: 'event_available' },
    { path: '/reports',     labelKey: 'nav.reports',      icon: 'bar_chart',  roles: ['Owner', 'Admin'] },
    { path: '/settings',    labelKey: 'nav.settings',     icon: 'settings',   roles: ['Owner', 'Admin'] },
  ];

  navItems = computed(() => {
    const role = this.auth.role();
    return this.allItems.filter(i => !i.roles || (role && i.roles.includes(role)));
  });

  toggleSidebar() { this.collapsed.update(v => !v); }
  toggleMobile() { this.mobileOpen.update(v => !v); }
  closeMobile() { this.mobileOpen.set(false); }

  logout() { this.auth.logout(); }
}
