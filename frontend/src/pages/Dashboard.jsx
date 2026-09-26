import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

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
    if (!user) {
      navigate('/login');
      return;
    }

    fetchEndpoints();
  }, [navigate]);

  // Gets the endpoints for the logged-in user from the backend
  const fetchEndpoints = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5001/api/endpoints?user_id=${user.id}`);
      if (response.ok) {
        const text = await response.text();
        if (!text.trim()) {
            setEndpoints([]);
        } else {
            const lines = text.trim().split("\n");
            const parsedEndpoints = lines.map(line => {
              const parts = line.split("::");
              return { 
                id: parts[0], 
                title: parts[1], 
                status_code: parts[2], 
                created_at: parts[3] 
              };
            });
            setEndpoints(parsedEndpoints);
        }
      } else {
        setError('Failed to fetch endpoints');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  // Deletes an endpoint after asking for confirmation
  const handleDelete = async (endpointId) => {
    if (!window.confirm('Are you sure you want to delete this endpoint?')) {
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

  // Copies the live URL to the clipboard and shows a "Copied!" message briefly
  const copyToClipboard = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  if (loading) return <div className="text-center mt-2">Loading dashboard...</div>;

  // Helper to pick the right CSS class for the status code badge
  const getStatusClass = (code) => {
    if (code >= 200 && code < 300) return 'badge status-200';
    if (code === 404) return 'badge status-404';
    if (code >= 500) return 'badge status-500';
    return 'badge'; 
  };

  return (
    <div>
      <div className="page-header">
        <h2>Your Endpoints</h2>
        <Link to="/create" className="btn">Create New Endpoint</Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {endpoints.length === 0 && !error && (
        <div className="card text-center" style={{ padding: '50px 20px', backgroundColor: '#fdfdfd' }}>
          <h3>No endpoints yet</h3>
          <p className="mb-2" style={{ color: '#666' }}>Click 'Create New Endpoint' to get started and build your first mock API.</p>
          <Link to="/create" className="btn">Create New Endpoint</Link>
        </div>
      )}

      {endpoints.length > 0 && (
        <div>
          {endpoints.map(endpoint => {
            const liveUrl = `http://127.0.0.1:5001/mock/${endpoint.id}`;
            return (
              <div key={endpoint.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0 }}>
                    <Link to={`/endpoint/${endpoint.id}`}>
                      {endpoint.title}
                    </Link>
                  </h3>
                  <span className={getStatusClass(endpoint.status_code)}>
                    {endpoint.status_code}
                  </span>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <strong>Live URL: </strong> 
                  <a href={liveUrl} target="_blank" rel="noreferrer" style={{ marginRight: '10px' }}>
                    {liveUrl}
                  </a>
                  <button 
                    onClick={() => copyToClipboard(liveUrl, endpoint.id)} 
                    className="btn btn-outline btn-small"
                  >
                    {copiedId === endpoint.id ? 'Copied!' : 'Copy URL'}
                  </button>
                </div>
                
                <p><strong>Created at:</strong> {new Date(endpoint.created_at).toLocaleString()}</p>
                
                <button 
                  onClick={() => handleDelete(endpoint.id)} 
                  className="btn btn-danger btn-small mt-2"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
