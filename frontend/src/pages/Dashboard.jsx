import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle, BarChart3, Database, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/combinedResults.json')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setDatasets(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredDatasets = filter === 'all' 
    ? datasets 
    : datasets.filter(d => d.riskLevel === filter);

  const getRiskColor = (risk) => {
    if (risk === 'high') return '#e74c3c';
    if (risk === 'medium') return '#f1c40f';
    return '#2ecc71';
  };

  const getHealthColor = (score) => {
    if (score < 70) return '#e74c3c';
    if (score < 85) return '#f1c40f';
    return '#2ecc71';
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '60vh',
        color: '#66fcf1'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Activity size={48} style={{ marginBottom: '16px', animation: 'pulse 1.5s infinite' }} />
          <p style={{ color: '#c5c6c7' }}>Loading datasets...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        paddingBottom: '16px',
        borderBottom: '1px solid #333'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#fff', fontSize: '28px', fontWeight: '600' }}>
            Data Monitoring Dashboard
          </h1>
          <p style={{ margin: '8px 0 0', color: '#c5c6c7', fontSize: '14px' }}>
            Real-time model health and drift analysis across all datasets
          </p>
        </div>
        
        {/* Stats Summary */}
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#66fcf1' }}>
              {datasets.length}
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>Active Datasets</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
              {datasets.filter(d => d.riskLevel === 'high').length}
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>High Risk</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2ecc71' }}>
              {datasets.filter(d => d.healthScore >= 80).length}
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>Healthy</div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {['all', 'high', 'medium', 'low'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: filter === f ? '#66fcf1' : '#1f2833',
              color: filter === f ? '#000' : '#c5c6c7',
              cursor: 'pointer',
              fontWeight: '500',
              textTransform: 'capitalize',
              transition: 'all 0.2s'
            }}
          >
            {f === 'all' ? 'All' : f} Risk
          </button>
        ))}
      </div>

      {/* Dataset Cards Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '20px' 
      }}>
        {filteredDatasets.map(dataset => (
          <div 
            key={dataset.id}
            onClick={() => navigate(`/dataset/${dataset.id}`)}
            style={{
              backgroundColor: '#1f2833',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #333',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#66fcf1';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 252, 241, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#333';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Glow effect */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              backgroundColor: getRiskColor(dataset.riskLevel)
            }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={16} style={{ color: '#66fcf1' }} />
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>{dataset.name}</h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888' }}>
                  Updated: {dataset.lastUpdated}
                </p>
              </div>
              <span style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
                backgroundColor: `${getRiskColor(dataset.riskLevel)}20`,
                color: getRiskColor(dataset.riskLevel),
                border: `1px solid ${getRiskColor(dataset.riskLevel)}`
              }}>
                {dataset.riskLevel.toUpperCase()}
              </span>
            </div>

            {/* Health Score */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#888' }}>Health Score</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: getHealthColor(dataset.healthScore) }}>
                  {dataset.healthScore}%
                </span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#0b0c10', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${dataset.healthScore}%`,
                  height: '100%',
                  backgroundColor: getHealthColor(dataset.healthScore),
                  borderRadius: '3px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {dataset.accuracyDrop ? (
                  <AlertTriangle size={14} style={{ color: '#e74c3c' }} />
                ) : (
                  <CheckCircle size={14} style={{ color: '#2ecc71' }} />
                )}
                <span style={{ fontSize: '12px', color: '#c5c6c7' }}>
                  Acc: {dataset.accuracyDrop ? 'Drop' : 'OK'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {dataset.driftDetected ? (
                  <TrendingUp size={14} style={{ color: '#e74c3c' }} />
                ) : (
                  <CheckCircle size={14} style={{ color: '#2ecc71' }} />
                )}
                <span style={{ fontSize: '12px', color: '#c5c6c7' }}>
                  Drift: {dataset.driftDetected ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {/* View Details Button */}
            <div style={{ 
              marginTop: '16px', 
              paddingTop: '16px', 
              borderTop: '1px solid #333',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <span style={{ fontSize: '12px', color: '#888' }}>
                {dataset.failures > 0 ? `${dataset.failures} alerts` : 'No alerts'}
              </span>
              <span style={{ fontSize: '12px', color: '#66fcf1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View Details →
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredDatasets.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px', 
          color: '#888',
          backgroundColor: '#1f2833',
          borderRadius: '12px'
        }}>
          <BarChart3 size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p>No datasets found. Run the monitoring pipelines first.</p>
        </div>
      )}

      {/* Dataset Comparison Graph */}
      <div style={{ marginTop: '40px' }}>
        <h2 style={{ margin: '0 0 16px', color: '#fff', fontSize: '20px' }}>Dataset Comparison</h2>
        <div style={{ 
          backgroundColor: '#1f2833', 
          padding: '20px', 
          borderRadius: '12px',
          border: '1px solid #333'
        }}>
          <img 
            src="/graphs/dataset_comparison.png" 
            alt="Dataset Comparison" 
            style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<p style="color: #888; text-align: center;">Graph not available. Run datasets first.</p>';
            }}
          />
        </div>
      </div>
    </div>
  );
}