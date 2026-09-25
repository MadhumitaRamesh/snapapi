import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Handles the form submission and logs the user in if credentials are correct
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    try {
      const response = await fetch('http://127.0.0.1:5001/api/login', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        setError(errorText || 'Login failed');
        return;
      }

      const data = await response.json();

      if (data.user.role === 'admin') {
        setError('Please use Admin Login for this account');
        return;
      }

      // Save user info to local storage
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
      
    } catch (err) {
      setError('Could not connect to server');
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 className="mb-2">User Login</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        
        <button type="submit" className="btn" style={{ width: '100%' }}>Login</button>
      </form>
    </div>
  );
}

export default Login;
