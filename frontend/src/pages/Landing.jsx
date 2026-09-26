import React from 'react';
import { Link } from 'react-router-dom';
import banner from '../assets/banner.svg';

function Landing() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '10px 20px' }}>
      <h1 style={{ margin: '0 0 10px 0' }}>Welcome to SnapAPI</h1>
      <p style={{ margin: '0 0 15px 0', color: '#555' }}>A lightweight micro-API mocking engine for developers.</p>
      
      <img 
        src={banner} 
        alt="SnapAPI banner" 
        className="banner-image" 
        style={{ maxWidth: '100%', maxHeight: '20vh', display: 'block', margin: '0 auto 20px auto' }} 
      />
      
      <div className="card" style={{ maxWidth: '600px', width: '100%', margin: '0', textAlign: 'left', padding: '20px' }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Stop waiting for the backend</h2>
        <p style={{ margin: '0 0 20px 0' }}>
          SnapAPI lets you build the frontend instantly. Create mock endpoints with custom JSON payloads 
          and status codes. It's like having the backend ready before it's even written.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
          <Link to="/register" className="btn">Get Started</Link>
          <Link to="/login" className="btn btn-secondary">User Login</Link>
        </div>
        <div>
          <Link to="/admin-login" className="btn btn-outline btn-small">Admin Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Landing;
