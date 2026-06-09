from datetime import datetime, timezone

from app.models.article import NewsArticle
from app.models.category import Category
from app.models.source import NewsSource
from app.services import news_aggregator


def test_article_feed_filters_by_query(client, db_session):
    category = Category(name="Тест")
    source = NewsSource(name="Local", url="https://local.test/rss", type="rss")
    db_session.add_all([category, source])
    db_session.flush()
    db_session.add(
        NewsArticle(
            source_id=source.id,
            category_id=category.id,
            title="Angular и FastAPI в учебной практике",
            content="Материал про интеграцию.",
            url="https://local.test/article-1",
            published_at=datetime.now(timezone.utc),
            category=category.name,
        )
    )
    db_session.commit()

    response = client.get("/api/articles?q=FastAPI")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["source"]["name"] == "Local"


def test_admin_can_create_featured_article_with_image(client):
    login = client.post("/api/auth/login", json={"email": "admin@example.com", "password": "test-admin-password"})
    token = login.json()["access_token"]
    created = client.post(
        "/api/admin/articles",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Своя главная новость",
            "content": "Текст новости, добавленной администратором вручную.",
            "category": "Важная",
            "image_url": "https://example.com/news.jpg",
            "is_featured": True,
        },
    )

    assert created.status_code == 201
    assert created.json()["image_url"] == "https://example.com/news.jpg"
    assert created.json()["is_featured"] is True

    feed = client.get("/api/articles")
    assert feed.status_code == 200
    assert feed.json()[0]["title"] == "Своя главная новость"


def test_admin_article_requires_title_and_content(client):
    login = client.post("/api/auth/login", json={"email": "admin@example.com", "password": "test-admin-password"})
    token = login.json()["access_token"]
    response = client.post(
        "/api/admin/articles",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "     ",
            "content": "     ",
            "category": "Важная",
            "is_featured": True,
        },
    )

    assert response.status_code == 422


def test_user_can_have_only_one_reaction_per_article(client):
    admin_login = client.post("/api/auth/login", json={"email": "admin@example.com", "password": "test-admin-password"})
    admin_token = admin_login.json()["access_token"]
    created = client.post(
        "/api/admin/articles",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "Reaction test article",
            "content": "Article content for reaction testing.",
            "category": "РњРёСЂ",
            "is_featured": False,
        },
    )
    assert created.status_code == 201
    article_id = created.json()["id"]

    client.post("/api/auth/register", json={"username": "reactor", "email": "reactor@example.com", "password": "strongpass123"})
    login = client.post("/api/auth/login", json={"email": "reactor@example.com", "password": "strongpass123"})
    token = login.json()["access_token"]

    liked = client.post(f"/api/articles/{article_id}/reaction", headers={"Authorization": f"Bearer {token}"}, json={"reaction": "like"})
    assert liked.status_code == 200
    assert liked.json()["user_reaction"] == "like"
    assert liked.json()["reaction_counts"]["like"] == 1

    loved = client.post(f"/api/articles/{article_id}/reaction", headers={"Authorization": f"Bearer {token}"}, json={"reaction": "love"})
    assert loved.status_code == 200
    assert loved.json()["user_reaction"] == "love"
    assert loved.json()["reaction_counts"]["like"] == 0
    assert loved.json()["reaction_counts"]["love"] == 1

    removed = client.post(f"/api/articles/{article_id}/reaction", headers={"Authorization": f"Bearer {token}"}, json={"reaction": "love"})
    assert removed.status_code == 200
    assert removed.json()["user_reaction"] is None
    assert removed.json()["reaction_counts"]["love"] == 0


def test_newsdata_api_source_is_aggregated(client, db_session, monkeypatch):
    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {
                "status": "success",
                "results": [
                    {
                        "title": "Тестовая технологическая новость",
                        "description": "Описание новости из NewsData.",
                        "content": "ONLY AVAILABLE IN PAID PLANS",
                        "link": "https://example.com/newsdata-test",
                        "image_url": "https://example.com/news.jpg",
                        "pubDate": "2026-06-08 02:24:00",
                        "category": ["technology"],
                        "source_name": "Example",
                    }
                ],
            }

    monkeypatch.setattr(news_aggregator.httpx, "get", lambda *args, **kwargs: FakeResponse())
    source = NewsSource(name="NewsData RU", url="https://newsdata.io/api/1/latest?apikey=test", type="api", is_active=True)
    db_session.add(source)
    db_session.commit()

    created = news_aggregator.fetch_source(db_session, source)

    assert created == 1
    article = db_session.query(NewsArticle).filter(NewsArticle.url == "https://example.com/newsdata-test").one()
    assert article.title == "Тестовая технологическая новость"
    assert article.content == "Описание новости из NewsData."
    assert article.image_url == "https://example.com/news.jpg"
    assert article.category == "Технологии"
