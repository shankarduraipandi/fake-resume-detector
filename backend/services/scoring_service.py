from services.gemini_service import validate_resume_consistency
from services.otp_service import is_otp_verified
from utils.helpers import pick_value, to_bool


def calculate_resume_score(resume, payload: dict) -> dict:
    external_verification = payload.get("externalVerification") or payload.get(
        "external_verification"
    ) or {}

    phone = pick_value(payload, "phone", "phoneNumber")
    email = pick_value(payload, "email")

    github_status = (
        external_verification.get("github", {}).get("status")
        if isinstance(external_verification, dict)
        else None
    )
    linkedin_status = (
        external_verification.get("linkedin", {}).get("status")
        if isinstance(external_verification, dict)
        else None
    )

    github_verified = to_bool(
        payload.get("github_verified")
        or payload.get("githubVerified")
        or github_status == "verified"
    )
    linkedin_verified = to_bool(
        payload.get("linkedin_verified")
        or payload.get("linkedinVerified")
        or linkedin_status == "verified"
    )
    otp_verified = to_bool(
        payload.get("otp_verified")
        or payload.get("otpVerified")
        or is_otp_verified(phone=phone, email=email)
    )

    consistency_result = validate_resume_consistency(resume.extracted_data or {})
    consistency_ok = bool(consistency_result.get("consistent"))

    details = [
        {
            "category": "OTP Verification",
            "result": (
                "Candidate identity confirmed via one-time password."
                if otp_verified
                else "Candidate identity could not be confirmed via OTP."
            ),
            "points": 30,
            "ok": otp_verified,
        },
        {
            "category": "GitHub Activity",
            "result": (
                "Public GitHub profile detected and validated."
                if github_verified
                else "No verified GitHub profile found."
            ),
            "points": 20,
            "ok": github_verified,
        },
        {
            "category": "LinkedIn Presence",
            "result": (
                "Professional LinkedIn profile detected."
                if linkedin_verified
                else "No verified LinkedIn profile found."
            ),
            "points": 15,
            "ok": linkedin_verified,
        },
        {
            "category": "Resume Consistency",
            "result": consistency_result.get("reason", "Resume consistency checked."),
            "points": 35,
            "ok": consistency_ok,
        },
    ]

    score = sum(item["points"] for item in details if item["ok"])
    fake_probability = max(0, min(100, 100 - score))

    if score >= 80:
        status = "Verified"
    elif score >= 50:
        status = "Suspicious"
    else:
        status = "Fake"

    return {
        "success": True,
        "status": status,
        "score": score,
        "fakeProbability": fake_probability,
        "details": details,
        "authenticity_score": score,
        "fake_probability": fake_probability,
        "breakdown": details,
    }
