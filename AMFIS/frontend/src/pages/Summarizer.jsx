import React, { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Summarizer() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setData(null);
    if (!file) return setError('Please choose a PDF to upload.');

    setLoading(true);
    try {
      const uploadForm = new FormData();
      uploadForm.append('file', file);

      const uploadResp = await fetch(`${API}/upload`, {
        method: 'POST',
        body: uploadForm,
      });
      if (!uploadResp.ok) throw new Error('Upload failed');
      const uploadJson = await uploadResp.json();
      const extractedText = uploadJson.text || '';

      const summarizeResp = await fetch(`${API}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractedText }),
      });
      if (!summarizeResp.ok) throw new Error('Summarization failed');
      const summaryJson = await summarizeResp.json();
      setData(summaryJson);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h2>Paper Summarizer</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Processing...' : 'Upload & Summarize'}</button>
      </form>

      {error && <div style={{ color: 'var(--status-red)', marginBottom: 12 }}>{error}</div>}

      {data && (
        <div style={{ display: 'grid', gap: 18 }}>
          <section>
            <h3>Summary</h3>
            <p>{data.summary}</p>
          </section>

          <section>
            <h3>Key Points</h3>
            <ul>
              {(data.key_points || []).map((kp, i) => <li key={i}>{kp}</li>)}
            </ul>
          </section>

          <section>
            <h3>Methodology</h3>
            <p>{data.methodology}</p>
          </section>

          <section>
            <h3>Results</h3>
            <p>{data.results}</p>
          </section>
        </div>
      )}
    </div>
  );
}
