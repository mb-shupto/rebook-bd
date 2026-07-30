import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getListings, getMe, getUserRatings } from '../api';
import { useAuth } from '../contexts/AuthContext';
import ListingCard from '../components/ListingCard';
import StarRating from '../components/StarRating';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate   = useNavigate();
  const [profile,     setProfile]     = useState(user);
  const [myListings,  setMyListings]  = useState([]);
  const [myRatings,   setMyRatings]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError('');

    Promise.all([
      getMe(),
      getListings(),
      getUserRatings(user.user_id),
    ])
      .then(([meRes, listRes, ratingRes]) => {
        setProfile(meRes.data);
        updateUser(meRes.data);
        setMyListings(listRes.data.listings.filter(l => l.seller_id === meRes.data.user_id));
        setMyRatings(ratingRes.data);
      })
      .catch((err) => {
        setError(err.response?.data?.error ?? 'Could not load your full profile right now.');
      })
      .finally(() => setLoading(false));
  }, [user?.user_id]);

  if (!user) return null;

  const activeListingsCount = myListings.filter(l => l.status === 'active').length;
  const averageListedPrice = myListings.length
    ? Math.round(myListings.reduce((sum, l) => sum + l.listed_price, 0) / myListings.length)
    : 0;
  const memberSince = profile?.member_since
    ? new Date(profile.member_since).toLocaleDateString()
    : '—';

  return (
    <div className="page">
      {error && <div className="alert alert-error" style={{ marginBottom: 18 }}>{error}</div>}

      {/* Profile header */}
      <div className="profile-header">
        <div className="profile-avatar">{profile?.full_name?.[0]?.toUpperCase()}</div>
        <div>
          <div className="profile-name">{profile?.full_name}</div>
          <div className="profile-email">{profile?.university_email}</div>
          {profile?.department && (
            <span className="badge badge-blue" style={{ marginTop:8 }}>{profile.department}</span>
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

      <div className="profile-stats">
        <div className="profile-stat-card">
          <div className="profile-stat-label">User ID</div>
          <div className="profile-stat-value">#{profile?.user_id}</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-label">Member since</div>
          <div className="profile-stat-value">{memberSince}</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-label">Active listings</div>
          <div className="profile-stat-value">{activeListingsCount}</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-label">Avg listed price</div>
          <div className="profile-stat-value">৳{averageListedPrice.toLocaleString()}</div>
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

          {myRatings?.ratings?.length === 0 && (
            <div style={{ marginTop: 36 }} className="empty-state">
              <div className="empty-state-icon">⭐</div>
              <div className="empty-state-text">No ratings yet. Complete a sale to receive your first review.</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
