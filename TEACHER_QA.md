# Шпаргалка для защиты проекта

Файл нужен как подсказка на случай вопросов преподавателя: где что лежит, как работает проект, какие команды запускать и как объяснять основные решения.

---

## 1. Коротко о проекте

Проект: веб-приложение «Агрегатор новостей».

Что делает:

- собирает новости из NewsData API и RSS/API-источников;
- сохраняет новости в PostgreSQL;
- показывает новости в Angular-интерфейсе;
- выделяет важные новости отдельным блоком;
- позволяет пользователям регистрироваться и входить;
- позволяет авторизованным пользователям ставить реакции;
- дает администратору панель управления;
- поддерживает backup, миграции и журнал действий.

Как сказать преподавателю:

> Это fullstack-приложение с backend на FastAPI, frontend на Angular и базой PostgreSQL. Оно агрегирует новости, хранит их в базе, показывает пользователю ленту и дает администратору инструменты управления источниками, новостями, пользователями и резервными копиями.

---

## 2. Что показать при демонстрации

1. Запустить проект.
2. Открыть frontend:

```text
http://localhost:4200
```

3. Показать ленту новостей.
4. Показать важные новости сверху.
5. Показать поиск.
6. Войти в аккаунт.
7. Показать реакции на новость.
8. Показать личный кабинет.
9. Войти как администратор.
10. Показать админ-панель:
   - добавление новости;
   - источники;
   - запуск агрегации;
   - пользователи;
   - логи;
   - backup.
11. Открыть Swagger:

```text
http://localhost:8000/docs
```

12. Показать тесты, если попросят.

---

## 3. Как запустить проект

Быстрый запуск из корня:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start_dev.ps1
```

Что делает скрипт:

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

Если запускать вручную:

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m alembic upgrade head
python -m uvicorn app.main:app --reload
```

Frontend:

```powershell
cd frontend
npm install
npm start
```

---

## 4. Что где находится

### Backend

```text
backend/app/main.py
```

Главная точка входа FastAPI. Здесь создается приложение, подключаются роутеры, CORS, обработчик ошибок и endpoint `/api/health`.

```text
backend/app/api/auth.py
```

Регистрация, вход, refresh token, logout, получение текущего пользователя.

```text
backend/app/api/news.py
```

Лента новостей, категории, источники, ручные новости, реакции.

```text
backend/app/api/admin.py
```

Админские функции: пользователи, роли, логи, backup.

```text
backend/app/api/profile.py
```

Личный кабинет пользователя.

```text
backend/app/api/deps.py
```

Проверка JWT, получение текущего пользователя, проверка администратора.

```text
backend/app/core/config.py
```

Настройки из `.env`: база, JWT, CORS, NewsData API key, первичный админ.

```text
backend/app/core/security.py
```

Хеширование паролей и создание JWT.

```text
backend/app/models/
```

SQLAlchemy-модели таблиц.

```text
backend/app/schemas/
```

Pydantic-схемы входных и выходных данных API.

```text
backend/app/services/news_aggregator.py
```

Агрегация новостей из NewsData API и RSS.

```text
backend/app/services/seed.py
```

Первичное заполнение ролей, категорий, источников и администратора.

```text
backend/app/services/backup.py
```

Создание и восстановление резервных копий PostgreSQL.

```text
backend/app/services/audit.py
```

Запись действий в журнал.

```text
backend/alembic/versions/
```

Миграции базы данных.

```text
backend/tests/
```

Автоматические тесты backend.

### Frontend

```text
frontend/src/app/app.routes.ts
```

Маршруты Angular.

```text
frontend/src/app/app.component.ts
```

Главная навигация, кнопка выхода, подтверждение выхода.

```text
frontend/src/app/pages/feed-page.component.ts
```

Главная лента новостей, важные новости, поиск, реакции.

```text
frontend/src/app/pages/login-page.component.ts
```

Страница входа.

```text
frontend/src/app/pages/register-page.component.ts
```

Страница регистрации и красивый вывод ошибок.

```text
frontend/src/app/pages/profile-page.component.ts
```

Личный кабинет.

```text
frontend/src/app/pages/admin-page.component.ts
```

Админ-панель.

```text
frontend/src/app/services/api.service.ts
```

Запросы к backend API.

