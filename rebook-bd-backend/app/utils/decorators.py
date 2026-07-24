import jwt
from flask import current_app, jsonify, request
from functools import wraps

from app.models import User


def token_required(f):
    """
    Decorator for protected routes.
    Expects:  Authorization: Bearer <token>
    Injects the resolved User as the first argument to the wrapped function.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization header missing or malformed."}), 401

        token = auth_header.split(" ", 1)[1]

        try:
            payload = jwt.decode(
                token,
                current_app.config["SECRET_KEY"],
                algorithms=["HS256"],
            )
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired. Please log in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token."}), 401

        current_user = User.query.get(payload["user_id"])
        if not current_user:
            return jsonify({"error": "User not found."}), 401

        return f(current_user, *args, **kwargs)

    return decorated
