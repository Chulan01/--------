import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideAngularModule],
  template: `
    <main class="page">
      <h1>\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f</h1>
      <form class="form card" (ngSubmit)="submit()">
        <label>
          \u041b\u043e\u0433\u0438\u043d
          <input
            name="username"
            [(ngModel)]="username"
            required
            minlength="3"
            maxlength="80"
            pattern="[A-Za-z0-9_\u0410-\u042f\u0430-\u044f\u0401\u0451]+"
          >
        </label>
        <p class="muted form-hint">\u041b\u043e\u0433\u0438\u043d: \u0442\u043e\u043b\u044c\u043a\u043e \u0431\u0443\u043a\u0432\u044b, \u0446\u0438\u0444\u0440\u044b \u0438 _. \u0411\u0435\u0437 \u043f\u0440\u043e\u0431\u0435\u043b\u043e\u0432.</p>
        <label>Email<input type="email" name="email" [(ngModel)]="email" required></label>
        <label>\u041f\u0430\u0440\u043e\u043b\u044c<input type="password" name="password" [(ngModel)]="password" required minlength="8"></label>
        @if (error) { <p class="error">{{ error }}</p> }
        <button class="primary" type="submit"><lucide-icon name="user-plus" [size]="17"></lucide-icon> \u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u0442\u044c\u0441\u044f</button>
        <a routerLink="/login">\u0423\u0436\u0435 \u0435\u0441\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442</a>
      </form>
    </main>
  `
})
export class RegisterPageComponent {
  username = '';
  email = '';
  password = '';
  error = '';

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  submit() {
    this.auth.register(this.username, this.email, this.password).subscribe({
      next: () => this.router.navigateByUrl('/profile'),
      error: (err: HttpErrorResponse) => this.error = this.formatError(err)
    });
  }

  private formatError(err: HttpErrorResponse): string {
    const detail = err.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail.map((item) => this.formatValidationItem(item)).join('; ');
    }
    return '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u0442\u044c\u0441\u044f';
  }

  private formatValidationItem(item: unknown): string {
    if (!item || typeof item !== 'object') {
      return String(item);
    }
    const error = item as { loc?: string[]; msg?: string; type?: string };
    const field = error.loc?.[error.loc.length - 1];
    if (field === 'username') {
      return '\u041b\u043e\u0433\u0438\u043d \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u043e\u0442 3 \u0434\u043e 80 \u0441\u0438\u043c\u0432\u043e\u043b\u043e\u0432: \u0442\u043e\u043b\u044c\u043a\u043e \u0431\u0443\u043a\u0432\u044b, \u0446\u0438\u0444\u0440\u044b \u0438 _';
    }
    if (field === 'email') {
      return '\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0439 email';
    }
    if (field === 'password') {
      return '\u041f\u0430\u0440\u043e\u043b\u044c \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u043d\u0435 \u043a\u043e\u0440\u043e\u0447\u0435 8 \u0441\u0438\u043c\u0432\u043e\u043b\u043e\u0432';
    }
    return error.msg ?? '\u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u043f\u043e\u043b\u044f \u0444\u043e\u0440\u043c\u044b';
  }
}