```text
frontend/src/app/services/auth.service.ts
```

Логин, регистрация, logout, хранение токенов.

```text
frontend/src/app/services/auth.interceptor.ts
```

Автоматически добавляет JWT в запросы.

```text
frontend/src/app/guards/auth.guard.ts
```

Защищает страницы от гостей и не-админов.

```text
frontend/src/assets/news/
```

Картинки для важных новостей.

---

## 5. Как работает регистрация

Файлы:

```text
backend/app/api/auth.py
backend/app/schemas/auth.py
frontend/src/app/pages/register-page.component.ts
```

Логика:

1. Пользователь вводит логин, email и пароль.
2. Frontend отправляет `POST /api/auth/register`.
3. Backend проверяет:
   - email корректный;
   - пароль не короче 8 символов;
   - логин от 3 до 80 символов;
   - логин содержит только буквы, цифры и `_`;
   - email еще не занят;
   - логин еще не занят.
4. Пароль хешируется bcrypt.
5. Пользователь сохраняется в БД с ролью `user`.
6. Backend выдает access и refresh token.
7. Frontend сохраняет токены в `localStorage`.

Если спросят, почему нельзя пробелы в логине:

> Чтобы логин был стабильным идентификатором пользователя и не создавал проблем при поиске, отображении и сравнении. Разрешены только буквы, цифры и нижнее подчеркивание.

---

## 6. Как работает вход и JWT

Файлы:

```text
backend/app/api/auth.py
backend/app/core/security.py
frontend/src/app/services/auth.service.ts
frontend/src/app/services/auth.interceptor.ts
```

Логика:

1. Пользователь отправляет email и пароль.
2. Backend ищет пользователя по email.
3. Backend проверяет пароль через bcrypt.
4. Если пользователь активен, создаются access и refresh токены.
5. Access token используется для запросов к защищенным endpoints.
6. Refresh token хранится в БД и нужен для обновления сессии.
7. При logout refresh token отзывается.

Что сказать преподавателю:

> Access token короткоживущий и нужен для обычных запросов. Refresh token живет дольше, хранится в базе и может быть отозван. Это безопаснее, чем просто хранить один постоянный токен.

---

## 7. Как работает разграничение прав

Файлы:

```text
backend/app/api/deps.py
backend/app/models/role.py
backend/app/services/seed.py
frontend/src/app/guards/auth.guard.ts
```

Есть роли:

- `user`;
- `admin`.

Backend:

- `get_current_user` проверяет, что пользователь авторизован;
- `get_current_admin` проверяет, что роль пользователя `admin`.

Frontend:

- guard не пускает гостя в профиль;
- guard не пускает обычного пользователя в админ-панель.

Важно:

> Даже если пользователь попробует открыть админский URL вручную, backend все равно проверит роль и вернет ошибку 403.

---

## 8. Как работает лента новостей

Файлы:

```text
backend/app/api/news.py
frontend/src/app/pages/feed-page.component.ts
frontend/src/app/services/api.service.ts
```

Логика:

1. Frontend вызывает `GET /api/articles`.
2. Backend достает новости из PostgreSQL.
3. Новости сортируются:
   - сначала важные;
   - затем по дате публикации;
   - затем по дате получения.
4. Backend добавляет счетчики реакций.
5. Если пользователь авторизован, backend добавляет его текущую реакцию.
6. Frontend группирует новости по категориям.
7. Важные новости отображаются отдельной сеткой сверху.

Поиск:

```text
GET /api/articles?q=текст
```

Поиск идет по заголовку новости.

---

## 9. Как работает агрегация NewsData

Файлы:

```text
backend/app/services/news_aggregator.py
backend/app/services/seed.py
backend/app/api/news.py
```

Логика:

1. В `.env` задается `NEWSDATA_API_KEY`.
2. При старте `seed.py` создает источник `NewsData RU`.
3. Администратор нажимает «Запустить агрегацию».
4. Frontend вызывает `POST /api/admin/aggregate`.
5. Backend берет активные источники.
6. Для NewsData выполняется HTTP-запрос.
7. Backend читает JSON:
   - `title`;
   - `description`;
   - `link`;
   - `image_url`;
   - `pubDate`;
   - `category`.
