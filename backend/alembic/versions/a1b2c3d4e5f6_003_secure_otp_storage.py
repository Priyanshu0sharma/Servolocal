"""003_secure_otp_storage

Revision ID: a1b2c3d4e5f6
Revises: 7990e45a57f6
Create Date: 2026-11-10 13:00:00.000000

Expands otp_code column to VARCHAR(255) for secure cryptographic
HMAC-SHA256 hashes and adds 'attempts' counter column for rate and
brute-force protection.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '7990e45a57f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "otp_verifications" in existing_tables:
        cols = {c["name"] for c in inspector.get_columns("otp_verifications")}
        if dialect == "postgresql":
            # Expand otp_code to store 64-character hex hash
            op.execute(
                sa.text("ALTER TABLE otp_verifications ALTER COLUMN otp_code TYPE VARCHAR(255);")
            )
            if "attempts" not in cols:
                op.execute(
                    sa.text("ALTER TABLE otp_verifications ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;")
                )
        else:
            with op.batch_alter_table("otp_verifications") as batch_op:
                batch_op.alter_column(
                    "otp_code",
                    type_=sa.String(255),
                    existing_type=sa.String(10),
                    existing_nullable=False,
                )
                if "attempts" not in cols:
                    batch_op.add_column(
                        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0")
                    )


def downgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "otp_verifications" in existing_tables:
        cols = {c["name"] for c in inspector.get_columns("otp_verifications")}
        if dialect == "postgresql":
            if "attempts" in cols:
                op.execute(sa.text("ALTER TABLE otp_verifications DROP COLUMN IF EXISTS attempts;"))
            op.execute(
                sa.text("ALTER TABLE otp_verifications ALTER COLUMN otp_code TYPE VARCHAR(10);")
            )
        else:
            with op.batch_alter_table("otp_verifications") as batch_op:
                if "attempts" in cols:
                    batch_op.drop_column("attempts")
                batch_op.alter_column(
                    "otp_code",
                    type_=sa.String(10),
                    existing_type=sa.String(255),
                    existing_nullable=False,
                )

