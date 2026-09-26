import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        const text = await response.text();
        const sections = text.split("ENDPOINTS\n");
        const userSection = sections[0].replace("USERS\n", "").trim();
        const endpointSection = sections[1] ? sections[1].trim() : "";
        
        const parsedUsers = userSection ? userSection.split("\n").map(line => {
            const parts = line.split("::");
            return { id: parts[0], name: parts[1], email: parts[2], role: parts[3] };
        }) : [];

        const parsedEndpoints = endpointSection ? endpointSection.split("\n").map(line => {
            const parts = line.split("::");
            return { id: parts[0], user_id: parts[1], title: parts[2], status_code: parts[3] };
        }) : [];
        
        const data = { users: parsedUsers, endpoints: parsedEndpoints };
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
  
  // Delete a user account and all their endpoints
  const handleDeleteUser = async (targetUserId) => {
    if (targetUserId === user.id) {
      alert("You cannot delete your own admin account from here. Use the Profile page.");
      return;
    }
    
    if (!window.confirm('Are you sure you want to completely remove this user and all their endpoints?')) {
      return;
    }

    const formData = new FormData();
    formData.append('user_id', targetUserId);

    try {
      const response = await fetch('http://127.0.0.1:5001/api/delete-account', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== targetUserId));
        // Also remove endpoints belonging to this user
        setEndpoints(endpoints.filter(e => e.user_id !== targetUserId));
      } else {
        alert('Failed to delete user');
      }
    } catch (err) {
      alert('Error deleting user');
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  {u.id !== user.id && (
                    <button 
                      onClick={() => handleDeleteUser(u.id)} 
                      className="btn btn-danger btn-small"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center">No users found</td>
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
