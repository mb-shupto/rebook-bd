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

    from app import models  # noqa: F401 — keeps Flask-Migrate aware of all models

    # ── Blueprints ────────────────────────────────────────────────────────────
    from app.auth import auth_bp
    from app.listings import listings_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(listings_bp)

    # ── Utility routes ────────────────────────────────────────────────────────
    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    @app.route("/api/seed-categories", methods=["POST"])
    def seed_categories():
        """
        One-time dev helper — populates the category table.
        Remove or protect this route before any public deployment.
        """
        from app.models import Category
        defaults = [
            ("Textbook",     1.10),
            ("Calculator",   1.05),
            ("Lab Equipment",1.00),
            ("Stationery",   0.90),
            ("Electronics",  1.05),
            ("Other",        1.00),
        ]
        added = []
        for name, mult in defaults:
            if not Category.query.filter_by(name=name).first():
                db.session.add(Category(name=name, demand_multiplier=mult))
                added.append(name)
        db.session.commit()
        return {"seeded": added}, 201

    return app
