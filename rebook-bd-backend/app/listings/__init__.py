from flask import Blueprint

listings_bp = Blueprint("listings", __name__, url_prefix="/api/listings")

from app.listings import routes  # noqa: E402, F401
