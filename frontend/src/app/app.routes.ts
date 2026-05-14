import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'members',
        loadComponent: () => import('./pages/members/members-list/members-list.component').then(m => m.MembersListComponent)
      },
      {
        path: 'members/:id',
        loadComponent: () => import('./pages/members/member-profile/member-profile.component').then(m => m.MemberProfileComponent)
      },
      {
        path: 'memberships',
        loadComponent: () => import('./pages/memberships/memberships.component').then(m => m.MembershipsComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./pages/payments/payments.component').then(m => m.PaymentsComponent)
      },
      {
        path: 'attendance',
        loadComponent: () => import('./pages/attendance/attendance.component').then(m => m.AttendanceComponent)
      },
      {
        path: 'reports',
        canActivate: [roleGuard(['Owner', 'Admin'])],
        loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'settings',
        canActivate: [roleGuard(['Owner', 'Admin'])],
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
