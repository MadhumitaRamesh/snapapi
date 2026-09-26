import React, { useState, useEffect } from 'react';

function Tester() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Results
  const [statusCode, setStatusCode] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const [responseBody, setResponseBody] = useState('');

  // On load, read ?url= from query string to prefill the input
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefillUrl = params.get('url');
    if (prefillUrl) {
      setUrl(prefillUrl);
    }
  }, []);

  // Make the actual fetch request
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError('');
    setStatusCode(null);
    setResponseTime(null);
    setResponseBody('');

    const startTime = Date.now();

    try {
      const response = await fetch(url);
      const endTime = Date.now();
      
      const rawText = await response.text();
      
      setStatusCode(response.status);
      setResponseTime(endTime - startTime);
      setResponseBody(rawText);
    } catch (err) {
      setError('Could not reach that URL. Check it\'s correct and the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all fields
  const handleClear = () => {
    setUrl('');
    setError('');
    setStatusCode(null);
    setResponseTime(null);
    setResponseBody('');
  };

  // Helper to pick the right CSS class for the status code badge
  const getStatusClass = (code) => {
    if (code >= 200 && code < 300) return 'badge status-200';
    if (code === 404) return 'badge status-404';
    if (code >= 500) return 'badge status-500';
    return 'badge'; 
  };

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>API Tester</h2>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        Paste a mock URL below to test it directly from your browser.
      </p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input 
          type="text" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          placeholder="http://127.0.0.1:5001/mock/..." 
          style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          required
        />
        <button type="submit" className="btn" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Request'}
        </button>
        <button type="button" onClick={handleClear} className="btn btn-secondary">
          Clear
        </button>
      </form>

      {statusCode && (
        <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Response</h3>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: '#555' }}>Response time: <strong>{responseTime}ms</strong></span>
              <span className={getStatusClass(statusCode)}>Status: {statusCode}</span>
            </div>
          </div>
          
          <pre style={{ 
            backgroundColor: '#f4f4f4', 
            padding: '15px', 
            borderRadius: '4px', 
            overflowX: 'auto',
            border: '1px solid #ddd',
            margin: 0
          }}>
            {responseBody}
          </pre>
        </div>
      )}
    </div>
  );
}

export default Tester;
