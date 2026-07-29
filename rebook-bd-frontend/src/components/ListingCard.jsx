import { useNavigate } from 'react-router-dom';
import StarRating from './StarRating';

const CONDITION_COLOR = {
  'New':      'badge-green',
  'Like-New': 'badge-green',
  'Good':     'badge-blue',
  'Fair':     'badge-amber',
  'Worn':     'badge-amber',
};

export default function ListingCard({ listing }) {
  const navigate = useNavigate();

  return (
    <div className="listing-card" onClick={() => navigate(`/listings/${listing.listing_id}`)}>
      <div className="listing-card-meta">
        <span className={`badge ${CONDITION_COLOR[listing.condition] ?? 'badge-blue'}`}>
          {listing.condition}
        </span>
        {listing.course_code && (
          <span className="badge badge-blue">{listing.course_code}</span>
        )}
        {listing.price_override && (
          <span className="badge badge-amber" title="Price differs from suggestion">Custom price</span>
        )}
      </div>

      <div className="listing-card-title">{listing.title}</div>

      <div className="listing-card-price">
        ৳{listing.listed_price.toLocaleString()}
        {listing.suggested_price_min && (
          <span>
            &nbsp;(suggested ৳{listing.suggested_price_min}–{listing.suggested_price_max})
          </span>
        )}
      </div>

      <div className="listing-card-seller">
        <StarRating score={listing.seller_reputation ?? 0} size="0.85rem" />
        &nbsp;Seller #{listing.seller_id}
      </div>
    </div>
  );
}
