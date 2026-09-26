import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [endpointCount, setEndpointCount] = useState(0);
  const [editName, setEditName] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [freshCreatedAt, setFreshCreatedAt] = useState(null);
  const [role, setRole] = useState('user');

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // Delete Account state
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Load user and stats when the page loads
  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (!userString) {
      navigate('/login');
      return;
    }

    const loggedInUser = JSON.parse(userString);
    setUser(loggedInUser);
    setEditName(loggedInUser.name);
    setFreshCreatedAt(loggedInUser.created_at);

    // Fetch the count of mock endpoints and fresh user data
    fetch(`http://127.0.0.1:5001/api/profile-stats?user_id=${loggedInUser.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.count !== undefined) {
          setEndpointCount(data.count);
        }
        if (data.created_at) {
          setFreshCreatedAt(data.created_at);
          // Update cache silently
          loggedInUser.created_at = data.created_at;
          localStorage.setItem('user', JSON.stringify(loggedInUser));
        }
        if (data.role) {
          setRole(data.role);
        }
      })
      .catch(err => {
        console.error("Could not load stats", err);
      });
  }, [navigate]);

  // Saves the new name to the backend
  const handleSaveName = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    if (!editName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    const formData = new FormData();
    formData.append('user_id', user.id);
    formData.append('name', editName);

    try {
      const response = await fetch('http://127.0.0.1:5001/api/update-profile', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        setError(errorText || 'Failed to update profile');
        return;
      }

      // Update local storage so the new name shows everywhere
      const updatedUser = { ...user, name: editName };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Show "Saved!" briefly
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
      }, 2000);
      
    } catch (err) {
      setError('Could not connect to server');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    const formData = new FormData();
    formData.append('user_id', user.id);
    formData.append('current_password', currentPassword);
    formData.append('new_password', newPassword);
    formData.append('confirm_password', confirmPassword);

    try {
      const response = await fetch('http://127.0.0.1:5001/api/change-password', {
        method: 'POST',
        body: formData
      });

      const responseText = await response.text();

      if (!response.ok) {
        setPasswordMsg({ type: 'error', text: responseText || 'Failed to change password' });
        return;
      }

      setPasswordMsg({ type: 'success', text: responseText });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: 'Could not connect to server' });
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    const formData = new FormData();
    formData.append('user_id', user.id);

    try {
      const response = await fetch('http://127.0.0.1:5001/api/delete-account', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        setDeleteError(errorText || 'Failed to delete account');
        return;
      }

      localStorage.removeItem('user');
      navigate('/');
    } catch (err) {
      setDeleteError('Could not connect to server');
    }
  };

  if (!user) return null;

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
        <div style={{
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          backgroundColor: '#4a6cf7', 
          color: 'white', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: '2rem',
          fontWeight: 'bold'
        }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 style={{ margin: '0 0 5px 0' }}>{user.name}</h2>
          <span className={`badge ${role === 'admin' ? 'status-500' : 'status-200'}`} style={{ fontSize: '0.8rem' }}>
            {role.toUpperCase()}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p><strong>Email:</strong> {user.email}</p>
        <p>
          <strong>Registered on:</strong>{' '}
          {freshCreatedAt ? new Date(freshCreatedAt).toLocaleDateString() : 'N/A'}
        </p>
      </div>

      <div style={{ padding: '20px', backgroundColor: '#f0f4f8', borderRadius: '4px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Activity Stats</h3>
        <p style={{ margin: '0 0 15px 0' }}>You have created <strong>{endpointCount}</strong> mock endpoints.</p>
        <a 
          href={`http://127.0.0.1:5001/api/export-endpoints/${user.id}`} 
          download="my-endpoints.txt" 
          className="btn btn-secondary btn-small"
        >
          Download My Endpoints
        </a>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '30px 0' }} />

      <h3>Edit Profile</h3>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSaveName} style={{ marginBottom: '30px' }}>
        <div className="form-group">
          <label>Display Name</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={editName} 
              onChange={(e) => setEditName(e.target.value)} 
              required 
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn">
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>
      </form>

      <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '30px 0' }} />

      <h3>Change Password</h3>
      {passwordMsg.text && (
        <div className={passwordMsg.type === 'error' ? 'error-message' : 'badge status-200'} style={{ marginBottom: '15px', padding: '10px', display: 'block' }}>
          {passwordMsg.text}
        </div>
      )}

      <form onSubmit={handleChangePassword}>
        <div className="form-group">
          <label>Current Password</label>
          <input 
            type="password" 
            value={currentPassword} 
            onChange={(e) => setCurrentPassword(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <input 
            type="password" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Confirm New Password</label>
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit" className="btn">Update Password</button>
      </form>

      <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '30px 0' }} />

      <h3 style={{ color: '#dc3545' }}>Danger Zone</h3>
      {deleteError && <div className="error-message">{deleteError}</div>}
      
      {!showConfirm ? (
        <button 
          onClick={() => setShowConfirm(true)} 
          className="btn btn-danger"
        >
          Delete Account
        </button>
      ) : (
        <div style={{ padding: '15px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px' }}>
          <p style={{ margin: '0 0 15px 0', color: '#721c24' }}>
            <strong>Are you sure?</strong> This will permanently delete your account and all of your mock endpoints. This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleDeleteAccount} className="btn btn-danger">
              Yes, Delete My Account
            </button>
            <button onClick={() => setShowConfirm(false)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
