import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, UserDto, UserRole } from '../models/models';

const TOKEN_KEY = 'ironforge.token';
const USER_KEY = 'ironforge.user';
const EXPIRY_KEY = 'ironforge.expiry';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly _user = signal<UserDto | null>(this.loadUser());
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user() && !this.isExpired());
  readonly role = computed<UserRole | null>(() => this._user()?.role ?? null);

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(tap(res => this.persist(res)));
  }

  forgotPassword(email: string) {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  changePassword(oldPassword: string, newPassword: string) {
    return this.http.post(`${environment.apiUrl}/auth/change-password`, { oldPassword, newPassword });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  hasRole(roles: UserRole[]): boolean {
    const r = this._user()?.role;
    return r ? roles.includes(r) : false;
  }

  private persist(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    localStorage.setItem(EXPIRY_KEY, res.expiresAt);
    this._user.set(res.user);
  }

  private loadUser(): UserDto | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      const expiry = localStorage.getItem(EXPIRY_KEY);
      if (!raw || !expiry) return null;
      if (new Date(expiry) <= new Date()) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(EXPIRY_KEY);
        return null;
      }
      return JSON.parse(raw) as UserDto;
    } catch { return null; }
  }

  private isExpired(): boolean {
    const e = localStorage.getItem(EXPIRY_KEY);
    return !e || new Date(e) <= new Date();
  }
}
