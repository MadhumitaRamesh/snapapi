import React from 'react';
import { Link } from 'react-router-dom';

function Landing() {
  return (
    <div className="text-center mt-2">
      <h1>Welcome to SnapAPI</h1>
      <p className="mb-2">A lightweight micro-API mocking engine for developers.</p>
      
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
        <h2>Stop waiting for the backend</h2>
        <p>
          SnapAPI lets you build the frontend instantly. Create mock endpoints with custom JSON payloads 
          and status codes. It's like having the backend ready before it's even written.
        </p>
        <div style={{ marginTop: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link to="/register" className="btn">Get Started</Link>
          <Link to="/login" className="btn btn-secondary">User Login</Link>
        </div>
        <div style={{ marginTop: '20px' }}>
          <Link to="/admin-login" className="btn btn-outline btn-small">Admin Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Landing;
