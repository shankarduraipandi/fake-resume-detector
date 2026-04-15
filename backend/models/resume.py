from datetime import datetime

from database import db


class Resume(db.Model):
    __tablename__ = "resumes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    file_path = db.Column(db.String(500), nullable=False)
    extracted_data = db.Column(db.JSON, nullable=True)
    score = db.Column(db.Integer, nullable=True)
    fake_probability = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("User", back_populates="resumes")