8. Категории NewsData переводятся во внутренние категории.
9. Дубли отсекаются по URL.
10. Новые новости сохраняются в `news_articles`.

Категории:

```text
crime       -> Происшествия
education   -> Образование
environment -> Мир
sports      -> Спорт
technology  -> Технологии
```

Почему используется `description`, а не `content`:

> В бесплатном тарифе NewsData поле `content` может возвращать текст `ONLY AVAILABLE IN PAID PLANS`, поэтому для полноценного описания используется `description`.

---

## 10. Как работают ручные важные новости

Файлы:

```text
backend/app/api/news.py
frontend/src/app/pages/admin-page.component.ts
frontend/src/app/pages/feed-page.component.ts
frontend/src/assets/news/
```

Логика:

1. Администратор открывает админ-панель.
2. Заполняет заголовок, категорию, изображение, ссылку и текст.
3. Если категория `Важная`, новость будет показана в блоке важных.
4. Если ссылка не указана, backend сам создает локальный URL.
5. Источником становится `Редакция агрегатора`.

Картинки лежат здесь:

```text
frontend/src/assets/news/
```

Пути в новостях:

```text
/assets/news/zmp-album.png
/assets/news/minion-banana.png
/assets/news/dormitory-missing.png
/assets/news/bakery-fire.png
```

---

## 11. Как работают реакции

Файлы:

```text
backend/app/models/reaction.py
backend/alembic/versions/20260608_0004_article_reactions.py
backend/app/api/news.py
frontend/src/app/pages/feed-page.component.ts
frontend/src/app/models/api.models.ts
```

Типы реакций:

```text
like
love
laugh
wow
```

Логика:

1. Пользователь нажимает реакцию.
2. Frontend вызывает:

```text
POST /api/articles/{article_id}/reaction
```

3. Backend проверяет JWT.
4. Backend смотрит, есть ли реакция этого пользователя на эту новость.
5. Если реакции нет — создает.
6. Если такая же реакция уже есть — удаляет.
7. Если реакция другая — заменяет.
8. Backend возвращает новые счетчики.
9. Frontend обновляет карточку новости.

Почему пользователь может поставить только одну реакцию:

> В таблице `article_reactions` есть уникальное ограничение на пару `article_id` и `user_id`. Поэтому один пользователь физически не может иметь две реакции на одну новость.

---

## 12. Как работает админ-панель

Файл:

```text
frontend/src/app/pages/admin-page.component.ts
```

Backend:

```text
backend/app/api/admin.py
backend/app/api/news.py
```

В админке есть:

- добавление новости;
- управление источниками;
- запуск агрегации;
- список пользователей;
- блокировка обычных пользователей;
- список backup;
- создание backup;
- восстановление backup;
- применение миграций;
- просмотр логов;
- удаление новостей.

Почему админа нельзя заблокировать:

> Если случайно заблокировать единственного администратора, можно потерять доступ к управлению системой. Поэтому backend запрещает деактивацию пользователей с ролью `admin`, а frontend отключает checkbox активности у администратора.

Где это реализовано:

```text
backend/app/api/admin.py
frontend/src/app/pages/admin-page.component.ts
```

---

## 13. Как работает backup и restore

Файл:

```text
backend/app/services/backup.py
```

Endpoints:

```text
GET  /api/admin/backups
POST /api/admin/backups
POST /api/admin/backups/restore
```

Создание backup:

1. Backend читает `DATABASE_URL`.
2. Формирует команду `pg_dump`.
3. Создает файл вида:

```text
backup_YYYYMMDD_HHMMSS.dump
```

4. Записывает информацию в таблицу `backups`.
5. Логирует действие.

Восстановление:

1. Backend проверяет наличие файла.
2. Вызывает `pg_restore`.
3. Обновляет статус backup.
4. Логирует действие.

Что сказать:

> Я использовал штатные инструменты PostgreSQL `pg_dump` и `pg_restore`, потому что они надежнее и правильнее для резервного копирования PostgreSQL, чем ручная выгрузка таблиц.

---

## 14. Как работают миграции

Папка:

```text
backend/alembic/versions/
```

Команда:

```powershell
cd backend
python -m alembic upgrade head
```

Миграции:

