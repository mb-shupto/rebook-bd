import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getListings, getUserRatings } from '../api';
import { useAuth } from '../contexts/AuthContext';
import ListingCard from '../components/ListingCard';
import StarRating from '../components/StarRating';

export default function ProfilePage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [myListings,  setMyListings]  = useState([]);
  const [myRatings,   setMyRatings]   = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getListings(),
      getUserRatings(user.user_id),
    ])
      .then(([listRes, ratingRes]) => {
        setMyListings(listRes.data.listings.filter(l => l.seller_id === user.user_id));
        setMyRatings(ratingRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <div className="page">
      {/* Profile header */}
      <div className="profile-header">
        <div className="profile-avatar">{user.full_name?.[0]?.toUpperCase()}</div>
        <div>
          <div className="profile-name">{user.full_name}</div>
          <div className="profile-email">{user.university_email}</div>
          {user.department && (
            <span className="badge badge-blue" style={{ marginTop:8 }}>{user.department}</span>
          )}
        </div>
        <div className="profile-rep">
          <div className="profile-rep-score">
            {myRatings?.reputation_score?.toFixed(1) ?? '—'}
          </div>
          <StarRating score={myRatings?.reputation_score ?? 0} />
          <div className="profile-rep-label">
            {myRatings?.total_ratings ?? 0} rating{myRatings?.total_ratings !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading your data…</div>
      ) : (
        <>
          {/* My listings */}
          <div style={{ marginBottom: 12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <h2 style={{ fontSize:'1.15rem', fontWeight:700 }}>My listings ({myListings.length})</h2>
            <button className="btn btn-accent btn-sm" onClick={() => navigate('/create-listing')}>
              + New listing
            </button>
          </div>

          {myListings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-text">You haven't listed anything yet.</div>
            </div>
          ) : (
            <div className="listing-grid" style={{ marginTop:0 }}>
              {myListings.map(l => <ListingCard key={l.listing_id} listing={l} />)}
            </div>
          )}

          {/* Ratings received */}
          {myRatings?.ratings?.length > 0 && (
            <div style={{ marginTop: 36 }}>
              <h2 style={{ fontSize:'1.15rem', fontWeight:700, marginBottom:16 }}>
                Ratings received
              </h2>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {myRatings.ratings.map(r => (
                  <div key={r.rating_id} className="card" style={{ padding:'16px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <StarRating score={r.score} />
                      <span style={{ fontSize:'0.8rem', color:'var(--c-muted)' }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {r.comment && (
                      <p style={{ marginTop:8, fontSize:'0.875rem', color:'var(--c-text)' }}>
                        "{r.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
