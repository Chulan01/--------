# Агрегатор новостей

Учебное fullstack-приложение для сбора, хранения и просмотра новостей из внешних источников. Проект состоит из backend на FastAPI, frontend на Angular и базы данных PostgreSQL.

Приложение позволяет просматривать ленту новостей, искать материалы, выделять важные новости, регистрировать пользователей, ставить реакции на новости и управлять системой через административную панель.

## Основные возможности

- Лента новостей с группировкой по категориям.
- Отдельный блок важных новостей.
- Поиск новостей по заголовку.
- Отображение изображений, источников, категорий и дат публикации.
- Переход к оригинальному источнику новости.
- Регистрация и вход пользователей.
- JWT-авторизация через access и refresh токены.
- Личный кабинет пользователя.
- Подтверждение выхода из аккаунта.
- Реакции на новости: `like`, `love`, `laugh`, `wow`.
- Один пользователь может поставить только одну реакцию на одну новость.
- Административная панель.
- Добавление ручных новостей администратором.
- Управление источниками новостей.
- Запуск агрегации новостей.
- Интеграция с NewsData API.
- Управление пользователями.
- Защита администратора от случайной блокировки.
- Журнал действий.
- Резервное копирование и восстановление PostgreSQL.
- Применение Alembic-миграций.
- Автоматические тесты backend.

## Технологии

Backend:

- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- Alembic
- PostgreSQL
- Pydantic
- python-jose
- passlib + bcrypt
- httpx
- feedparser
- pytest

Frontend:

- Angular 18
- TypeScript
- Angular Router
- Angular Forms
- Angular HttpClient
- Angular signals
- RxJS
- jwt-decode
- lucide-angular
- CSS

## Структура проекта

```text
backend/
  alembic/                 Миграции базы данных
  app/
    api/                   REST API: auth, news, profile, admin
    core/                  Конфигурация и безопасность
    db/                    Подключение к базе данных
    models/                SQLAlchemy-модели
    schemas/               Pydantic-схемы
    services/              Агрегация, аудит, backup, миграции, seed
  scripts/                 PowerShell-скрипты backup/restore
  sql/                     SQL-схема
  tests/                   Автоматические тесты
frontend/
  src/app/
    guards/                Guards доступа
    models/                TypeScript-модели API
    pages/                 Страницы приложения
    services/              API/Auth-сервисы и interceptor
  src/assets/news/         Изображения ручных важных новостей
scripts/
  start_dev.ps1            Быстрый локальный запуск
.env.example               Шаблон переменных окружения
```

## База данных

Основная СУБД: PostgreSQL.

Основные таблицы:

- `roles` — роли пользователей.
- `users` — учетные записи пользователей.
- `news_sources` — источники новостей.
- `categories` — категории новостей.
- `news_articles` — новости.
- `article_reactions` — реакции пользователей на новости.
- `refresh_tokens` — refresh-токены.
- `logs` — журнал действий.
- `backups` — сведения о резервных копиях.

В проекте используются внешние ключи, уникальные ограничения, CHECK-ограничения и индексы. Дубли новостей предотвращаются уникальным URL. Для реакций действует уникальное ограничение на пару `article_id + user_id`, поэтому один пользователь может иметь только одну реакцию на конкретную новость.

## Миграции

Миграции находятся в `backend/alembic/versions`.

Основные миграции:

- `20260528_0001_initial_schema.py` — начальная схема БД.
- `20260602_0002_manual_articles_images.py` — изображения и важные новости.
- `20260604_0003_seed_news_categories.py` — категории новостей.
- `20260608_0004_article_reactions.py` — реакции на новости.

Применение миграций:

```powershell
cd backend
.\.venv\Scripts\python.exe -m alembic upgrade head
```

## Источники новостей

В текущей версии проект использует NewsData API для русскоязычных новостей.

Параметры NewsData:

- страна: `ru`;
- язык: `ru`;
- категории: `crime`, `education`, `environment`, `sports`, `technology`;
- требуются новости с изображением: `image=1`.

Категории NewsData сопоставляются с внутренними категориями:

```text
crime       -> Происшествия
education   -> Образование
environment -> Мир
sports      -> Спорт
technology  -> Технологии
```

Также есть локальный источник `Редакция агрегатора`, который используется для ручных важных новостей.

