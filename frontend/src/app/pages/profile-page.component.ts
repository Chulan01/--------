import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [DatePipe, LucideAngularModule],
  template: `
    <main class="page">
      <h1>\u041b\u0438\u0447\u043d\u044b\u0439 \u043a\u0430\u0431\u0438\u043d\u0435\u0442</h1>
      @if (auth.currentUser(); as user) {
        <section class="grid">
          <div class="card">
            <h2><lucide-icon name="user-circle" [size]="20"></lucide-icon> \u041f\u0440\u043e\u0444\u0438\u043b\u044c</h2>
            <p><b>\u041b\u043e\u0433\u0438\u043d:</b> {{ user.username }}</p>
            <p><b>Email:</b> {{ user.email }}</p>
            <p><b>\u0410\u043a\u0442\u0438\u0432\u0435\u043d:</b> {{ user.is_active ? '\u0434\u0430' : '\u043d\u0435\u0442' }}</p>
            <p class="muted">\u0421\u043e\u0437\u0434\u0430\u043d: {{ user.created_at | date:'dd.MM.yyyy HH:mm' }}</p>
          </div>
        </section>
      }
    </main>
  `
})
export class ProfilePageComponent {
  constructor(readonly auth: AuthService) {}
}
