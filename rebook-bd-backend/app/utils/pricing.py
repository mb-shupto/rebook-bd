"""
Fair-Price Suggestion Engine  (FR-3)
=====================================
Formula:
    suggested = original_price × condition_mult × age_decay × demand_mult

condition_mult  — how much the item's condition depreciates its value
age_decay       — per-semester (6-month) exponential decay, floored at 0.40
demand_mult     — pulled from the Category row in the database

The ± 10% band gives the seller a range rather than a single number,
which is more honest about the formula's imprecision.

All multiplier values live in the price_config table (admin-editable, NFR-6),
with hard-coded defaults used as fallback if no config row exists yet.
"""

from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Tuple

from app.extensions import db
from app.models import Category, PriceConfig

# ── Default condition multipliers (used if price_config table is empty) ──────
DEFAULT_CONDITION_MULT = {
    "New":       Decimal("0.95"),
    "Like-New":  Decimal("0.80"),
    "Good":      Decimal("0.65"),
    "Fair":      Decimal("0.45"),
    "Worn":      Decimal("0.25"),
}

AGE_DECAY_PER_SEMESTER = Decimal("0.90")   # lose 10% per 6-month semester
AGE_DECAY_FLOOR        = Decimal("0.40")   # never suggest less than 40% of original
BAND_PERCENT           = Decimal("0.10")   # ± 10% around the midpoint


def _semesters_elapsed(purchase_date: date) -> int:
    """Number of full 6-month semesters since purchase_date."""
    if purchase_date is None:
        return 0
    delta_days = (date.today() - purchase_date).days
    return max(0, delta_days // 182)


def _get_condition_multiplier(category_id: int, condition: str) -> Decimal:
    """
    Look up the condition multiplier from price_config.
    Falls back to DEFAULT_CONDITION_MULT if no row found.
    """
    config = PriceConfig.query.filter_by(
        category_id=category_id,
        condition=condition,
    ).first()
    if config:
        return Decimal(str(config.multiplier_value))
    return DEFAULT_CONDITION_MULT.get(condition, Decimal("0.50"))


def _get_demand_multiplier(category_id: int) -> Decimal:
    """Pull demand_multiplier from the category row."""
    cat = Category.query.get(category_id)
    if cat and cat.demand_multiplier:
        return Decimal(str(cat.demand_multiplier))
    return Decimal("1.00")


def compute_suggested_price(
    original_price: Decimal,
    condition: str,
    purchase_date: date,
    category_id: int,
) -> Tuple[Decimal, Decimal]:
    """
    Return (price_min, price_max) as a suggested asking-price band.

    Both values are rounded to the nearest integer taka — fractional
    taka in a student marketplace just look weird.
    """
    condition_mult = _get_condition_multiplier(category_id, condition)
    demand_mult    = _get_demand_multiplier(category_id)

    semesters   = _semesters_elapsed(purchase_date)
    age_decay   = max(
        AGE_DECAY_FLOOR,
        AGE_DECAY_PER_SEMESTER ** semesters,
    )

    midpoint = original_price * condition_mult * age_decay * demand_mult
    band     = midpoint * BAND_PERCENT

    price_min = (midpoint - band).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    price_max = (midpoint + band).quantize(Decimal("1"), rounding=ROUND_HALF_UP)

    # Floor at 10 taka — never suggest ৳0 for anything
    price_min = max(price_min, Decimal("10"))
    price_max = max(price_max, price_min + Decimal("10"))

    return price_min, price_max
