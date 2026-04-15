from datetime import datetime

from database import db


class OTPVerification(db.Model):
    __tablename__ = "otp_verifications"

    id = db.Column(db.Integer, primary_key=True)
    phone = db.Column(db.String(255), nullable=False, index=True)
    otp = db.Column(db.String(6), nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
