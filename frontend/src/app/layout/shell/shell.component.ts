import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TopbarComponent } from '../topbar/topbar.component';
import { UserRole } from '../../core/models/models';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles?: UserRole[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TopbarComponent],
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
    { path: '/dashboard',   label: 'Dashboard',    icon: 'space_dashboard' },
    { path: '/members',     label: 'Members',      icon: 'groups' },
    { path: '/memberships', label: 'Memberships',  icon: 'card_membership' },
    { path: '/payments',    label: 'Payments',     icon: 'payments' },
    { path: '/attendance',  label: 'Attendance',   icon: 'event_available' },
    { path: '/reports',     label: 'Reports',      icon: 'bar_chart',  roles: ['Owner', 'Admin'] },
    { path: '/settings',    label: 'Settings',     icon: 'settings',   roles: ['Owner', 'Admin'] },
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
