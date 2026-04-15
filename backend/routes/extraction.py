from flask import Blueprint, jsonify, request

from database import db
from models import Resume
from services.file_service import extract_text_from_resume
from services.gemini_service import extract_resume_data
from services.user_service import upsert_user_from_extracted_data
from utils.helpers import get_request_data, pick_value
from utils.responses import error_response


extraction_bp = Blueprint("extraction", __name__)


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
