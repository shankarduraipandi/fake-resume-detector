import uuid
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request
from werkzeug.utils import secure_filename

from database import db
from models import Resume
from utils.helpers import allowed_file
from utils.responses import error_response


upload_bp = Blueprint("upload", __name__)


@upload_bp.route("/upload", methods=["POST"])
def upload_resume():
    file = request.files.get("file") or request.files.get("resume")
    if not file or not file.filename:
        return error_response("Resume file is required.", 400)

    if not allowed_file(file.filename, {"pdf", "docx"}):
        return error_response("Only PDF and DOCX files are accepted.", 400)

    original_name = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4().hex}_{original_name}"
    destination = Path(current_app.config["UPLOAD_FOLDER"]) / unique_name
    file.save(destination)

    resume = Resume(file_path=str(destination))
    db.session.add(resume)
    db.session.commit()

    print(f"[UPLOAD] Saved resume to {destination}")
    return jsonify(
        {
            "success": True,
            "message": "Resume uploaded successfully.",
            "fileId": str(resume.id),
            "file_id": resume.id,
            "fileName": original_name,
        }
    )
