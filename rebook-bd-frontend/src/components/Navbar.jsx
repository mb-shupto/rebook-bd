import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          Re<span>Book</span> BD
        </Link>

        <div className="navbar-links">
          <Link to="/" className="navbar-link">Browse</Link>

          {user ? (
            <>
              <Link to="/create-listing" className="navbar-link">+ List Item</Link>
              <div className="navbar-user">
                <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="navbar-avatar">
                    {user.full_name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="navbar-link"
                  style={{ background: 'none', border: 'none', padding: '6px 14px' }}
                >
                  Log out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login"    className="navbar-link">Log in</Link>
              <Link to="/register" className="btn btn-accent btn-sm">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
