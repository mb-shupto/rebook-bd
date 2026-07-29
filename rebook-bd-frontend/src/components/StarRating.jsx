export default function StarRating({ score, size = '1rem' }) {
  const rounded = Math.round(score ?? 0);
  return (
    <span className="stars" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`star ${i <= rounded ? 'filled' : 'empty'}`}>★</span>
      ))}
    </span>
  );
}
