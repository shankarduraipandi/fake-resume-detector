from pathlib import Path

from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from database import init_db
from routes import register_blueprints


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    upload_folder = Path(app.config["UPLOAD_FOLDER"])
    upload_folder.mkdir(parents=True, exist_ok=True)

    CORS(app)
    init_db(app)
    register_blueprints(app)

    @app.route("/", methods=["GET"])
    def index():
        return jsonify(
            {
                "status": "ok",
                "message": "AI Fake Resume Detection System backend is running.",
            }
        )

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"})

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"success": False, "message": "Endpoint not found."}), 404

    @app.errorhandler(413)
    def file_too_large(_error):
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Uploaded file is too large. Maximum size is 10MB.",
                }
            ),
            413,
        )

    @app.errorhandler(Exception)
    def handle_exception(error):
        print(f"[ERROR] Unhandled exception: {error}")
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Something went wrong on the server.",
                }
            ),
            500,
        )

    return app


app = create_app()


if __name__ == "__main__":
    port = int(app.config.get("PORT", 5000))
    debug = True # bool(app.config.get("DEBUG", True))
    app.run(host="0.0.0.0", port=port, debug=debug)
