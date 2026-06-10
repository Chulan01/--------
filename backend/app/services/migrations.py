import subprocess
import sys
from pathlib import Path

from sqlalchemy.orm import Session

from app.services.audit import write_log


def apply_migrations(db: Session, user_id: int, ip_address: str | None = None) -> str:
    """Run Alembic migrations from the backend virtual environment."""
    backend_dir = Path(__file__).resolve().parents[2]
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        check=True,
        capture_output=True,
        text=True,
        timeout=120,
        cwd=backend_dir,
    )
    output = result.stdout or result.stderr or "Alembic did not report any changes."
    write_log(db, action="migrations_apply", entity="database", message=output, user_id=user_id, ip_address=ip_address)
    return "Миграции применены. Новых изменений нет."
