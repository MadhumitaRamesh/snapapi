import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.svg';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const userString = localStorage.getItem('user');
  let user = null;
  if (userString) {
    const parts = userString.split("::");
    user = {
      id: parts[0],
      name: parts[1],
      email: parts[2],
      role: parts[3],
      created_at: parts[4]
    };
  }

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
      <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center' }}>
        <img src={logo} alt="SnapAPI logo" className="logo" style={{ height: '28px', marginRight: '10px' }} />
        SnapAPI
      </Link>
      <div className="navbar-links" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <Link to="/docs" className={getLinkClass('/docs')}>Docs</Link>
        <span style={{ color: '#ccc' }}>|</span>
        
        {user ? (
          <>
            {user.role === 'admin' ? (
              <>
                <Link to="/admin" className={getLinkClass('/admin')}>Admin Panel</Link>
                <span style={{ color: '#ccc' }}>|</span>
              </>
            ) : (
              <>
                <Link to="/dashboard" className={getLinkClass('/dashboard')}>Dashboard</Link>
                <span style={{ color: '#ccc' }}>|</span>
                <Link to="/profile" className={getLinkClass('/profile')}>Profile</Link>
                <span style={{ color: '#ccc' }}>|</span>
              </>
            )}
            <Link to="/tester" className={getLinkClass('/tester')}>Tester</Link>
            <span style={{ color: '#ccc' }}>|</span>
            <button onClick={handleLogout} className="btn btn-secondary btn-small">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className={getLinkClass('/login')}>User Login</Link>
            <span style={{ color: '#ccc' }}>|</span>
            <Link to="/admin-login" className={getLinkClass('/admin-login')}>Admin Login</Link>
            <span style={{ color: '#ccc' }}>|</span>
            <Link to="/register" className="btn btn-small">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
