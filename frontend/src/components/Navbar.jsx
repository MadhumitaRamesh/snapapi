import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const handleLogout = () => {
    const wasAdmin = user && user.role === 'admin';
    localStorage.removeItem('user');
    if (wasAdmin) {
      navigate('/admin-login');
    } else {
      navigate('/login');
    }
  };

  const getLinkClass = (path) => {
    return location.pathname === path ? "active-link" : "";
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">SnapAPI</Link>
      <div className="navbar-links">
        {user ? (
          <>
            <span>Hi, {user.name}</span>
            {user.role === 'admin' ? (
              <Link to="/admin" className={getLinkClass('/admin')}>Admin Panel</Link>
            ) : (
              <Link to="/dashboard" className={getLinkClass('/dashboard')}>Dashboard</Link>
            )}
            <button onClick={handleLogout} className="btn btn-secondary btn-small">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className={getLinkClass('/login')}>User Login</Link>
            <Link to="/admin-login" className={getLinkClass('/admin-login')}>Admin Login</Link>
            <Link to="/register" className="btn btn-small">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