- `20260528_0001_initial_schema.py` — основная схема;
- `20260602_0002_manual_articles_images.py` — картинки и важные новости;
- `20260604_0003_seed_news_categories.py` — категории;
- `20260608_0004_article_reactions.py` — реакции.

Что сказать:

> Миграции нужны, чтобы структура базы данных изменялась контролируемо. Если проект запускается на другой машине, достаточно применить миграции, и структура БД будет такой же.

---

## 15. Как работают тесты

Папка:

```text
backend/tests/
```

Запуск:

```powershell
cd backend
pytest
```

Тестовая база:

```text
sqlite+pysqlite:///:memory:
```

Это задается в:

```text
backend/tests/conftest.py
```

Почему SQLite в тестах:

> Для тестов используется временная база в памяти, чтобы тесты не трогали настоящую PostgreSQL-базу и запускались быстрее.

### test_auth.py

Проверяет:

- регистрацию;
- вход;
- получение `/me`;
- refresh token;
- логирование неправильного входа;
- запрет повторного email;
- запрет повторного логина;
- запрет логинов с пробелами и лишними символами.

### test_rbac.py

Проверяет:

- обычный пользователь не может открыть admin endpoints;
- администратор может управлять источниками;
- администратора нельзя заблокировать.

### test_news.py

Проверяет:

- поиск новостей;
- создание важной новости с картинкой;
- обязательность заголовка и текста;
- одну реакцию пользователя на одну новость;
- замену реакции;
- удаление реакции;
- агрегацию NewsData API.

### test_backup.py

Проверяет:

- endpoint создания backup;
- вызов backup-сервиса;
- запись статуса и размера backup.

### test_security.py

Проверяет:

- защищенный endpoint требует токен;
- пароль при регистрации должен быть достаточной длины.

### test_frontend_contract.py

Проверяет:

- наличие обязательных frontend-страниц;
- наличие темной темы.

Что сказать преподавателю:

> Тесты проверяют не внешний вид, а критичную бизнес-логику: авторизацию, права доступа, новости, реакции, backup и безопасность. Это помогает убедиться, что после изменений основные функции не сломались.

---

## 16. Почему выбран такой стек

FastAPI:

- быстрый REST API;
- автоматический Swagger;
- удобная валидация через Pydantic;
- хорошо подходит для учебного backend.

Angular:

- полноценный SPA-фреймворк;
- есть маршрутизация, сервисы, guards, формы;
- удобно разделять страницы и логику.

PostgreSQL:

- надежная реляционная БД;
- внешние ключи;
- индексы;
- ограничения;
- подходит для связанных данных.

SQLAlchemy:

- ORM;
- меньше ручного SQL;
- безопаснее за счет параметризованных запросов.

Alembic:

- управляет изменениями схемы БД;
- удобно переносить проект на другую машину.

JWT:

- удобно использовать в REST API;
- frontend может отправлять токен в заголовке.

---

## 17. Типовые вопросы преподавателя и ответы

### Почему проект разделен на backend и frontend?

Чтобы разделить ответственность. Backend отвечает за данные, безопасность, бизнес-логику и API. Frontend отвечает за интерфейс пользователя. Такой подход проще развивать и поддерживать.

### Почему не хранить пароль в базе напрямую?

Пароли нельзя хранить открытым текстом. В проекте используется bcrypt-хеширование. Даже если кто-то получит доступ к базе, он не увидит реальные пароли.

### Почему нужны refresh-токены?

Access token должен жить недолго. Refresh token позволяет обновить сессию без повторного входа. При logout refresh token отзывается.

### Почему нельзя заблокировать администратора?

Чтобы не потерять доступ к системе управления. Если заблокировать единственного администратора, нельзя будет управлять пользователями и настройками.

### Как защищены админские функции?

На backend используется зависимость `get_current_admin`, которая проверяет JWT и роль пользователя. Frontend guard только улучшает удобство, но главная защита находится на backend.

### Как предотвращаются дубли новостей?

У новости есть уникальный URL. Перед сохранением агрегатор проверяет, есть ли уже новость с таким URL.

### Почему реакции сделаны отдельной таблицей?

Реакция связывает пользователя и новость. Это связь многие-ко-многим с дополнительным полем `reaction`, поэтому нужна отдельная таблица `article_reactions`.

### Как обеспечено «одна реакция на новость»?