## Важные новости

В проект добавлены ручные важные новости с изображениями:

- `ЗМП вышел` — `/assets/news/zmp-album.png`
- `Миньон заботливо поливает банан прямо на лужайке` — `/assets/news/minion-banana.png`
- `В общежитии №4 три девушки пропали без вести` — `/assets/news/dormitory-missing.png`
- `Пожар уничтожил популярную пекарню «Хлебница» на Ленинградской улице` — `/assets/news/bakery-fire.png`

На главной странице важные новости отображаются первыми и располагаются сеткой 2x2 на широком экране.

## API

Основные endpoints:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me

GET  /api/articles
GET  /api/categories
GET  /api/sources
POST /api/articles/{article_id}/reaction

GET   /api/profile
PATCH /api/profile

GET    /api/admin/users
PATCH  /api/admin/users/{user_id}
GET    /api/admin/roles
GET    /api/admin/logs
GET    /api/admin/backups
POST   /api/admin/backups
POST   /api/admin/backups/restore
POST   /api/admin/migrations
POST   /api/admin/articles
PATCH  /api/admin/articles/{article_id}
DELETE /api/admin/articles/{article_id}
POST   /api/admin/sources
PATCH  /api/admin/sources/{source_id}
DELETE /api/admin/sources/{source_id}
POST   /api/admin/aggregate

GET /api/health
```

Swagger-документация доступна после запуска backend:

```text
http://localhost:8000/docs
```

## Локальный запуск

Перед запуском должен быть установлен PostgreSQL.

Пример создания базы:

```powershell
psql -U postgres
CREATE USER news WITH PASSWORD 'news';
CREATE DATABASE newsdb OWNER news;
\q
```

Создайте `.env` в корне проекта на основе `.env.example`.

Быстрый запуск:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start_dev.ps1
```

Скрипт берет `DATABASE_URL` из файла `.env`. Если нужно временно запустить проект с другой базой, можно передать строку подключения параметром:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start_dev.ps1 -DatabaseUrl "postgresql+psycopg://chips:chips@127.0.0.1:5432/chipsdb"
```

Скрипт:

- создает backend `.venv`, если его нет;
- устанавливает backend-зависимости;
- применяет Alembic-миграции;
- устанавливает frontend-зависимости, если нет `node_modules`;
- запускает backend;
- запускает frontend.

Адреса:

```text
Backend:  http://localhost:8000
Swagger:  http://localhost:8000/docs
Frontend: http://localhost:4200
```

## Ручной запуск backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:DATABASE_URL="postgresql+psycopg://news:news@127.0.0.1:5432/newsdb"
python -m alembic upgrade head
python -m uvicorn app.main:app --reload
```

## Ручной запуск frontend

```powershell
cd frontend
npm install
npm start
```

Frontend ожидает backend по адресу:

```text
http://localhost:8000/api
```

## Тестирование

Backend-тесты:

```powershell
cd backend
pytest
```

Frontend-сборка:

```powershell
cd frontend
npm run build
```

Запуск одной командой:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start_dev.ps1
```

Тестами проверяются:

- регистрация;
- вход;
- refresh-токены;
- защита admin endpoints;
- уникальность email и логина;
- валидация логина;
- запрет блокировки администратора;
- создание важных новостей;
- реакции на новости;
- NewsData-агрегация;
- резервное копирование;
- наличие ключевых frontend-страниц.

## Безопасность

В проекте реализовано:

- bcrypt-хеширование паролей;
- JWT access и refresh токены;
- хранение refresh-токенов в БД;
- отзыв refresh-токена при выходе;
- разграничение доступа по ролям;
- запрет блокировки администратора;
- валидация входных данных через Pydantic;
- защита от дублей через уникальные ограничения;
- хранение секретов через `.env`;
- аудит действий в таблице `logs`.

## Что не нужно сдавать вместе с проектом

В сдаваемой папке не должно быть:

- `.env`;
- `admin_credentials.local.txt`;
- `node_modules`;
- `dist`;
- `.venv`;
- `__pycache__`;
- `.pytest_cache`;
- отчетных файлов практики, если преподавателю нужен только проект.

Для запуска преподаватель может использовать `.env.example`, `requirements.txt`, `package.json` и инструкции из этого README.
