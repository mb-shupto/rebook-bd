import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getListing, getUserRatings, markSold, submitRating } from '../api';
import { useAuth } from '../contexts/AuthContext';
import StarRating from '../components/StarRating';

export default function ListingDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();

  const [listing,     setListing]     = useState(null);
  const [sellerRatings, setSellerRatings] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [soldForm,    setSoldForm]    = useState({ buyer_id:'', agreed_price:'' });
  const [ratingForm,  setRatingForm]  = useState({ score:5, comment:'' });
  const [txnId,       setTxnId]       = useState(null);
  const [feedback,    setFeedback]    = useState('');
  const [error,       setError]       = useState('');

  useEffect(() => {
    getListing(id)
      .then(r => {
        setListing(r.data.listing);
        return getUserRatings(r.data.listing.seller_id);
      })
      .then(r => setSellerRatings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleMarkSold = async () => {
    setError('');
    try {
      const res = await markSold(id, {
        buyer_id:     parseInt(soldForm.buyer_id),
        agreed_price: parseFloat(soldForm.agreed_price),
      });
      setTxnId(res.data.transaction_id);
      setListing(l => ({ ...l, status: 'sold' }));
      setFeedback('Marked as sold! Now rate the buyer below.');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not mark as sold.');
    }
  };

  const handleRate = async () => {
    setError('');
    try {
      await submitRating({
        transaction_id: txnId,
        score:   ratingForm.score,
        comment: ratingForm.comment || null,
      });
      setFeedback('Rating submitted! Thank you.');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not submit rating.');
    }
  };

  if (loading)           return <div className="loading">Loading…</div>;
  if (!listing)          return <div className="page"><div className="alert alert-error">Listing not found.</div></div>;

  const isSeller  = user?.user_id === listing.seller_id;
  const isSold    = listing.status === 'sold';

  return (
    <div className="page">
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="listing-detail">
        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className="listing-detail-main">
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
            <span className="badge badge-blue">{listing.condition}</span>
            {listing.course_code && <span className="badge badge-blue">{listing.course_code}</span>}
            <span className={`badge ${isSold ? 'badge-amber' : 'badge-green'}`}>
              {isSold ? 'Sold' : 'Available'}
            </span>
          </div>

          <div className="listing-title-lg">{listing.title}</div>
          <div className="listing-price-lg">৳{listing.listed_price.toLocaleString()}</div>

          <div style={{ marginBottom: 20 }}>
            <div className="detail-row">
              <span className="detail-key">Category</span>
              <span className="detail-value">Category #{listing.category_id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Condition</span>
              <span className="detail-value">{listing.condition}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Original price</span>
              <span className="detail-value">৳{listing.original_price.toLocaleString()}</span>
            </div>
            {listing.suggested_price_min && (
              <div className="detail-row">
                <span className="detail-key">Suggested range</span>
                <span className="detail-value" style={{ color:'var(--c-success)' }}>
                  ৳{listing.suggested_price_min} – ৳{listing.suggested_price_max}
                </span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-key">Price override</span>
              <span className="detail-value">{listing.price_override ? 'Yes (custom price)' : 'No (within suggestion)'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Listed on</span>
              <span className="detail-value">{new Date(listing.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Seller mark-sold panel */}
          {isSeller && !isSold && (
            <div style={{ borderTop:'1px solid var(--c-border)', paddingTop:20 }}>
              <div className="form-section-title" style={{ marginBottom:14 }}>Mark as sold</div>
              {error    && <div className="alert alert-error"   style={{ marginBottom:12 }}>{error}</div>}
              {feedback && <div className="alert alert-success" style={{ marginBottom:12 }}>{feedback}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Buyer's user ID</label>
                  <input className="form-input" type="number" value={soldForm.buyer_id}
                    onChange={e => setSoldForm(f => ({...f, buyer_id: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Agreed price (৳)</label>
                  <input className="form-input" type="number" value={soldForm.agreed_price}
                    onChange={e => setSoldForm(f => ({...f, agreed_price: e.target.value}))} />
                </div>
              </div>
              <button className="btn btn-accent" style={{ marginTop:12 }} onClick={handleMarkSold}>
                Confirm sale
              </button>
            </div>
          )}

          {/* Rating panel (shown after marking sold) */}
          {isSeller && isSold && txnId && (
            <div style={{ borderTop:'1px solid var(--c-border)', paddingTop:20 }}>
              <div className="form-section-title" style={{ marginBottom:14 }}>Rate the buyer</div>
              {error    && <div className="alert alert-error"   style={{ marginBottom:12 }}>{error}</div>}
              {feedback && <div className="alert alert-success" style={{ marginBottom:12 }}>{feedback}</div>}
              <div className="form-group" style={{ marginBottom:12 }}>
                <label className="form-label">Score</label>
                <select className="form-select" style={{ maxWidth:160 }}
                  value={ratingForm.score}
                  onChange={e => setRatingForm(f => ({...f, score: parseInt(e.target.value)}))}>
                  {[5,4,3,2,1].map(s => <option key={s} value={s}>{'★'.repeat(s)} ({s}/5)</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Comment (optional)</label>
                <textarea className="form-textarea" rows={2} value={ratingForm.comment}
                  onChange={e => setRatingForm(f => ({...f, comment: e.target.value}))} />
              </div>
              <button className="btn btn-primary" style={{ marginTop:8 }} onClick={handleRate}>
                Submit rating
              </button>
            </div>
          )}
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <div className="listing-detail-sidebar">
          <div className="sidebar-card">
            <div style={{ fontFamily:'var(--font-display)', fontWeight:700, marginBottom:10 }}>
              About the seller
            </div>
            {sellerRatings ? (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <div className="navbar-avatar" style={{ width:40, height:40 }}>
                    {sellerRatings.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:'0.9rem' }}>{sellerRatings.full_name}</div>
                    <div style={{ fontSize:'0.8rem', color:'var(--c-muted)' }}>
                      {sellerRatings.total_ratings} rating{sellerRatings.total_ratings !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <StarRating score={sellerRatings.reputation_score} />
                  <span style={{ fontSize:'0.875rem', fontWeight:700, color:'var(--c-primary)' }}>
                    {sellerRatings.reputation_score?.toFixed(1) ?? '—'}
                  </span>
                </div>

                {sellerRatings.ratings.slice(0,3).map(r => (
                  <div key={r.rating_id} style={{
                    marginTop:12, paddingTop:10,
                    borderTop:'1px solid var(--c-border)',
                    fontSize:'0.8rem'
                  }}>
                    <StarRating score={r.score} size="0.85rem" />
                    {r.comment && <div style={{ color:'var(--c-muted)', marginTop:4 }}>{r.comment}</div>}
                  </div>
                ))}
              </>
            ) : (
              <div style={{ color:'var(--c-muted)', fontSize:'0.875rem' }}>No ratings yet.</div>
            )}
          </div>

          {!isSeller && !isSold && user && (
            <div className="sidebar-card">
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, marginBottom:8 }}>
                Interested?
              </div>
              <p style={{ fontSize:'0.875rem', color:'var(--c-muted)', marginBottom:14 }}>
                Arrange the exchange with the seller on campus, then both parties confirm completion in the app.
              </p>
              <div className="alert" style={{ background:'var(--c-primary-light)', color:'var(--c-primary)', fontSize:'0.82rem' }}>
                Seller ID: <strong>{listing.seller_id}</strong> — share your user ID ({user.user_id}) with them so they can confirm the sale.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
