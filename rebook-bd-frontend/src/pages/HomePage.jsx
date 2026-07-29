import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getListings, getCategories } from '../api';
import ListingCard from '../components/ListingCard';

const CONDITIONS = ['New', 'Like-New', 'Good', 'Fair', 'Worn'];

export default function HomePage() {
  const navigate = useNavigate();

  const [listings,    setListings]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filters,     setFilters]     = useState({
    category_id: '', condition: '', min_price: '', max_price: '', course_code: '',
  });

  useEffect(() => {
    getCategories().then(r => setCategories(r.data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '')
    );
    getListings(params)
      .then(r => setListings(r.data.listings))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [filters]);

  const set = (key) => (e) => setFilters(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="page">
      {/* Hero */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--c-primary)' }}>
          IUB Campus Marketplace
        </h1>
        <p style={{ color: 'var(--c-muted)', marginTop: 6 }}>
          Buy and sell textbooks, calculators, and gear — fairly priced, verified sellers only.
        </p>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-item">
          <span className="filter-label">Category</span>
          <select className="form-select" value={filters.category_id} onChange={set('category_id')}>
            <option value="">All categories</option>
            {categories.map(c => (
              <option key={c.category_id} value={c.category_id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <span className="filter-label">Condition</span>
          <select className="form-select" value={filters.condition} onChange={set('condition')}>
            <option value="">Any condition</option>
            {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="filter-item">
          <span className="filter-label">Course code</span>
          <input
            className="form-input"
            placeholder="e.g. CSE451"
            value={filters.course_code}
            onChange={set('course_code')}
          />
        </div>

        <div className="filter-item" style={{ minWidth: 100 }}>
          <span className="filter-label">Min price (৳)</span>
          <input className="form-input" type="number" value={filters.min_price} onChange={set('min_price')} />
        </div>

        <div className="filter-item" style={{ minWidth: 100 }}>
          <span className="filter-label">Max price (৳)</span>
          <input className="form-input" type="number" value={filters.max_price} onChange={set('max_price')} />
        </div>

        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setFilters({ category_id:'', condition:'', min_price:'', max_price:'', course_code:'' })}
        >
          Clear
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="loading">Loading listings…</div>
      ) : listings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-text">No listings match your filters.</div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => navigate('/create-listing')}
          >
            Be the first to list something
          </button>
        </div>
      ) : (
        <div className="listing-grid">
          {listings.map(l => <ListingCard key={l.listing_id} listing={l} />)}
        </div>
      )}
    </div>
  );
}
