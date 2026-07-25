"""
Listing endpoints
─────────────────
POST   /api/listings            — create a listing (FR-2, FR-3, FR-4)
GET    /api/listings            — browse / search listings (FR-5)
GET    /api/listings/<id>       — single listing detail
PATCH  /api/listings/<id>/sold  — mark a listing as sold (sets up Transaction)
"""

from datetime import date, datetime
from decimal import Decimal

from flask import jsonify, request

from app.extensions import db
from app.listings import listings_bp
from app.models import Category, Listing, Transaction
from app.utils.decorators import token_required
from app.utils.pricing import compute_suggested_price

VALID_CONDITIONS = ["New", "Like-New", "Good", "Fair", "Worn"]
VALID_STATUSES   = ["active", "pending", "sold", "removed"]


# ── Create Listing  (FR-2 + FR-3 + FR-4) ────────────────────────────────────
@listings_bp.route("", methods=["POST"])
@token_required
def create_listing(current_user):
    data = request.get_json(silent=True) or {}

    # ── Validation ───────────────────────────────────────────────────────────
    errors = {}
    title          = (data.get("title") or "").strip()
    category_id    = data.get("category_id")
    original_price = data.get("original_price")
    condition      = (data.get("condition") or "").strip()
    listed_price   = data.get("listed_price")
    purchase_date  = data.get("purchase_date")   # "YYYY-MM-DD" or None
    course_code    = (data.get("course_code") or "").strip() or None

    if not title:
        errors["title"] = "Title is required."
    if not category_id:
        errors["category_id"] = "Category is required."
    elif not Category.query.get(category_id):
        errors["category_id"] = "Category not found."
    if original_price is None:
        errors["original_price"] = "Original price is required."
    else:
        try:
            original_price = Decimal(str(original_price))
            if original_price <= 0:
                raise ValueError
        except Exception:
            errors["original_price"] = "Original price must be a positive number."
    if condition not in VALID_CONDITIONS:
        errors["condition"] = f"Condition must be one of: {', '.join(VALID_CONDITIONS)}."
    if listed_price is None:
        errors["listed_price"] = "Listed price is required."
    else:
        try:
            listed_price = Decimal(str(listed_price))
            if listed_price <= 0:
                raise ValueError
        except Exception:
            errors["listed_price"] = "Listed price must be a positive number."

    # Parse optional purchase date
    parsed_purchase_date = None
    if purchase_date:
        try:
            parsed_purchase_date = date.fromisoformat(purchase_date)
        except ValueError:
            errors["purchase_date"] = "Purchase date must be in YYYY-MM-DD format."

    if errors:
        return jsonify({"errors": errors}), 422

    # ── Compute the suggested price band (FR-3) ──────────────────────────────
    price_min, price_max = compute_suggested_price(
        original_price=original_price,
        condition=condition,
        purchase_date=parsed_purchase_date,
        category_id=category_id,
    )

    # Did the seller override the suggestion? (FR-4)
    # Override = listed_price falls outside the suggested band
    price_override = not (price_min <= listed_price <= price_max)

    # ── Persist ───────────────────────────────────────────────────────────────
    listing = Listing(
        seller_id=current_user.user_id,
        category_id=category_id,
        title=title,
        course_code=course_code,
        original_price=original_price,
        purchase_date=parsed_purchase_date,
        condition=condition,
        suggested_price_min=price_min,
        suggested_price_max=price_max,
        listed_price=listed_price,
        price_override=price_override,
    )
    db.session.add(listing)
    db.session.commit()

    return jsonify({
        "message": "Listing created successfully.",
        "listing": _serialize(listing),
    }), 201


# ── Browse / Search Listings  (FR-5) ─────────────────────────────────────────
@listings_bp.route("", methods=["GET"])
def get_listings():
    q = Listing.query.filter_by(status="active")

    # Optional filters
    category_id = request.args.get("category_id", type=int)
    course_code = request.args.get("course_code", "").strip() or None
    condition   = request.args.get("condition", "").strip() or None
    min_price   = request.args.get("min_price", type=float)
    max_price   = request.args.get("max_price", type=float)

    if category_id:
        q = q.filter_by(category_id=category_id)
    if course_code:
        q = q.filter(Listing.course_code.ilike(f"%{course_code}%"))
    if condition and condition in VALID_CONDITIONS:
        q = q.filter_by(condition=condition)
    if min_price is not None:
        q = q.filter(Listing.listed_price >= min_price)
    if max_price is not None:
        q = q.filter(Listing.listed_price <= max_price)

    listings = q.order_by(Listing.created_at.desc()).limit(50).all()
    return jsonify({"listings": [_serialize(l) for l in listings]}), 200


# ── Single Listing Detail ────────────────────────────────────────────────────
@listings_bp.route("/<int:listing_id>", methods=["GET"])
def get_listing(listing_id):
    listing = Listing.query.get_or_404(listing_id)
    return jsonify({"listing": _serialize(listing)}), 200


# ── Mark as Sold  (creates a Transaction record) ─────────────────────────────
@listings_bp.route("/<int:listing_id>/sold", methods=["PATCH"])
@token_required
def mark_sold(current_user, listing_id):
    listing = Listing.query.get_or_404(listing_id)

    if listing.seller_id != current_user.user_id:
        return jsonify({"error": "You can only update your own listings."}), 403
    if listing.status != "active":
        return jsonify({"error": f"Listing is already '{listing.status}'."}), 409

    data        = request.get_json(silent=True) or {}
    buyer_id    = data.get("buyer_id")
    agreed_price = data.get("agreed_price")

    if not buyer_id or not agreed_price:
        return jsonify({"error": "buyer_id and agreed_price are required."}), 422
    if buyer_id == current_user.user_id:
        return jsonify({"error": "Seller and buyer cannot be the same person."}), 422

    listing.status = "sold"
    txn = Transaction(
        listing_id=listing_id,
        buyer_id=buyer_id,
        agreed_price=Decimal(str(agreed_price)),
        condition_at_sale=listing.condition,
        completed_at=datetime.utcnow(),
        status="completed",
    )
    db.session.add(txn)
    db.session.commit()

    return jsonify({
        "message": "Listing marked as sold. Transaction recorded.",
        "transaction_id": txn.transaction_id,
    }), 200


# ── Serializer helper ─────────────────────────────────────────────────────────
def _serialize(l: Listing) -> dict:
    return {
        "listing_id":          l.listing_id,
        "title":               l.title,
        "course_code":         l.course_code,
        "condition":           l.condition,
        "original_price":      float(l.original_price),
        "suggested_price_min": float(l.suggested_price_min) if l.suggested_price_min else None,
        "suggested_price_max": float(l.suggested_price_max) if l.suggested_price_max else None,
        "listed_price":        float(l.listed_price),
        "price_override":      l.price_override,
        "status":              l.status,
        "seller_id":           l.seller_id,
        "category_id":         l.category_id,
        "created_at":          l.created_at.isoformat(),
    }
