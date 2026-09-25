import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

function EditEndpoint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [jsonPayload, setJsonPayload] = useState('');
  const [statusCode, setStatusCode] = useState(200);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchEndpointForEdit();
  }, [id, user, navigate]);

  // Fetches the current data for the endpoint so the user can edit it
  const fetchEndpointForEdit = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5001/api/endpoints/${id}`);
      if (response.ok) {
        const data = await response.json();
        
        // Check ownership
        if (user.role !== 'admin' && data.user_id !== user.id) {
          navigate('/dashboard');
          return;
        }

        setTitle(data.title);
        
        // Format JSON payload nicely for editing
        try {
          const parsed = JSON.parse(data.json_payload);
          setJsonPayload(JSON.stringify(parsed, null, 2));
        } catch (e) {
          setJsonPayload(data.json_payload);
        }
        
        setStatusCode(data.status_code);
      } else {
        setError('Failed to fetch endpoint details');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  // Submits the updated data to the backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check if JSON is valid
    try {
      JSON.parse(jsonPayload);
    } catch (err) {
      setError('Invalid JSON payload format');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5001/api/endpoints/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          json_payload: jsonPayload,
          status_code: parseInt(statusCode)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update endpoint');
        return;
      }

      navigate(`/endpoint/${id}`);
    } catch (err) {
      setError('Could not connect to server');
    }
  };

  if (loading) return <div className="text-center mt-2">Loading editor...</div>;
  if (error && !title) return <div className="error-message text-center mx-auto mt-2" style={{ maxWidth: '600px' }}>{error}</div>;

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="page-header mb-2">
        <h2>Edit Endpoint</h2>
        <Link to={`/endpoint/${id}`} className="btn btn-secondary">Cancel</Link>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Endpoint Title</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="e.g., Get Users Response"
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Status Code</label>
          <select 
            value={statusCode} 
            onChange={(e) => setStatusCode(e.target.value)}
          >
            <option value="200">200 OK</option>
            <option value="201">201 Created</option>
            <option value="400">400 Bad Request</option>
            <option value="401">401 Unauthorized</option>
            <option value="403">403 Forbidden</option>
            <option value="404">404 Not Found</option>
            <option value="500">500 Internal Server Error</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>JSON Payload (Response Body)</label>
          <textarea 
            rows="10" 
            value={jsonPayload} 
            onChange={(e) => setJsonPayload(e.target.value)} 
            style={{ fontFamily: 'monospace' }}
            required
          ></textarea>
        </div>
        
        <button type="submit" className="btn">Save Changes</button>
      </form>
    </div>
  );
}

export default EditEndpoint;
