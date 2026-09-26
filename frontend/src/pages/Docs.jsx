import React, { useState } from 'react';

function Docs() {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedFetch, setCopiedFetch] = useState(false);

  // Copies text to clipboard and flashes a brief "Copied!" message
  const copyToClipboard = (text, setter) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => {
      setter(false);
    }, 2000);
  };

  const curlExample = 'curl http://127.0.0.1:5001/mock/your-id-here';
  
  const fetchExample = `fetch('http://127.0.0.1:5001/mock/your-id-here')
  .then(response => response.text())
  .then(data => console.log(data));`;

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Documentation & Help</h2>
      
      <div style={{ marginTop: '20px' }}>
        <h3>What is a Mock Endpoint?</h3>
        <p style={{ lineHeight: '1.6' }}>
          A mock endpoint is a fake API URL that returns exactly the data you tell it to. 
          When you're building a frontend application but the real backend isn't ready yet, 
          you can use SnapAPI to create a mock endpoint. It gives you a real URL that you can 
          call from your code to test how your app handles data.
        </p>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Testing with cURL</h3>
        <p>You can test your endpoints directly from your terminal using cURL:</p>
        <div style={{ position: 'relative', marginTop: '10px' }}>
          <pre style={{ backgroundColor: '#f4f4f4', padding: '15px', borderRadius: '4px', overflowX: 'auto', border: '1px solid #ddd' }}>
            {curlExample}
          </pre>
          <button 
            onClick={() => copyToClipboard(curlExample, setCopiedCurl)}
            className="btn btn-outline btn-small"
            style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#fff' }}
          >
            {copiedCurl ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Using with JavaScript</h3>
        <p>In your React or plain JavaScript apps, use the native <code>fetch()</code> API:</p>
        <div style={{ position: 'relative', marginTop: '10px' }}>
          <pre style={{ backgroundColor: '#f4f4f4', padding: '15px', borderRadius: '4px', overflowX: 'auto', border: '1px solid #ddd' }}>
            {fetchExample}
          </pre>
          <button 
            onClick={() => copyToClipboard(fetchExample, setCopiedFetch)}
            className="btn btn-outline btn-small"
            style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#fff' }}
          >
            {copiedFetch ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Status Codes Reference</h3>
        <p>When you create an endpoint, you can choose the HTTP status code it returns. Here are common ones:</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f4f4', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Code</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}><strong>200</strong></td>
              <td style={{ padding: '10px' }}>Success, the request worked</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}><strong>404</strong></td>
              <td style={{ padding: '10px' }}>Not Found, resource doesn't exist</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}><strong>500</strong></td>
              <td style={{ padding: '10px' }}>Server Error, something went wrong</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Docs;
