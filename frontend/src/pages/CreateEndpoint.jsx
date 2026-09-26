import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function CreateEndpoint() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [responseText, setResponseText] = useState("Hello World");
  const [statusCode, setStatusCode] = useState(200);
  const [error, setError] = useState('');
  const [createdUrl, setCreatedUrl] = useState('');

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
    }
  }, [user, navigate]);

  // Submits the form data to create a new endpoint
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCreatedUrl('');

    const formData = new FormData();
    formData.append('user_id', user.id);
    formData.append('title', title);
    formData.append('response_text', responseText);
    formData.append('status_code', statusCode);

    try {
      const response = await fetch('http://127.0.0.1:5001/api/endpoints', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        setError(errorText || 'Failed to create endpoint');
        return;
      }
      
      const data = await response.text();

      setCreatedUrl(`http://127.0.0.1:5001/mock/${data.id}`);
      setTitle('');
      setResponseText("Hello World");
      setStatusCode(200);
    } catch (err) {
      setError('Could not connect to server');
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="page-header mb-2">
        <h2>Create New Mock Endpoint</h2>
        <Link to="/dashboard" className="btn btn-secondary">Back</Link>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {createdUrl && (
        <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
          <strong>Endpoint created successfully!</strong>
          <p>Live URL: <a href={createdUrl} target="_blank" rel="noreferrer">{createdUrl}</a></p>
        </div>
      )}
      
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
        
        <button type="submit" className="btn">Create Endpoint</button>
      </form>
    </div>
  );
}

export default CreateEndpoint;
