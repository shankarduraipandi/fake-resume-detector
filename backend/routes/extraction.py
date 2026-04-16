from flask import Blueprint, jsonify, request

from database import db
from models import Resume
from services.file_service import extract_text_from_resume
from services.gemini_service import extract_resume_data
from services.user_service import upsert_user_from_extracted_data
from utils.helpers import get_request_data, normalize_blank, normalize_phone, pick_value
from utils.responses import error_response


extraction_bp = Blueprint("extraction", __name__)


def _normalize_extracted_payload(payload: dict, existing: dict | None = None) -> dict:
    current = existing or {}
    skills = payload.get("skills", current.get("skills", []))

    if isinstance(skills, str):
        skills = [item.strip() for item in skills.split(",") if item.strip()]

    normalized_skills = [str(skill).strip() for skill in skills if str(skill).strip()]

    return {
        "name": normalize_blank(payload.get("name")) or current.get("name") or "Not mentioned",
        "email": normalize_blank(payload.get("email")) or current.get("email") or "Not mentioned",
        "phone": normalize_phone(payload.get("phone")) or current.get("phone") or "Not mentioned",
        "skills": normalized_skills or current.get("skills") or ["Not mentioned"],
        "experience": normalize_blank(payload.get("experience")) or current.get("experience") or "Not mentioned",
        "education": normalize_blank(payload.get("education")) or current.get("education") or "Not mentioned",
        "location": normalize_blank(payload.get("location")) or current.get("location") or "Not mentioned",
    }


@extraction_bp.route("/extract", methods=["POST"])
def extract_resume():
    payload = get_request_data(request)
    file_id = pick_value(payload, "fileId", "file_id")

    if not file_id:
        return error_response("file_id is required.", 400)

    try:
        file_id = int(file_id)
    except (TypeError, ValueError):
        return error_response("file_id must be a valid integer.", 400)

    resume = Resume.query.get(file_id)
    if not resume:
        return error_response("Resume file not found.", 404)

    try:
        resume_text = extract_text_from_resume(resume.file_path)
        extracted_data = extract_resume_data(resume_text, resume.file_path)
        user = upsert_user_from_extracted_data(extracted_data)

        resume.extracted_data = extracted_data
        if user:
            resume.user_id = user.id

        db.session.commit()

        print(f"[EXTRACT] Extracted data for resume #{resume.id}")
        return jsonify(
            {
                **extracted_data,
                "success": True,
                "fileId": str(resume.id),
                "file_id": resume.id,
                "extractedData": extracted_data,
            }
        )
    except Exception as error:
        db.session.rollback()
        print(f"[EXTRACT] Failed for resume #{file_id}: {error}")
        return error_response("Failed to extract resume details.", 500)


@extraction_bp.route("/resume/<int:file_id>/details", methods=["PUT"])
def update_resume_details(file_id: int):
    payload = get_request_data(request)
    resume = Resume.query.get(file_id)
    if not resume:
        return error_response("Resume file not found.", 404)

    updated_data = _normalize_extracted_payload(payload, resume.extracted_data)
    user = upsert_user_from_extracted_data(updated_data)

    try:
        resume.extracted_data = updated_data
        if user:
            resume.user_id = user.id

        db.session.commit()
        print(f"[EXTRACT] Updated extracted details for resume #{resume.id}")
        return jsonify(
            {
                "success": True,
                "message": "Resume details updated successfully.",
                "fileId": str(resume.id),
                "file_id": resume.id,
                "extractedData": updated_data,
            }
        )
    except Exception as error:
        db.session.rollback()
        print(f"[EXTRACT] Failed to update resume #{resume.id}: {error}")
        return error_response("Failed to update extracted details.", 500)