В таблице `article_reactions` есть уникальное ограничение на `article_id` и `user_id`.

### Что будет, если пользователь нажмет ту же реакцию еще раз?

Реакция удалится. Это работает как переключатель.

### Что будет, если пользователь выберет другую реакцию?

Старая реакция заменится новой.

### Почему используется NewsData API?

NewsData возвращает структурированный JSON: заголовок, описание, ссылку, дату, категорию и изображение. Это удобнее для агрегации, чем парсить разные сайты вручную.

### Почему используется поле `description`, а не `content`?

На бесплатном тарифе NewsData поле `content` может быть недоступно. Поэтому используется `description`.

### Зачем нужны миграции?

Чтобы изменения структуры базы были воспроизводимыми. На другой машине можно применить миграции и получить такую же схему БД.

### Зачем нужны тесты?

Чтобы проверить основные сценарии: регистрацию, вход, права доступа, новости, реакции и backup. Тесты помогают находить ошибки после изменений.

### Почему тесты используют SQLite, если проект на PostgreSQL?

SQLite in-memory используется только для быстрых изолированных тестов. Основная рабочая база — PostgreSQL.

### Где хранится API-ключ NewsData?

В `.env` в переменной `NEWSDATA_API_KEY`. В публичные файлы его лучше не добавлять.

### Где находится схема базы?

Основная SQL-схема лежит в:

```text
backend/sql/schema.sql
```

А актуальные изменения схемы лежат в миграциях:

```text
backend/alembic/versions/
```

### Где находится главная страница сайта?

```text
frontend/src/app/pages/feed-page.component.ts
```

### Где находится админ-панель?

```text
frontend/src/app/pages/admin-page.component.ts
```

### Где находится логика агрегации?

```text
backend/app/services/news_aggregator.py
```

### Где находится логика регистрации?

```text
backend/app/api/auth.py
backend/app/schemas/auth.py
frontend/src/app/pages/register-page.component.ts
```

### Где находятся картинки новостей?

```text
frontend/src/assets/news/
```

---

## 18. Что говорить, если что-то не запустилось у преподавателя

Проверить PostgreSQL:

```powershell
psql -U postgres
```

Проверить `.env`:

```text
DATABASE_URL=postgresql+psycopg://news:news@127.0.0.1:5432/newsdb
```

Проверить миграции:

```powershell
cd backend
python -m alembic upgrade head
```

Проверить backend:

```text
http://localhost:8000/docs
```

Проверить frontend:

```text
http://localhost:4200
```

Если frontend не запускается:

```powershell
cd frontend
npm install
npm start
```

Если backend не запускается:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

---

## 19. Быстрый маршрут по коду для демонстрации

1. `backend/app/main.py` — показать подключение роутеров.
2. `backend/app/models/` — показать модели БД.
3. `backend/alembic/versions/` — показать миграции.
4. `backend/app/api/auth.py` — показать регистрацию/вход.
5. `backend/app/api/news.py` — показать новости и реакции.
6. `backend/app/services/news_aggregator.py` — показать NewsData.
7. `frontend/src/app/pages/feed-page.component.ts` — показать ленту.
8. `frontend/src/app/pages/admin-page.component.ts` — показать админку.
9. `backend/tests/test_news.py` — показать тесты реакций и NewsData.
10. `backend/tests/test_auth.py` — показать тесты регистрации.

---

## 20. Сильные стороны проекта

- Есть полноценные backend и frontend.
- Есть база PostgreSQL с миграциями.
- Есть авторизация и роли.
- Есть админ-панель.
- Есть интеграция с внешним API.
- Есть ручные важные новости.
- Есть реакции пользователей.
- Есть защита от блокировки администратора.
- Есть backup/restore.
- Есть журнал действий.
- Есть автоматические тесты.
- Есть README с инструкцией запуска.

---

## 21. Что можно назвать перспективами развития

Если спросят, что можно улучшить:

- добавить автоматический запуск агрегации по расписанию;
- добавить комментарии к новостям;
- добавить расширенную модерацию;
- добавить пагинацию на frontend;
- добавить фильтр по источникам;
- добавить аналитику популярных новостей;
- добавить загрузку изображений через форму, а не только URL;
- добавить email-подтверждение регистрации;
- подготовить production-деплой;
- добавить больше frontend-тестов.

