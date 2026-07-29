/**
 * PriceMeter — Signature component for ReBook BD.
 *
 * Shows the fair-price suggestion band as a visual track with a moving
 * marker representing the seller's entered price. The marker and band
 * turn green when the price is inside the suggestion, amber when outside.
 *
 * Props:
 *   suggestedMin  — lower bound of the suggested range (number)
 *   suggestedMax  — upper bound of the suggested range (number)
 *   listedPrice   — the seller's current input (number)
 *   originalPrice — used to set the scale ceiling (number)
 */
export default function PriceMeter({ suggestedMin, suggestedMax, listedPrice, originalPrice }) {
  // Nothing to show until the backend has returned a suggestion
  if (!suggestedMin || !suggestedMax) {
    return (
      <div className="price-meter">
        <div className="price-meter-label">Fair-Price Meter</div>
        <div className="price-meter-status no-data">
          Fill in category, condition, and original price to see a suggestion.
        </div>
      </div>
    );
  }

  // Scale: 0 → 120% of original price
  const scaleMax   = (originalPrice ?? suggestedMax * 1.5) * 1.2;
  const clamp      = (v) => Math.max(0, Math.min(100, (v / scaleMax) * 100));

  const bandLeft   = clamp(suggestedMin);
  const bandWidth  = clamp(suggestedMax) - bandLeft;
  const markerLeft = listedPrice ? clamp(listedPrice) : null;

  const inside = listedPrice >= suggestedMin && listedPrice <= suggestedMax;
  const state  = listedPrice ? (inside ? 'in-range' : 'out-range') : 'no-data';

  const statusText = !listedPrice
    ? 'Enter your asking price above.'
    : inside
    ? `✓ ৳${listedPrice.toLocaleString()} is within the suggested range — looks fair to buyers.`
    : listedPrice > suggestedMax
    ? `↑ ৳${listedPrice.toLocaleString()} is above the suggestion — buyers may hesitate.`
    : `↓ ৳${listedPrice.toLocaleString()} is below the suggestion — you may be underselling.`;

  return (
    <div className="price-meter">
      <div className="price-meter-label">Fair-Price Meter</div>

      <div className="price-meter-track">
        {/* Suggested band */}
        <div
          className={`price-meter-range ${state}`}
          style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
        />
        {/* Listed-price marker */}
        {markerLeft !== null && (
          <div
            className={`price-meter-marker ${state}`}
            style={{ left: `${markerLeft}%` }}
          />
        )}
      </div>

      <div className="price-meter-annotations">
        <span>৳0</span>
        <span style={{ color: 'var(--c-success)', fontWeight: 700 }}>
          ৳{suggestedMin.toLocaleString()} – ৳{suggestedMax.toLocaleString()} suggested
        </span>
        <span>৳{Math.round(scaleMax).toLocaleString()}</span>
      </div>

      <div className={`price-meter-status ${state}`}>{statusText}</div>
    </div>
  );
}
