import re
from datetime import datetime, timezone

from flask import current_app, jsonify, request

from app.auth import auth_bp
from app.extensions import bcrypt, db
from app.models import User
from app.utils.decorators import token_required

ALLOWED_DOMAIN = "@iub.edu.bd"


def _valid_iub_email(email: str) -> bool:
    """Return True only for well-formed @iub.edu.bd addresses."""
    pattern = r"^[a-zA-Z0-9._%+\-]+@iub\.edu\.bd$"
    return bool(re.match(pattern, email))


# ── Register ────────────────────────────────────────────────────────────────
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    full_name  = (data.get("full_name") or "").strip()
    email      = (data.get("email") or "").strip().lower()
    password   = data.get("password") or ""
    department = (data.get("department") or "").strip()

    # ── Validation ──────────────────────────────────────────────────────────
    errors = {}
    if not full_name:
        errors["full_name"] = "Full name is required."
    if not email:
        errors["email"] = "Email is required."
    elif not _valid_iub_email(email):
        errors["email"] = (
            f"Only {ALLOWED_DOMAIN} addresses are accepted. "
            "Please use your IUB university email."
        )
    if len(password) < 8:
        errors["password"] = "Password must be at least 8 characters."
    if errors:
        return jsonify({"errors": errors}), 422

    # ── Duplicate check ─────────────────────────────────────────────────────
    if User.query.filter_by(university_email=email).first():
        return jsonify({"error": "An account with that email already exists."}), 409

    # ── Persist ─────────────────────────────────────────────────────────────
    hashed = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(
        full_name=full_name,
        university_email=email,
        department=department,
        password_hash=hashed,
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "Account created successfully.",
        "user": {
            "user_id": user.user_id,
            "full_name": user.full_name,
            "university_email": user.university_email,
        },
    }), 201


# ── Login ────────────────────────────────────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    import jwt

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(university_email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        # Deliberately vague — don't reveal whether the email exists
        return jsonify({"error": "Invalid email or password."}), 401

    payload = {
        "user_id": user.user_id,
        "email": user.university_email,
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(
        payload,
        current_app.config["SECRET_KEY"],
        algorithm="HS256",
    )

    return jsonify({
        "message": "Login successful.",
        "token": token,
        "user": {
            "user_id": user.user_id,
            "full_name": user.full_name,
            "university_email": user.university_email,
            "reputation_score": float(user.reputation_score),
        },
    }), 200


# ── Me (protected example) ───────────────────────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
@token_required
def me(current_user):
    return jsonify({
        "user_id": current_user.user_id,
        "full_name": current_user.full_name,
        "university_email": current_user.university_email,
        "department": current_user.department,
        "reputation_score": float(current_user.reputation_score),
        "member_since": current_user.created_at.isoformat(),
    }), 200
