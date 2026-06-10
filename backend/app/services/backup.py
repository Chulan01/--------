import os
import shutil
import subprocess
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal, engine
from app.models.backup import Backup
from app.services.audit import write_log


def _postgres_tool(name: str) -> str:
    executable = shutil.which(name)
    if executable:
        return executable

    candidates = [
        Path("C:/Program Files/PostgreSQL/18/bin") / f"{name}.exe",
        Path("C:/Program Files/PostgreSQL/17/bin") / f"{name}.exe",
        Path("C:/Program Files/PostgreSQL/16/bin") / f"{name}.exe",
        Path("C:/Program Files/PostgreSQL/15/bin") / f"{name}.exe",
        Path("C:/Program Files/PostgreSQL/14/bin") / f"{name}.exe",
    ]
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)

    return name


def _postgres_env_and_args() -> tuple[dict[str, str], dict[str, str]]:
    parsed = urlparse(settings.database_url.replace("postgresql+psycopg", "postgresql"))
    env = os.environ.copy()
    if parsed.password:
        env["PGPASSWORD"] = parsed.password
    args = {
        "host": parsed.hostname or "localhost",
        "port": str(parsed.port or 5432),
        "user": parsed.username or "postgres",
        "dbname": parsed.path.lstrip("/"),
    }
    return env, args


def create_backup(db: Session, user_id: int | None = None, ip_address: str | None = None) -> Backup:
    backup_dir = Path(settings.backup_dir)
    backup_dir.mkdir(parents=True, exist_ok=True)
    filename = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.dump"
    path = backup_dir / filename
    env, args = _postgres_env_and_args()
    command = [
        _postgres_tool("pg_dump"),
        "-Fc",
        "-h",
        args["host"],
        "-p",
        args["port"],
        "-U",
        args["user"],
        "-f",
        str(path),
        args["dbname"],
    ]
    backup = Backup(filename=filename, size=0, status="failed")
    db.add(backup)
    db.commit()
    try:
        subprocess.run(command, env=env, check=True, capture_output=True, text=True, timeout=120)
        backup.size = path.stat().st_size
        backup.status = "created"
        db.commit()
        write_log(
            db,
            action="backup_create",
            entity="backups",
            message=f"Backup {filename} was created.",
            user_id=user_id,
            ip_address=ip_address,
        )
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        backup.status = "failed"
        db.commit()
        write_log(
            db,
            action="backup_error",
            entity="backups",
            level="error",
            message=f"Backup failed: {exc}",
            user_id=user_id,
            ip_address=ip_address,
        )
        raise
    db.refresh(backup)
    return backup


def restore_backup(db: Session, filename: str, user_id: int | None = None, ip_address: str | None = None) -> Backup:
    path = Path(settings.backup_dir) / filename
    if not path.exists():
        raise FileNotFoundError(f"Backup file was not found: {filename}")

    env, args = _postgres_env_and_args()
    command = [
        _postgres_tool("pg_restore"),
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-privileges",
        "-h",
        args["host"],
        "-p",
        args["port"],
        "-U",
        args["user"],
        "-d",
        args["dbname"],
        str(path),
    ]

    try:
        db.execute(
            text(
                "select pg_terminate_backend(pid) "
                "from pg_stat_activity "
                "where datname = :dbname and pid <> pg_backend_pid()"
            ),
            {"dbname": args["dbname"]},
        )
        db.commit()
    except Exception:  # noqa: BLE001
        db.rollback()

    db.close()
    engine.dispose()

    subprocess.run(command, env=env, check=True, capture_output=True, text=True, timeout=120)
    engine.dispose()

    restored_db = SessionLocal()
    try:
        backup = restored_db.query(Backup).filter(Backup.filename == filename).one_or_none()
        if backup is None:
            backup = Backup(filename=filename, size=path.stat().st_size, status="restored")
            restored_db.add(backup)
        else:
            backup.status = "restored"
            backup.size = path.stat().st_size
        restored_db.commit()
        restored_db.refresh(backup)
        write_log(
            restored_db,
            action="backup_restore",
            entity="backups",
            message=f"Backup {filename} was restored.",
            user_id=user_id,
            ip_address=ip_address,
        )
        restored_db.refresh(backup)
        restored_db.expunge(backup)
        return backup
    finally:
        restored_db.close()
