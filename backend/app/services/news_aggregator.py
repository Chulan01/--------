from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import feedparser
import httpx
from sqlalchemy.orm import Session

from app.models.article import NewsArticle
from app.models.category import Category
from app.models.source import NewsSource
from app.services.audit import write_log

NEWS_DATA_CATEGORY_MAP = {
    "crime": "\u041f\u0440\u043e\u0438\u0441\u0448\u0435\u0441\u0442\u0432\u0438\u044f",
    "education": "\u041e\u0431\u0440\u0430\u0437\u043e\u0432\u0430\u043d\u0438\u0435",
    "environment": "\u041c\u0438\u0440",
    "sports": "\u0421\u043f\u043e\u0440\u0442",
    "technology": "\u0422\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0438\u0438",
}


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = parsedate_to_datetime(value)
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed
    except (TypeError, ValueError):
        return None


def _parse_newsdata_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
    except ValueError:
        return _parse_datetime(value)


def _get_or_create_category(db: Session, name: str) -> Category:
    category_name = name.strip()[:100] or "\u041c\u0438\u0440"
    category = db.query(Category).filter(Category.name == category_name).one_or_none()
    if category is None:
        category = Category(name=category_name)
        db.add(category)
        db.flush()
    return category


def _category_for_rss_entry(db: Session, entry: dict) -> Category:
    tags = entry.get("tags") or []
    name = tags[0].get("term") if tags else None
    return _get_or_create_category(db, name or "\u041c\u0438\u0440")


def _category_for_newsdata_item(db: Session, item: dict) -> Category:
    categories = item.get("category") or []
    for category in categories:
        mapped = NEWS_DATA_CATEGORY_MAP.get(category)
        if mapped:
            return _get_or_create_category(db, mapped)
    return _get_or_create_category(db, "\u041c\u0438\u0440")


def _image_for_entry(entry: dict) -> str | None:
    media = entry.get("media_content") or []
    for item in media:
        url = item.get("url")
        if url:
            return url[:700]
    links = entry.get("links") or []
    for link in links:
        href = link.get("href")
        link_type = link.get("type") or ""
        rel = link.get("rel") or ""
        if href and (link_type.startswith("image/") or rel == "enclosure"):
            return href[:700]
    return None


def _fetch_rss_source(db: Session, source: NewsSource) -> int:
    response = httpx.get(source.url, timeout=20, follow_redirects=True)
    response.raise_for_status()
    feed = feedparser.parse(response.text)
    created = 0

    for entry in feed.entries[:30]:
        url = entry.get("link")
        title = (entry.get("title") or "").strip()
        if not url or not title:
            continue
        if db.query(NewsArticle).filter(NewsArticle.url == url).one_or_none():
            continue

        category = _category_for_rss_entry(db, entry)
        content = (
            entry.get("summary")
            or entry.get("description")
            or entry.get("title")
            or "\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435 \u043d\u043e\u0432\u043e\u0441\u0442\u0438 \u043e\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442."
        )
        db.add(
            NewsArticle(
                source_id=source.id,
                category_id=category.id,
                title=title[:500],
                content=content,
                url=url[:700],
                image_url=_image_for_entry(entry),
                published_at=_parse_datetime(entry.get("published") or entry.get("updated")),
                fetched_at=datetime.now(timezone.utc),
                category=category.name,
            )
        )
        created += 1

    db.commit()
    write_log(
        db,
        action="aggregate_source",
        entity="news_articles",
        message=f"RSS source {source.name}: added {created} articles.",
    )
    return created


def _fetch_newsdata_source(db: Session, source: NewsSource) -> int:
    response = httpx.get(source.url, timeout=20, follow_redirects=True)
    response.raise_for_status()
    payload = response.json()
    if payload.get("status") != "success":
        raise ValueError(f"NewsData returned status {payload.get('status')}")

    created = 0
    for item in (payload.get("results") or [])[:30]:
        url = item.get("link")
        title = (item.get("title") or "").strip()
        if not url or not title:
            continue
        if db.query(NewsArticle).filter(NewsArticle.url == url).one_or_none():
            continue

        category = _category_for_newsdata_item(db, item)
        content = (
            item.get("description")
            or item.get("summary")
            or item.get("title")
            or "\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435 \u043d\u043e\u0432\u043e\u0441\u0442\u0438 \u043e\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442."
        )
        db.add(
            NewsArticle(
                source_id=source.id,
                category_id=category.id,
                title=title[:500],
                content=content,
                url=url[:700],
                image_url=(item.get("image_url") or None),
                published_at=_parse_newsdata_datetime(item.get("pubDate")),
                fetched_at=datetime.now(timezone.utc),
                category=category.name,
            )
        )
        created += 1

    db.commit()
    write_log(
        db,
        action="aggregate_source",
        entity="news_articles",
        message=f"NewsData source {source.name}: added {created} articles.",
    )
    return created


def fetch_source(db: Session, source: NewsSource) -> int:
    if source.type == "api":
        return _fetch_newsdata_source(db, source)
    if source.type == "rss":
        return _fetch_rss_source(db, source)
    write_log(
        db,
        action="aggregate_skip",
        entity="news_sources",
        level="warning",
        message=f"Unsupported source type {source.type} for {source.name}.",
    )
    return 0


def fetch_all_sources(db: Session) -> dict[str, int]:
    result: dict[str, int] = {}
    sources = db.query(NewsSource).filter(NewsSource.is_active.is_(True)).all()
    for source in sources:
        try:
            result[source.name] = fetch_source(db, source)
        except Exception as exc:  # noqa: BLE001
            db.rollback()
            result[source.name] = 0
            write_log(
                db,
                action="aggregate_error",
                entity="news_sources",
                level="error",
                message=f"Aggregation error for {source.name}: {exc}",
            )
    return result
