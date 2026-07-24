from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.extensions import db, bcrypt, migrate


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    # Import models so Flask-Migrate can see them
    from app import models  # noqa: F401

    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    return app
