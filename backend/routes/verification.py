from flask import Blueprint, jsonify, request

from services.github_service import verify_github_profile
from services.linkedin_service import verify_linkedin_profile
from services.otp_service import generate_and_send_otp, verify_otp_code
from utils.helpers import get_request_data, pick_value
from utils.responses import error_response


verification_bp = Blueprint("verification", __name__)


@verification_bp.route("/send-otp", methods=["POST"])
def send_otp():
    payload = get_request_data(request)
    phone = pick_value(payload, "phone", "phoneNumber")
    email = pick_value(payload, "email")

    result = generate_and_send_otp(phone=phone, email=email)
    if not result["success"]:
        return error_response(result["message"], 400)
    return jsonify(result)


@verification_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    payload = get_request_data(request)
    phone = pick_value(payload, "phone", "phoneNumber")
    email = pick_value(payload, "email")
    otp = pick_value(payload, "otp", "code")

    if not otp:
        return error_response("otp is required.", 400)

    result = verify_otp_code(otp=otp, phone=phone, email=email)
    status_code = 200 if result["success"] else 400
    return jsonify(result), status_code


@verification_bp.route("/verify-github", methods=["POST"])
def verify_github():
    payload = get_request_data(request)
    github_url = pick_value(payload, "github_url", "githubUrl", "url")

    if not github_url:
        return error_response("github_url is required.", 400)

    return jsonify(verify_github_profile(github_url))


@verification_bp.route("/verify-linkedin", methods=["POST"])
def verify_linkedin():
    payload = get_request_data(request)
    linkedin_url = pick_value(payload, "linkedin_url", "linkedinUrl", "url")

    if not linkedin_url:
        return error_response("linkedin_url is required.", 400)

    return jsonify(verify_linkedin_profile(linkedin_url))
