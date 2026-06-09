"""add article reactions

Revision ID: 20260608_0004
Revises: 20260604_0003
Create Date: 2026-06-08
"""

from alembic import op
import sqlalchemy as sa

revision = "20260608_0004"
down_revision = "20260604_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "article_reactions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("article_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("reaction", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("reaction in ('like', 'love', 'laugh', 'wow')", name="ck_article_reactions_reaction"),
        sa.ForeignKeyConstraint(["article_id"], ["news_articles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("article_id", "user_id", name="uq_article_reactions_article_user"),
    )
    op.create_index("ix_article_reactions_article_id", "article_reactions", ["article_id"])
    op.create_index("ix_article_reactions_user_id", "article_reactions", ["user_id"])
    op.create_index("ix_article_reactions_reaction", "article_reactions", ["reaction"])


def downgrade() -> None:
    op.drop_index("ix_article_reactions_reaction", table_name="article_reactions")
    op.drop_index("ix_article_reactions_user_id", table_name="article_reactions")
    op.drop_index("ix_article_reactions_article_id", table_name="article_reactions")
    op.drop_table("article_reactions")
