import os
import sys
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-with-at-least-32-chars"
os.environ["FIRST_ADMIN_USERNAME"] = "admin"
os.environ["FIRST_ADMIN_EMAIL"] = "admin@example.com"
os.environ["FIRST_ADMIN_PASSWORD"] = "test-admin-password"
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi.testclient import TestClient

from app.db.base import Base
from app.db.session import SessionLocal, engine, get_db
from app.main import app
from app.services.seed import seed_data


@pytest.fixture()
def db_session():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_data(db)
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
