from flask import Blueprint, jsonify, request

from database import db
from models import Resume
from services.gemini_service import suggest_job_roles
from services.scoring_service import calculate_resume_score
from utils.helpers import get_request_data, pick_value
from utils.responses import error_response


analysis_bp = Blueprint("analysis", __name__)


@analysis_bp.route("/calculate-score", methods=["POST"])
def calculate_score():
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
    if not resume.extracted_data:
        return error_response("Resume must be extracted before scoring.", 400)

    score_data = calculate_resume_score(resume=resume, payload=payload)

    resume.score = score_data["score"]
    resume.fake_probability = score_data["fakeProbability"]
    db.session.commit()

    return jsonify(score_data)


@analysis_bp.route("/job-suggestions", methods=["POST"])
def job_suggestions():
    payload = get_request_data(request)
    skills = payload.get("skills", [])
    if isinstance(skills, str):
        skills = [item.strip() for item in skills.split(",") if item.strip()]

    if not skills:
        return error_response("skills are required.", 400)

    suggestions = suggest_job_roles(skills)
    return jsonify(
        {
            "success": True,
            "jobSuggestions": suggestions,
            "job_suggestions": suggestions,
        }
    )


@analysis_bp.route("/analyze", methods=["POST"])
def analyze_resume():
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

    if not resume.extracted_data:
        return error_response("Resume must be extracted before analysis.", 400)

    score_data = calculate_resume_score(resume=resume, payload=payload)
    job_suggestions_data = suggest_job_roles(resume.extracted_data.get("skills", []))
    external_verification = payload.get("externalVerification") or payload.get(
        "external_verification"
    )

    resume.score = score_data["score"]
    resume.fake_probability = score_data["fakeProbability"]
    db.session.commit()

    return jsonify(
        {
            "status": score_data["status"],
            "score": score_data["score"],
            "fakeProbability": score_data["fakeProbability"],
            "extractedData": resume.extracted_data,
            "jobSuggestions": job_suggestions_data,
            "details": score_data["details"],
            "externalVerification": external_verification,
        }
    )
