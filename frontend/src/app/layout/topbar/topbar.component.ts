import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationsBellComponent } from '../notifications-bell/notifications-bell.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, NotificationsBellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent {
  @Input() collapsed = false;
  @Output() toggle = new EventEmitter<void>();
  @Output() toggleMobile = new EventEmitter<void>();

  private auth = inject(AuthService);
  private router = inject(Router);

  user = this.auth.user;
  now = new Date();

  goToProfile() { this.router.navigate(['/settings']); }
}
