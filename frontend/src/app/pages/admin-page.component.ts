import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Article, Backup, Category, LogEntry, User } from '../models/api.models';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [DatePipe, FormsModule, LucideAngularModule],
  template: `
    <main class="page admin-page">
      <h1>{{ labels.adminTitle }}</h1>
      @if (status()) { <p class="success admin-status">{{ status() }}</p> }

      <section class="admin-layout">
        <div class="card admin-card manual-card">
          <h2>{{ labels.manualNews }}</h2>
          <form class="form admin-form" #articleForm="ngForm" (ngSubmit)="addArticle()">
            <input name="articleTitle" [(ngModel)]="articleTitle" [placeholder]="labels.title" required minlength="5">
            <select name="articleCategory" [(ngModel)]="articleCategory" required>
              @for (category of categories(); track category.id) {
                <option [value]="category.name">{{ category.name }}</option>
              }
            </select>
            <input name="articleImageUrl" [(ngModel)]="articleImageUrl" [placeholder]="labels.imageUrl">
            <input name="articleUrl" [(ngModel)]="articleUrl" [placeholder]="labels.sourceUrlOptional">
            <textarea name="articleContent" [(ngModel)]="articleContent" rows="6" [placeholder]="labels.newsText" required minlength="10"></textarea>
            <button class="primary" type="submit" [disabled]="articleForm.invalid"><lucide-icon name="save" [size]="17"></lucide-icon> {{ labels.addNews }}</button>
          </form>
          @if (articleStatus()) { <p class="success admin-status">{{ articleStatus() }}</p> }
        </div>

        <div class="card admin-card users-card">
          <h2>{{ labels.users }}</h2>
          <div class="table-wrap">
            <table class="table admin-table">
              <thead><tr><th>ID</th><th>Email</th><th>{{ labels.role }}</th><th>{{ labels.active }}</th></tr></thead>
              <tbody>
                @for (user of users(); track user.id) {
                  <tr>
                    <td>{{ user.id }}</td>
                    <td class="cell-break">{{ user.email }}</td>
                    <td><span class="badge">{{ user.role.name }}</span></td>
                    <td>
                      <input
                        class="table-checkbox"
                        type="checkbox"
                        [ngModel]="user.is_active"
                        [disabled]="user.role.name === 'admin'"
                        title="Admin accounts cannot be deactivated"
                        (ngModelChange)="setUserActive(user, $event)"
                      >
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="card admin-card backups-card">
          <h2>{{ labels.backups }}</h2>
          <div class="row">
            <button type="button" (click)="createBackup()"><lucide-icon name="database-backup" [size]="17"></lucide-icon> {{ labels.create }}</button>
          </div>
          @if (backupStatus()) { <p class="success admin-status">{{ backupStatus() }}</p> }
          <div class="admin-list">
            @for (backup of backups(); track backup.id) {
              <div class="admin-list-row">
                <div class="stacked-text">
                  <strong>{{ backup.filename }}</strong>
                  <span class="badge">{{ backup.status }}</span>
                </div>
                <button type="button" (click)="restore(backup.filename)">{{ labels.restore }}</button>
              </div>
            } @empty {
              <p class="muted">{{ labels.noBackups }}</p>
            }
          </div>
        </div>

        <div class="card admin-card articles-card">
          <h2>{{ labels.feedNews }}</h2>
          <div class="table-wrap">
            <table class="table admin-table articles-table">
              <thead><tr><th>ID</th><th>{{ labels.title }}</th><th>{{ labels.category }}</th><th></th></tr></thead>
              <tbody>
                @for (article of articles(); track article.id) {
                  <tr>
                    <td>{{ article.id }}</td>
                    <td class="cell-break">{{ article.title }}</td>
                    <td><span class="badge">{{ article.category || article.source.name }}</span></td>
                    <td><button class="danger" type="button" (click)="deleteArticle(article.id)">{{ labels.delete }}</button></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="card admin-card logs-card">
          <h2>{{ labels.logs }}</h2>
          <div class="table-wrap">
            <table class="table admin-table logs-table">
              <thead><tr><th>{{ labels.time }}</th><th>{{ labels.level }}</th><th>{{ labels.action }}</th><th>{{ labels.message }}</th></tr></thead>
              <tbody>
                @for (log of logs(); track log.id) {
                  <tr>
                    <td class="nowrap">{{ log.created_at | date:'dd.MM HH:mm' }}</td>
                    <td><span class="badge">{{ log.level }}</span></td>
                    <td class="nowrap">{{ log.action }}</td>
                    <td class="cell-break">{{ log.message }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  `
})
export class AdminPageComponent implements OnInit {
  categories = signal<Category[]>([]);
  users = signal<User[]>([]);
  logs = signal<LogEntry[]>([]);
  backups = signal<Backup[]>([]);
  articles = signal<Article[]>([]);
  status = signal('');
  backupStatus = signal('');
  articleStatus = signal('');
  allowedCategories = ['Важная', 'Мир', 'Происшествия', 'Город', 'Образование', 'Технологии', 'Спорт', 'Культура'];
  labels = {
    adminTitle: 'Панель администрирования',
    manualNews: 'Своя новость',
    title: 'Заголовок',
    category: 'Категория',
    imageUrl: 'URL фото или /assets/news/photo.png',
    sourceUrlOptional: 'Ссылка на источник, можно оставить пустой',
    newsText: 'Текст новости',
    addNews: 'Добавить новость',
    users: 'Пользователи',
    role: 'Роль',
    active: 'Активен',
    backups: 'Резервные копии',
    create: 'Создать',
    restore: 'Восстановить',
    noBackups: 'Резервных копий пока нет.',
    feedNews: 'Новости в ленте',
    delete: 'Удалить',
    logs: 'Журнал действий',
    time: 'Время',
    level: 'Уровень',
    action: 'Действие',
    message: 'Сообщение',
    added: 'Новость добавлена и будет показана в ленте.',
    addError: 'Не удалось добавить новость. Проверьте поля формы.',
    requiredFields: 'Заголовок и текст новости обязательны для заполнения.'
  };
  articleTitle = '';
  articleContent = '';
  articleCategory = 'Важная';
  articleImageUrl = '';
  articleUrl = '';

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.status.set('');
    this.api.categories().subscribe({
      next: (items) => {
        const filtered = items.filter((category) => this.allowedCategories.includes(category.name));
        this.categories.set(filtered);
        if (!this.allowedCategories.includes(this.articleCategory) && filtered.length > 0) {
          this.articleCategory = filtered[0].name;
        }
      },
      error: (err) => this.handleAdminLoadError(err)
    });
    this.api.users().subscribe({
      next: (items) => this.users.set(items),
      error: (err) => this.handleAdminLoadError(err)
    });
    this.api.logs().subscribe({
      next: (items) => this.logs.set(items),
      error: (err) => this.handleAdminLoadError(err)
    });
    this.api.backups().subscribe({
      next: (items) => this.backups.set(items),
      error: (err) => this.handleAdminLoadError(err)
    });
    this.api.articles().subscribe({
      next: (items) => this.articles.set(items),
      error: (err) => this.handleAdminLoadError(err)
    });
  }

  addArticle() {
    if (!this.articleTitle.trim() || !this.articleContent.trim()) {
      this.articleStatus.set(this.labels.requiredFields);
      return;
    }
    this.api.createArticle({
      title: this.articleTitle.trim(),
      content: this.articleContent.trim(),
      category: this.articleCategory,
      image_url: this.articleImageUrl || null,
      url: this.articleUrl || null,
      is_featured: this.articleCategory === 'Важная'
    }).subscribe({
      next: () => {
        this.articleTitle = '';
        this.articleContent = '';
        this.articleImageUrl = '';
        this.articleUrl = '';
        this.articleCategory = 'Важная';
        this.articleStatus.set(this.labels.added);
        this.reload();
      },
      error: () => this.articleStatus.set(this.labels.addError)
    });
  }

  deleteArticle(id: number) {
    this.api.deleteArticle(id).subscribe(() => this.reload());
  }

  setUserActive(user: User, is_active: boolean) {
    if (user.role.name === 'admin') {
      return;
    }
    this.api.updateUser(user.id, { is_active }).subscribe(() => this.reload());
  }

  createBackup() {
    this.backupStatus.set('');
    this.api.createBackup().subscribe({
      next: () => {
        this.backupStatus.set('Резервная копия создана.');
        this.reload();
      },
      error: (err) => this.backupStatus.set(this.apiError(err, 'Не удалось создать резервную копию.'))
    });
  }

  restore(filename: string) {
    this.backupStatus.set('');
    this.api.restoreBackup(filename).subscribe({
      next: () => {
        this.backupStatus.set('Резервная копия восстановлена. Войдите заново.');
        this.auth.clear();
        this.router.navigateByUrl('/login');
      },
      error: (err) => this.backupStatus.set(this.apiError(err, 'Не удалось восстановить резервную копию.'))
    });
  }

  private apiError(err: any, fallback: string): string {
    const detail = err?.error?.detail;
    if (typeof detail === 'string') return detail;
    return fallback;
  }

  private handleAdminLoadError(err: any) {
    if (err?.status === 401 || err?.status === 403) {
      this.auth.clear();
      this.router.navigateByUrl('/login');
      return;
    }
    this.status.set(this.apiError(err, 'Не удалось загрузить данные админки.'));
  }
}
