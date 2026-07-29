# ReBook BD 📚

**Verified peer-to-peer textbook & gear exchange for IUB students — with fair-price suggestion and seller reputation scoring.**

> Built for CSE 451 — Software Engineering | Independent University Bangladesh | Summer 2026

---

## The Problem

IUB students overpay for textbooks every semester. A parallel supply of barely-used books, calculators, and lab gear already exists on campus — but the only channel to reach it is a chaotic Facebook group with no price reference and no way to know if a seller is reliable.

## What ReBook BD Does

- **Fair-Price Suggestion** — enter your item's category, condition, and original price; the engine suggests a fair asking-price range using a transparent depreciation formula (condition × age-decay × category-demand multiplier). The price meter updates live as you type.
- **Verified Listings** — registration is locked to `@iub.edu.bd` addresses only. No outsiders, no anonymous sellers.
- **Seller Reputation** — every seller carries a public score built from ratings left after completed transactions. Ratings are tied to confirmed exchanges; you cannot rate someone you never transacted with.
- **Transaction Logging** — every completed sale (agreed price, condition, ratings) is logged, building the dataset for a future trained regression-based pricing model once enough transactions accumulate.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, plain CSS with design tokens |
| Backend | Python 3 + Flask + SQLAlchemy |
| Database | PostgreSQL |
| Auth | JWT (PyJWT) + bcrypt password hashing |
| Hosting | Render (backend) + Vercel (frontend) |

---

## Project Structure

```
rebook-bd/
├── rebook-bd-backend/
│   ├── app/
│   │   ├── __init__.py        # App factory, blueprint registration
│   │   ├── config.py          # Environment config
│   │   ├── extensions.py      # db, bcrypt, migrate
│   │   ├── models.py          # SQLAlchemy models (User, Listing, Transaction, Rating, ...)
│   │   ├── auth/              # Register, login, /me endpoints
│   │   ├── listings/          # Listing CRUD + mark-sold
│   │   ├── ratings/           # Submit rating, user reputation
│   │   └── utils/
│   │       ├── decorators.py  # @token_required
│   │       └── pricing.py     # Fair-price formula engine
│   ├── requirements.txt
│   └── run.py
│
└── rebook-bd-frontend/
    ├── src/
    │   ├── api/               # Axios client + all API call functions
    │   ├── contexts/          # AuthContext (JWT + user state)
    │   ├── components/
    │   │   ├── PriceMeter.jsx # Live fair-price band visualisation
    │   │   ├── StarRating.jsx
    │   │   ├── ListingCard.jsx
    │   │   ├── Navbar.jsx
    │   │   └── ProtectedRoute.jsx
    │   └── pages/
    │       ├── HomePage.jsx
    │       ├── LoginPage.jsx
    │       ├── RegisterPage.jsx
    │       ├── CreateListingPage.jsx
    │       ├── ListingDetailPage.jsx
    │       └── ProfilePage.jsx
    ├── index.html
    └── vite.config.js
```

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (running locally)

### Backend

```bash
cd rebook-bd-backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DB credentials

# Create the database
createdb -U postgres rebook_bd

# Run migrations
set FLASK_APP=run.py            # Windows
flask db upgrade

# Seed categories (run once)
# POST http://localhost:5000/api/seed-categories

python run.py
```

Backend runs at `http://localhost:5000`

### Frontend

```bash
cd rebook-bd-frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register with IUB email |
| POST | `/api/auth/login` | — | Login, receive JWT |
| GET | `/api/auth/me` | ✓ | Current user profile |
| GET | `/api/categories` | — | List all categories |
| GET | `/api/listings` | — | Browse listings (filterable) |
| POST | `/api/listings` | ✓ | Create a listing |
| GET | `/api/listings/:id` | — | Listing detail |
| PATCH | `/api/listings/:id/sold` | ✓ | Mark sold, create transaction |
| POST | `/api/ratings` | ✓ | Submit a post-transaction rating |
| GET | `/api/ratings/user/:id` | — | View a user's ratings |

---

## Data Model

Seven tables: `user`, `category`, `listing`, `listing_photo`, `transaction`, `rating`, `price_config`.

Key constraints:
- `transaction.listing_id` is UNIQUE — one listing, one transaction.
- `rating` has a UNIQUE constraint on `(transaction_id, rater_id)` — one rating per direction per transaction.
- `price_config` stores formula multipliers as admin-editable data, not hard-coded constants.

---

## The Pricing Formula

```
suggested_price = original_price
               × condition_multiplier      # New=0.95 … Worn=0.25
               × age_decay                 # 0.90 per semester, floor 0.40
               × category_demand_multiplier # e.g. 1.10 for Textbooks

suggested_min = midpoint × 0.90
suggested_max = midpoint × 1.10
```

The formula is intentionally transparent and explainable. Once enough real transactions are logged, it is designed to be replaced by a trained scikit-learn regression model using the platform's own transaction history as training data.

---

## Course & Academic Context

| Item | Detail |
|---|---|
| Course | CSE 451 — Software Engineering |
| Institution | Independent University Bangladesh (IUB) |
| Semester | Summer 2026 |
| SDLC Model | Agile (4 × 2-week sprints) |
| Student | [Your Full Name] — [Your Student ID] |

Functional requirements FR-1 through FR-11 and non-functional requirements NFR-1 through NFR-7 are fully specified in the accompanying SRS document.

---

## License

For academic evaluation purposes only.
