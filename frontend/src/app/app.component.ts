import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <header class="toolbar">
      <a class="brand" routerLink="/">
        <lucide-icon name="newspaper" [size]="22"></lucide-icon>
        <span>\u0410\u0433\u0440\u0435\u0433\u0430\u0442\u043e\u0440 \u043d\u043e\u0432\u043e\u0441\u0442\u0435\u0439</span>
      </a>
      <nav class="nav">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">\u041b\u0435\u043d\u0442\u0430</a>
        @if (auth.isAuthenticated()) {
          <a routerLink="/profile" routerLinkActive="active">\u041a\u0430\u0431\u0438\u043d\u0435\u0442</a>
          @if (auth.role === 'admin') {
            <a routerLink="/admin" routerLinkActive="active">\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435</a>
          }
          <div class="logout-wrap">
            <button type="button" (click)="askLogout()">\u0412\u044b\u0439\u0442\u0438</button>
            @if (showLogoutConfirm) {
              <div class="logout-confirm">
                <span>\u0412\u044b \u0442\u043e\u0447\u043d\u043e \u0445\u043e\u0442\u0438\u0442\u0435 \u0432\u044b\u0439\u0442\u0438?</span>
                <button type="button" class="primary" (click)="confirmLogout()">\u0414\u0430</button>
                <button type="button" (click)="cancelLogout()">\u041d\u0435\u0442</button>
              </div>
            }
          </div>
        } @else {
          <a routerLink="/login" routerLinkActive="active">\u0412\u0445\u043e\u0434</a>
          <a routerLink="/register" routerLinkActive="active">\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f</a>
        }
      </nav>
    </header>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  showLogoutConfirm = false;

  constructor(readonly auth: AuthService) {}

  askLogout() {
    this.showLogoutConfirm = true;
  }

  confirmLogout() {
    this.showLogoutConfirm = false;
    this.auth.logout();
  }

  cancelLogout() {
    this.showLogoutConfirm = false;
  }
}
