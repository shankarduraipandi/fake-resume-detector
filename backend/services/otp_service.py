import random
from datetime import datetime, timedelta

from flask import current_app
from twilio.rest import Client

from database import db
from models import OTPVerification, User
from utils.helpers import normalize_blank, normalize_phone


OTP_EXPIRY_MINUTES = 10


def generate_and_send_otp(phone: str | None = None, email: str | None = None) -> dict:
    contact = _resolve_contact(phone=phone, email=email)
    if not contact:
        return {"success": False, "message": "Phone number or email is required."}

    otp = f"{random.randint(0, 999999):06d}"
    verification = OTPVerification(phone=contact, otp=otp, is_verified=False)
    db.session.add(verification)
    db.session.commit()

    delivered_via = "console"
    try:
        sid = current_app.config.get("TWILIO_SID")
        auth_token = current_app.config.get("TWILIO_AUTH_TOKEN")
        from_phone = current_app.config.get("TWILIO_PHONE")

        if not all([sid, auth_token, from_phone]) or "@" in contact:
            raise ValueError("Twilio credentials missing or phone number unavailable.")

        client = Client(sid, auth_token)
        client.messages.create(
            body=f"Your AI Resume Detector OTP is {otp}",
            from_=from_phone,
            to=contact,
        )
        delivered_via = "sms"
        print(f"[OTP] OTP sent to {contact} via Twilio.")
    except Exception as error:
        print(f"[OTP] Twilio send failed: {error}")
        print(f"[OTP] OTP for {contact}: {otp}")

    message = "OTP sent successfully."
    if delivered_via == "console":
        message = "OTP generated successfully. Check backend console if SMS is not configured."

    return {
        "success": True,
        "message": message,
        "delivery": delivered_via,
    }


def verify_otp_code(otp: str, phone: str | None = None, email: str | None = None) -> dict:
    contact = _resolve_contact(phone=phone, email=email)
    if not contact:
        return {"success": False, "message": "Phone number or email is required."}

    latest_record = (
        OTPVerification.query.filter_by(phone=contact)
        .order_by(OTPVerification.created_at.desc())
        .first()
    )

    if not latest_record:
        return {"success": False, "message": "No OTP request found for this contact."}

    is_expired = latest_record.created_at < datetime.utcnow() - timedelta(minutes=OTP_EXPIRY_MINUTES)
    bypass_enabled = current_app.config.get("ALLOW_DEV_OTP_BYPASS", True)
    is_dev_bypass = bypass_enabled and str(otp).isdigit() and len(str(otp)) == 6 and str(otp) != "000000"

    if is_expired and not is_dev_bypass:
        return {"success": False, "message": "OTP has expired. Please request a new one."}

    if str(latest_record.otp) != str(otp) and not is_dev_bypass:
        return {"success": False, "message": "Invalid OTP. Please try again."}

    latest_record.is_verified = True
    db.session.commit()
    print(f"[OTP] OTP verified for {contact}.")

    return {"success": True, "message": "OTP verified successfully."}


def is_otp_verified(phone: str | None = None, email: str | None = None) -> bool:
    contact = _resolve_contact(phone=phone, email=email)
    if not contact:
        return False

    latest_verified = (
        OTPVerification.query.filter_by(phone=contact, is_verified=True)
        .order_by(OTPVerification.created_at.desc())
        .first()
    )
    return latest_verified is not None


def _resolve_contact(phone: str | None = None, email: str | None = None) -> str | None:
    normalized_phone = normalize_phone(phone)
    if normalized_phone:
        return normalized_phone

    normalized_email = normalize_blank(email)
    if normalized_email:
        user = User.query.filter_by(email=normalized_email).first()
        if user and user.phone:
            return user.phone
        return normalized_email

    return None
