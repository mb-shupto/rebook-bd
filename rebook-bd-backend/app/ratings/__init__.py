from flask import Blueprint

ratings_bp = Blueprint("ratings", __name__, url_prefix="/api/ratings")

from app.ratings import routes  # noqa: E402, F401
