"""
Ratings endpoints
─────────────────
POST  /api/ratings              — submit a rating after a completed transaction (FR-8)
GET   /api/ratings/user/<id>    — view all ratings received by a user (FR-6)

After every new rating is saved, the ratee's reputation_score is
recomputed as a simple average of all scores they have ever received.
This directly implements FR-9.
"""

from decimal import Decimal, ROUND_HALF_UP

from flask import jsonify, request
from sqlalchemy import func

from app.extensions import db
from app.models import Listing, Rating, Transaction, User
from app.ratings import ratings_bp
from app.utils.decorators import token_required


def _recompute_reputation(user_id: int) -> Decimal:
    """
    Recalculate and persist the reputation_score for user_id.
    Score = simple average of all Rating.score rows where ratee_id = user_id.
    Called after every new rating — implements FR-9.
    """
    result = db.session.query(
        func.avg(Rating.score)
    ).filter(Rating.ratee_id == user_id).scalar()

    new_score = (
        Decimal(str(result)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if result is not None
        else Decimal("0.00")
    )

    user = User.query.get(user_id)
    if user:
        user.reputation_score = new_score
        db.session.commit()

    return new_score


# ── Submit a Rating  (FR-8 + FR-9) ──────────────────────────────────────────
@ratings_bp.route("", methods=["POST"])
@token_required
def submit_rating(current_user):
    data = request.get_json(silent=True) or {}

    transaction_id = data.get("transaction_id")
    score          = data.get("score")
    comment        = (data.get("comment") or "").strip() or None

    # ── Basic field validation ───────────────────────────────────────────────
    errors = {}
    if not transaction_id:
        errors["transaction_id"] = "transaction_id is required."
    if score is None:
        errors["score"] = "score is required."
    elif not isinstance(score, int) or score not in range(1, 6):
        errors["score"] = "score must be an integer between 1 and 5."
    if errors:
        return jsonify({"errors": errors}), 422

    # ── Verify the transaction exists and is completed ───────────────────────
    txn = Transaction.query.get(transaction_id)
    if not txn:
        return jsonify({"error": "Transaction not found."}), 404
    if txn.status != "completed":
        return jsonify({"error": "Ratings can only be submitted for completed transactions."}), 409

    # ── Confirm the current user was part of this transaction ────────────────
    listing  = Listing.query.get(txn.listing_id)
    seller_id = listing.seller_id
    buyer_id  = txn.buyer_id

    if current_user.user_id not in (seller_id, buyer_id):
        return jsonify({"error": "You were not part of this transaction."}), 403

    # ── Determine who is being rated ─────────────────────────────────────────
    ratee_id = buyer_id if current_user.user_id == seller_id else seller_id

    # ── Enforce one rating per direction per transaction (FR-8) ──────────────
    already_rated = Rating.query.filter_by(
        transaction_id=transaction_id,
        rater_id=current_user.user_id,
    ).first()
    if already_rated:
        return jsonify({"error": "You have already submitted a rating for this transaction."}), 409

    # ── Persist the rating ───────────────────────────────────────────────────
    rating = Rating(
        transaction_id=transaction_id,
        rater_id=current_user.user_id,
        ratee_id=ratee_id,
        score=score,
        comment=comment,
    )
    db.session.add(rating)
    db.session.commit()

    # ── Recompute the ratee's reputation score (FR-9) ─────────────────────────
    new_reputation = _recompute_reputation(ratee_id)

    return jsonify({
        "message": "Rating submitted successfully.",
        "rating": {
            "rating_id":      rating.rating_id,
            "transaction_id": transaction_id,
            "ratee_id":       ratee_id,
            "score":          score,
            "comment":        comment,
        },
        "ratee_new_reputation_score": float(new_reputation),
    }), 201


# ── View Ratings Received by a User  (FR-6) ──────────────────────────────────
@ratings_bp.route("/user/<int:user_id>", methods=["GET"])
def get_user_ratings(user_id):
    user = User.query.get_or_404(user_id)

    ratings = Rating.query.filter_by(ratee_id=user_id).order_by(
        Rating.created_at.desc()
    ).all()

    return jsonify({
        "user_id":          user.user_id,
        "full_name":        user.full_name,
        "reputation_score": float(user.reputation_score),
        "total_ratings":    len(ratings),
        "ratings": [
            {
                "rating_id":      r.rating_id,
                "score":          r.score,
                "comment":        r.comment,
                "transaction_id": r.transaction_id,
                "created_at":     r.created_at.isoformat(),
            }
            for r in ratings
        ],
    }), 200
