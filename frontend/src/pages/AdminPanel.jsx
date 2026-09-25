import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== 'admin') {
      navigate('/admin-login'); // redirect non-admins
      return;
    }

    fetchAdminData();
  }, [user, navigate]);

  // Fetch all users and endpoints for the admin view
  const fetchAdminData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5001/api/admin/data');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setEndpoints(data.endpoints);
      } else {
        setError('Failed to fetch admin data');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  // Delete an endpoint globally
  const handleDeleteEndpoint = async (endpointId) => {
    if (!window.confirm('Are you sure you want to delete this endpoint across the system?')) {
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5001/api/endpoints/${endpointId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setEndpoints(endpoints.filter(e => e.id !== endpointId));
      } else {
        alert('Failed to delete endpoint');
      }
    } catch (err) {
      alert('Error deleting endpoint');
    }
  };
  
  // Clear the admin session and redirect to admin login
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/admin-login');
  };

  if (loading) return <div className="text-center mt-2">Loading admin panel...</div>;

  // Pick the appropriate CSS class based on HTTP status code
  const getStatusClass = (code) => {
    if (code >= 200 && code < 300) return 'badge status-200';
    if (code === 404) return 'badge status-404';
    if (code >= 500) return 'badge status-500';
    return 'badge';
  };

  return (
    <div>
      <div className="page-header">
        <h2>System Admin Panel</h2>
        <button onClick={handleLogout} className="btn btn-secondary btn-small">Admin Logout</button>
      </div>
      
      {error && <div className="error-message">{error}</div>}

      <div className="card">
        <h3>All Registered Users ({users.length})</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id.substring(0, 8)}...</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>All Mock Endpoints ({endpoints.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Owner</th>
              <th>Status Code</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map(ep => (
              <tr key={ep.id}>
                <td>{ep.title}</td>
                <td>{ep.user_email}</td>
                <td>
                  <span className={getStatusClass(ep.status_code)}>
                    {ep.status_code}
                  </span>
                </td>
                <td>{new Date(ep.created_at).toLocaleDateString()}</td>
                <td>
                  <button 
                    onClick={() => handleDeleteEndpoint(ep.id)} 
                    className="btn btn-danger btn-small"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {endpoints.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center">No endpoints found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminPanel;
