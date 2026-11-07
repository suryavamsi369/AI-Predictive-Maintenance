"""Initial database schema for machines and predictions.

Revision ID: 001_initial_tables
Revises: None
Create Date: 2026-11-07 08:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "001_initial_tables"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create 'machines' table
    op.create_table(
        "machines",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("machine_id", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=True),
        sa.Column("model_type", sa.String(length=100), nullable=True),
        sa.Column("location", sa.String(length=200), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="active"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("machine_id"),
    )
    op.create_index(op.f("ix_machines_machine_id"), "machines", ["machine_id"], unique=True)

    # 2. Create 'predictions' table
    op.create_table(
        "predictions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("machine_id", sa.String(length=100), nullable=False),
        sa.Column("temperature", sa.Float(), nullable=False),
        sa.Column("vibration", sa.Float(), nullable=False),
        sa.Column("pressure", sa.Float(), nullable=False),
        sa.Column("rpm", sa.Float(), nullable=False),
        sa.Column("operating_hours", sa.Float(), nullable=False),
        sa.Column("prediction", sa.String(length=100), nullable=False),
        sa.Column("health_status", sa.String(length=50), nullable=True),
        sa.Column("failure_probability", sa.Float(), nullable=True),
        sa.Column("risk_level", sa.String(length=50), nullable=True),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["machine_id"],
            ["machines.machine_id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_predictions_machine_id"), "predictions", ["machine_id"], unique=False)
    op.create_index(op.f("ix_predictions_timestamp"), "predictions", ["timestamp"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_predictions_timestamp"), table_name="predictions")
    op.drop_index(op.f("ix_predictions_machine_id"), table_name="predictions")
    op.drop_table("predictions")
    op.drop_index(op.f("ix_machines_machine_id"), table_name="machines")
    op.drop_table("machines")

