from routes.analysis import analysis_bp
from routes.extraction import extraction_bp
from routes.upload import upload_bp
from routes.verification import verification_bp


def register_blueprints(app):
    app.register_blueprint(upload_bp)
    app.register_blueprint(extraction_bp)
    app.register_blueprint(verification_bp)
    app.register_blueprint(analysis_bp)
