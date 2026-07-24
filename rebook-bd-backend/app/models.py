from datetime import datetime

from app.extensions import db


class User(db.Model):
    __tablename__ = "user"

    user_id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    university_email = db.Column(db.String(160), unique=True, nullable=False)
    department = db.Column(db.String(100))
    password_hash = db.Column(db.String(255), nullable=False)
    reputation_score = db.Column(db.Numeric(3, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    listings = db.relationship(
        "Listing", backref="seller", lazy=True, foreign_keys="Listing.seller_id"
    )


class Category(db.Model):
    __tablename__ = "category"

    category_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(60), unique=True, nullable=False)
    demand_multiplier = db.Column(db.Numeric(4, 2), default=1.0)


class Listing(db.Model):
    __tablename__ = "listing"

    listing_id = db.Column(db.Integer, primary_key=True)
    seller_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    category_id = db.Column(
        db.Integer, db.ForeignKey("category.category_id"), nullable=False
    )
    title = db.Column(db.String(150), nullable=False)
    course_code = db.Column(db.String(20))
    original_price = db.Column(db.Numeric(10, 2), nullable=False)
    purchase_date = db.Column(db.Date)
    condition = db.Column(db.String(20))  # New / Like-New / Good / Fair / Worn
    suggested_price_min = db.Column(db.Numeric(10, 2))
    suggested_price_max = db.Column(db.Numeric(10, 2))
    listed_price = db.Column(db.Numeric(10, 2), nullable=False)
    price_override = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default="active")  # active/pending/sold/removed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    category = db.relationship("Category", backref="listings")
    photos = db.relationship(
        "ListingPhoto", backref="listing", lazy=True, cascade="all, delete-orphan"
    )


class ListingPhoto(db.Model):
    __tablename__ = "listing_photo"

    photo_id = db.Column(db.Integer, primary_key=True)
    listing_id = db.Column(
        db.Integer, db.ForeignKey("listing.listing_id"), nullable=False
    )
    image_url = db.Column(db.String(255), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)


class Transaction(db.Model):
    __tablename__ = "transaction"

    transaction_id = db.Column(db.Integer, primary_key=True)
    listing_id = db.Column(
        db.Integer, db.ForeignKey("listing.listing_id"), unique=True, nullable=False
    )
    buyer_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    agreed_price = db.Column(db.Numeric(10, 2), nullable=False)
    condition_at_sale = db.Column(db.String(20))
    completed_at = db.Column(db.DateTime)
    status = db.Column(db.String(20), default="pending_confirmation")

    listing = db.relationship("Listing", backref=db.backref("transaction", uselist=False))
    buyer = db.relationship("User", foreign_keys=[buyer_id])


class Rating(db.Model):
    __tablename__ = "rating"
    __table_args__ = (db.UniqueConstraint("transaction_id", "rater_id"),)

    rating_id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(
        db.Integer, db.ForeignKey("transaction.transaction_id"), nullable=False
    )
    rater_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    ratee_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    score = db.Column(db.SmallInteger)  # 1-5
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class PriceConfig(db.Model):
    __tablename__ = "price_config"

    config_id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(
        db.Integer, db.ForeignKey("category.category_id"), nullable=False
    )
    condition = db.Column(db.String(20), nullable=False)
    multiplier_value = db.Column(db.Numeric(4, 2), nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
