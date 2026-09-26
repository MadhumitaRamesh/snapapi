import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

function EndpointDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [endpoint, setEndpoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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

    fetchEndpointDetails();
  }, [id, user, navigate]);

  // Fetches the specific endpoint data by its ID
  const fetchEndpointDetails = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5001/api/endpoints/${id}`);
      if (response.ok) {
        const text = await response.text();
        const parts = text.split("::");
        const data = {
            id: parts[0],
            user_id: parts[1],
            title: parts[2],
            response_text: parts[3],
            status_code: parts[4],
            created_at: parts[5]
        };
        setEndpoint(data);
      } else {
        setError('Failed to fetch endpoint details');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  // Copies the live mock URL to the clipboard
  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Deletes this endpoint after a confirmation prompt
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this endpoint?')) {
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5001/api/endpoints/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        navigate('/dashboard');
      } else {
        alert('Failed to delete endpoint');
      }
    } catch (err) {
      alert('Error deleting endpoint');
    }
  };

  if (loading) return <div className="text-center mt-2">Loading endpoint details...</div>;
  if (error) return <div className="error-message text-center mx-auto mt-2" style={{ maxWidth: '600px' }}>{error}</div>;
  if (!endpoint) return <div className="text-center mt-2">Endpoint not found</div>;

  // Selects the color class based on HTTP status
  const getStatusClass = (code) => {
    if (code >= 200 && code < 300) return 'badge status-200';
    if (code === 404) return 'badge status-404';
    if (code >= 500) return 'badge status-500';
    return 'badge'; 
  };

  const liveUrl = `http://127.0.0.1:5001/mock/${endpoint.id}`;
  const formattedResponse = endpoint.response_text;

  const isOwner = user.role === 'admin' || user.id === endpoint.user_id;

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header mb-2">
        <h2>{endpoint.title}</h2>
        <span className={getStatusClass(endpoint.status_code)}>
          {endpoint.status_code}
        </span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Live URL: </strong> 
        <a href={liveUrl} target="_blank" rel="noreferrer" style={{ marginRight: '10px' }}>
          {liveUrl}
        </a>
        <button 
          onClick={() => copyToClipboard(liveUrl)} 
          className="btn btn-outline btn-small"
          style={{ marginRight: '10px' }}
        >
          {copied ? 'Copied!' : 'Copy URL'}
        </button>
        <button 
          onClick={() => navigate(`/tester?url=${encodeURIComponent(liveUrl)}`)} 
          className="btn btn-secondary btn-small"
        >
          Test This Endpoint
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Created at:</strong> {new Date(endpoint.created_at).toLocaleString()}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Response Text:</strong>
        <pre style={{ 
          backgroundColor: '#f4f4f4', 
          padding: '15px', 
          borderRadius: '4px', 
          overflowX: 'auto',
          marginTop: '10px',
          border: '1px solid #ddd'
        }}>
          {formattedResponse}
        </pre>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
        <Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
        {isOwner && (
          <>
            <Link to={`/edit/${endpoint.id}`} className="btn">Edit</Link>
            <button onClick={handleDelete} className="btn btn-danger">Delete</button>
          </>
        )}
      </div>
    </div>
  );
}

export default EndpointDetails;
