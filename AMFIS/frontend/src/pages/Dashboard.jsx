import { useState, useEffect } from 'react';
import FilterBar from '../components/dashboard/FilterBar';
import DatasetCard from '../components/dashboard/DatasetCard';

export default function Dashboard() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    // Fetch from API first, fallback to static JSON. Also subscribe to SSE stream for real-time updates.
    let es;

    const processPayload = (payloadArray) => {
      if (!Array.isArray(payloadArray) || payloadArray.length === 0) return [];
      const byDataset = {};
      payloadArray.forEach(r => {
        const key = r.dataset;
        byDataset[key] = byDataset[key] || { backendName: key, scenarios: [] };
        byDataset[key].scenarios.push(r);
      });

      return Object.values(byDataset).map(d => {
        const scenarios = d.scenarios;
        const avgAccDrop = scenarios.reduce((a,s)=>a + (s.acc_drop||0),0)/scenarios.length;
        const maxPsi = Math.max(...scenarios.map(s=>s.psi||0));
        const top = scenarios.reduce((p,c)=> (c.psi> (p.psi||0)?c:p), scenarios[0]);
        const healthScore = Math.max(0, Math.min(100, Math.round(100 - avgAccDrop*100)));
        const riskLevel = (avgAccDrop>0.05 || maxPsi>0.5) ? 'high' : (avgAccDrop>0.02 || maxPsi>0.2) ? 'medium' : 'low';
        return {
          id: d.backendName.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
          backendName: d.backendName,
          name: d.backendName,
          lastUpdated: 'Just now',
          healthScore,
          riskLevel,
          accuracyDrop: avgAccDrop>0.01,
          driftDetected: maxPsi>0.01,
          driftMetric: `${top.top_drift_feature || ''} (psi=${(top.psi||0).toFixed(3)})`,
          failures: 0
        };
      });
    };

    fetch(`${API}/api/monitoring/results/`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('no api')))
      .then(payload => {
        if (payload && Array.isArray(payload.data)) {
          const summaries = processPayload(payload.data);
          if (summaries.length > 0) setDatasets(summaries);
        }
        setLoading(false);

        // open SSE after initial load
        try {
          es = new EventSource(`${API}/api/monitoring/stream/`);
          es.onmessage = (e) => {
            try {
              const arr = JSON.parse(e.data || '[]');
              const summaries = processPayload(arr);
              if (summaries.length > 0) setDatasets(summaries);
            } catch (err) {
              // ignore JSON parse errors
            }
          };
          es.onerror = () => {
            // if SSE fails, close and rely on periodic polling (handled by fallback if needed)
            try { es.close(); } catch (e) {}
          };
        } catch (err) {
          // EventSource may not be available in some environments
        }
      })
      .catch(() => {
        // fallback to static combinedResults.json
        fetch('/combinedResults.json')
          .then(r => r.ok ? r.json() : null)
          .then(data => { 
            if (Array.isArray(data) && data.length > 0) {
              setDatasets(data);
            }
            setLoading(false);
          })
          .catch(() => setLoading(false));
      });

    return () => {
      try { if (es) es.close(); } catch (e) {}
    };
  }, []);
  
  const handleFilterChange = (type, value) => {
    // Re-fetch with filter applied to real data
    fetch('/combinedResults.json')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!Array.isArray(data)) return;
        
        let filtered = [...data];
        
        if (type === 'risk' && value !== 'all') {
          filtered = filtered.filter(d => d.riskLevel === value);
        }
        
        setDatasets(filtered);
      });
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', padding: '48px' }}>
        <p>Loading datasets...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>Data Monitoring & Health</h2>
          <p style={{ color: 'var(--text-main)', marginTop: '4px' }}>
            Overview of all active datasets and model monitoring pipelines.
          </p>
        </div>
        <button className="btn btn-primary">+ Add Pipeline</button>
      </div>
      
      <FilterBar onFilterChange={handleFilterChange} />

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '24px' 
      }}>
        {datasets.map(dataset => (
          <DatasetCard key={dataset.id} dataset={dataset} />
        ))}
        {datasets.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: 'var(--text-main)' }}>
            No datasets found. Run monitoring pipelines first.
          </div>
        )}
      </div>
    </div>
  );
}
