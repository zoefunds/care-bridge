"""add status columns to symptom_analyses and medications

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-28
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("symptom_analyses", sa.Column("status", sa.String(20), nullable=False, server_default="pending"))
    op.add_column("medications", sa.Column("status", sa.String(20), nullable=False, server_default="pending"))


def downgrade() -> None:
    op.drop_column("symptom_analyses", "status")
    op.drop_column("medications", "status")
