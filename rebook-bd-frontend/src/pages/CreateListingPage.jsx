import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories, createListing } from '../api';
import PriceMeter from '../components/PriceMeter';

const CONDITIONS = ['New', 'Like-New', 'Good', 'Fair', 'Worn'];

// Mirrors the server-side pricing formula so the meter updates instantly
// without a round-trip. The server is still the source of truth on submit.
const CONDITION_MULT = { 'New':0.95,'Like-New':0.80,'Good':0.65,'Fair':0.45,'Worn':0.25 };
const AGE_DECAY_PER_SEM = 0.90;
const AGE_DECAY_FLOOR   = 0.40;
const BAND              = 0.10;

function clientSideEstimate(originalPrice, condition, purchaseDate, demandMult) {
  if (!originalPrice || !condition || !demandMult) return null;
  const condMult = CONDITION_MULT[condition] ?? 0.50;
  let semesters = 0;
  if (purchaseDate) {
    const days = (Date.now() - new Date(purchaseDate).getTime()) / 86400000;
    semesters = Math.max(0, Math.floor(days / 182));
  }
  const ageDec   = Math.max(AGE_DECAY_FLOOR, Math.pow(AGE_DECAY_PER_SEM, semesters));
  const mid      = originalPrice * condMult * ageDec * demandMult;
  const band     = mid * BAND;
  return {
    min: Math.max(10, Math.round(mid - band)),
    max: Math.max(20, Math.round(mid + band)),
  };
}

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title:'', category_id:'', original_price:'', purchase_date:'',
    condition:'', listed_price:'', course_code:'',
  });
  const [errors,    setErrors]   = useState({});
  const [apiError,  setApiError] = useState('');
  const [loading,   setLoading]  = useState(false);
  const [estimate,  setEstimate] = useState(null);

  useEffect(() => {
    getCategories().then(r => setCategories(r.data.categories)).catch(() => {});
  }, []);

  // Recompute client-side estimate whenever relevant fields change
  useEffect(() => {
    const cat = categories.find(c => String(c.category_id) === String(form.category_id));
    const est = clientSideEstimate(
      parseFloat(form.original_price),
      form.condition,
      form.purchase_date || null,
      cat?.demand_multiplier ?? null,
    );
    setEstimate(est);
  }, [form.original_price, form.condition, form.purchase_date, form.category_id, categories]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setErrors({}); setApiError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        category_id:    parseInt(form.category_id),
        original_price: parseFloat(form.original_price),
        listed_price:   parseFloat(form.listed_price),
        purchase_date:  form.purchase_date || null,
        course_code:    form.course_code   || null,
      };
      const res = await createListing(payload);
      navigate(`/listings/${res.data.listing.listing_id}`);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setApiError(data?.error ?? 'Could not create listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="page-title">List an item</div>
          <div className="page-subtitle">Fill in the details — we'll suggest a fair price.</div>
        </div>
      </div>

      <div className="form-card">
        {apiError && <div className="alert alert-error" style={{ marginBottom: 20 }}>{apiError}</div>}

        <div className="form-section">
          <div className="form-section-title">Item details</div>

          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={form.title} onChange={set('title')} placeholder="e.g. Calculus Early Transcendentals 8th Ed" />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category_id} onChange={set('category_id')}>
                <option value="">Select category</option>
                {categories.map(c => (
                  <option key={c.category_id} value={c.category_id}>{c.name}</option>
                ))}
              </select>
              {errors.category_id && <span className="form-error">{errors.category_id}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Course code (optional)</label>
              <input className="form-input" value={form.course_code} onChange={set('course_code')} placeholder="e.g. CSE451" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Condition</label>
              <select className="form-select" value={form.condition} onChange={set('condition')}>
                <option value="">Select condition</option>
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.condition && <span className="form-error">{errors.condition}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Original purchase price (৳)</label>
              <input className="form-input" type="number" value={form.original_price} onChange={set('original_price')} placeholder="e.g. 1200" />
              {errors.original_price && <span className="form-error">{errors.original_price}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Date purchased (optional)</label>
            <input className="form-input" type="date" value={form.purchase_date} onChange={set('purchase_date')} />
            <span className="form-hint">Helps calculate age-based depreciation.</span>
          </div>
        </div>

        {/* ── PRICE SECTION ───────────────────────────────────────────────── */}
        <div className="form-section" style={{ marginTop: 28 }}>
          <div className="form-section-title">Pricing</div>

          {/* Live price meter — the signature element */}
          <PriceMeter
            suggestedMin={estimate?.min}
            suggestedMax={estimate?.max}
            listedPrice={parseFloat(form.listed_price) || null}
            originalPrice={parseFloat(form.original_price) || null}
          />

          <div className="form-group">
            <label className="form-label">Your asking price (৳)</label>
            <input
              className="form-input"
              type="number"
              value={form.listed_price}
              onChange={set('listed_price')}
              placeholder="Enter your price"
              style={{ fontSize: '1.1rem', fontWeight: 600 }}
            />
            {errors.listed_price && <span className="form-error">{errors.listed_price}</span>}
            <span className="form-hint">
              You can set any price — the meter is a guide, not a rule.
            </span>
          </div>
        </div>

        <button
          className="btn btn-primary btn-lg"
          style={{ marginTop: 28, width: '100%' }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Publishing…' : 'Publish listing'}
        </button>
      </div>
    </div>
  );
}
