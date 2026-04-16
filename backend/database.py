from sqlalchemy import inspect, text

from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


def init_db(app):
    db.init_app(app)

    with app.app_context():
        from models import OTPVerification, Resume, User  # noqa: F401

        db.create_all()
        ensure_schema_updates()


def ensure_schema_updates():
    inspector = inspect(db.engine)
    table_names = set(inspector.get_table_names())

    if "resumes" not in table_names:
        return

    columns = {column["name"] for column in inspector.get_columns("resumes")}
    statements = []

    if "external_verification" not in columns:
        statements.append("ALTER TABLE resumes ADD COLUMN external_verification JSON")

    if "report_data" not in columns:
        statements.append("ALTER TABLE resumes ADD COLUMN report_data JSON")

    if not statements:
        return

    for statement in statements:
        print(f"[DB] Applying schema update: {statement}")
        db.session.execute(text(statement))

    db.session.commit()
