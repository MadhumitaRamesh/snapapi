import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

function EditEndpoint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [responseText, setResponseText] = useState('');
  const [statusCode, setStatusCode] = useState(200);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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

    fetchEndpointForEdit();
  }, [id, user, navigate]);

  // Fetches the current data for the endpoint so the user can edit it
  const fetchEndpointForEdit = async () => {
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
        
        // Check ownership
        if (user.role !== 'admin' && data.user_id !== user.id) {
          navigate('/dashboard');
          return;
        }

        setTitle(data.title);
        setResponseText(data.response_text);
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

    const formData = new FormData();
    formData.append('title', title);
    formData.append('response_text', responseText);
    formData.append('status_code', statusCode);

    try {
      const response = await fetch(`http://127.0.0.1:5001/api/endpoints/${id}`, {
        method: 'PUT',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        setError(errorText || 'Failed to update endpoint');
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
          <label>Response Text (Response Body)</label>
          <textarea 
            rows="10" 
            value={responseText} 
            onChange={(e) => setResponseText(e.target.value)} 
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
