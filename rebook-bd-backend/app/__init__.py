import os
from flask import Flask  # type: ignore[import-not-found]
from flask_cors import CORS  # type: ignore[import-not-found]

from app.config import Config
from app.extensions import db, bcrypt, migrate


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # 1. Pull the connection string and immediately verify it
    db_url = os.environ.get('DATABASE_URL')
    
    # 2. Fix the common postgresql:// schema mismatch requirement for SQLAlchemy 1.4+
    if db_url and db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
        
    # 3. Securely apply the production URI, falling back ONLY if completely empty
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url or 'postgresql://localhost/rebook'

    db.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)

    # Allow the Vercel frontend origin + localhost for dev.
    allowed = [
        "http://localhost:3000",
        os.environ.get("FRONTEND_URL", ""),
    ]
    CORS(app, origins=[o for o in allowed if o])

    from app import models  # noqa: F401

    from app.auth import auth_bp
    from app.listings import listings_bp
    from app.ratings import ratings_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(listings_bp)
    app.register_blueprint(ratings_bp)

    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    @app.route("/api/categories", methods=["GET"])
    def get_categories():
        from app.models import Category
        cats = Category.query.order_by(Category.name).all()
        return {
            "categories": [
                {
                    "category_id":       c.category_id,
                    "name":              c.name,
                    "demand_multiplier": float(c.demand_multiplier),
                }
                for c in cats
            ]
        }, 200

    @app.route("/api/seed-categories", methods=["POST"])
    def seed_categories():
        from app.models import Category
        defaults = [
            ("Textbook",      1.10),
            ("Calculator",    1.05),
            ("Lab Equipment", 1.00),
            ("Stationery",    0.90),
            ("Electronics",   1.05),
            ("Other",         1.00),
        ]
        added = []
        for name, mult in defaults:
            if not Category.query.filter_by(name=name).first():
                db.session.add(Category(name=name, demand_multiplier=mult))
                added.append(name)
        db.session.commit()
        return {"seeded": added}, 201

    return app