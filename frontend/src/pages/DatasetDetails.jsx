import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Activity, TrendingUp, AlertTriangle, CheckCircle, GitBranch, Target } from 'lucide-react';

export default function DatasetDetails() {
  const { id } = useParams();
  const [dataset, setDataset] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idToKey = {
      'adult': 'adult',
      'loan': 'loan', 
      'bank': 'bank',
      'german-credit': 'german credit',
      'german_credit': 'german credit'
    };
    
    const detailKey = idToKey[id] || id;

    fetch('/combinedResults.json')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const found = data.find(d => 
            d.id === id || 
            d.id === id.replace('-', ' ') || 
            d.id === id.replace(' ', '-') ||
            d.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') === id ||
            d.name?.toLowerCase().replace(/[^a-z0-9]/g, ' ') === id
          );
          if (found) setDataset(found);
        }
      })
      .catch(() => {});

    fetch('/combinedResultsDetailed.json')
      .then(r => r.json())
      .then(data => {
        if (data && data[detailKey]) {
          setDetails(data[detailKey]);
        } else if (data) {
          const keys = Object.keys(data);
          for (const key of keys) {
            if (key.toLowerCase().replace(/[^a-z0-9]/g, '-') === id ||
                key.toLowerCase().replace(/[^a-z0-9]/g, ' ') === id) {
              setDetails(data[key]);
              break;
            }
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const getRiskColor = (risk) => {
    if (risk === 'high') return '#e74c3c';
    if (risk === 'medium') return '#f1c40f';
    return '#2ecc71';
  };

  if (loading || !dataset) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '60vh',
        color: '#66fcf1'
      }}>
        <Activity size={48} style={{ animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  const datasetId = dataset.id || id;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Back Button & Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link 
          to="/dashboard" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#66fcf1',
            textDecoration: 'none',
            fontSize: '14px',
            marginBottom: '16px'
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingBottom: '16px',
          borderBottom: '1px solid #333'
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#fff', fontSize: '28px', fontWeight: '600' }}>
              {dataset.name}
            </h1>
            <p style={{ margin: '8px 0 0', color: '#888', fontSize: '14px' }}>
              Last Detailed Scan: {dataset.lastUpdated}
            </p>
          </div>
          <span style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            backgroundColor: `${getRiskColor(dataset.riskLevel)}20`,
            color: getRiskColor(dataset.riskLevel),
            border: `1px solid ${getRiskColor(dataset.riskLevel)}`
          }}>
            {dataset.riskLevel.toUpperCase()} RISK
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#1f2833', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Target size={16} style={{ color: '#66fcf1' }} />
            <span style={{ fontSize: '12px', color: '#888' }}>Health Score</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: dataset.healthScore >= 80 ? '#2ecc71' : dataset.healthScore >= 70 ? '#f1c40f' : '#e74c3c' }}>
            {dataset.healthScore}%
          </div>
        </div>

        <div style={{ backgroundColor: '#1f2833', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {dataset.accuracyDrop ? <AlertTriangle size={16} style={{ color: '#e74c3c' }} /> : <CheckCircle size={16} style={{ color: '#2ecc71' }} />}
            <span style={{ fontSize: '12px', color: '#888' }}>Accuracy Drop</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: dataset.accuracyDrop ? '#e74c3c' : '#2ecc71' }}>
            {dataset.accuracyDrop ? 'Yes' : 'No'}
          </div>
        </div>

        <div style={{ backgroundColor: '#1f2833', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {dataset.driftDetected ? <TrendingUp size={16} style={{ color: '#e74c3c' }} /> : <CheckCircle size={16} style={{ color: '#2ecc71' }} />}
            <span style={{ fontSize: '12px', color: '#888' }}>Data Drift</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: dataset.driftDetected ? '#e74c3c' : '#2ecc71' }}>
            {dataset.driftDetected ? 'Detected' : 'Stable'}
          </div>
        </div>

        <div style={{ backgroundColor: '#1f2833', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <GitBranch size={16} style={{ color: '#66fcf1' }} />
            <span style={{ fontSize: '12px', color: '#888' }}>Scenarios</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>{details?.length || 3}</div>
        </div>
      </div>

      {/* Scenario Results */}
      {details && details.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ margin: '0 0 16px', color: '#fff', fontSize: '20px' }}>Scenario Analysis</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {details.map((scenario, idx) => (
              <div key={idx} style={{ backgroundColor: '#1f2833', padding: '16px', borderRadius: '12px', border: `1px solid ${scenario.severity === 'High' ? '#e74c3c' : scenario.severity === 'Moderate' ? '#f1c40f' : '#333'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{scenario.scenario}</span>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', backgroundColor: `${getRiskColor(scenario.severity?.toLowerCase())}20`, color: getRiskColor(scenario.severity?.toLowerCase()) }}>
                    {scenario.severity || 'Low'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#888' }}>PSI</span>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#66fcf1' }}>{scenario.psi?.toFixed(4) || '0.0000'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#888' }}>Accuracy</span>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>{((scenario.accuracy || 0) * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#888' }}>Acc Drop</span>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: scenario.acc_drop > 0.01 ? '#e74c3c' : '#2ecc71' }}>{((scenario.acc_drop || 0) * 100).toFixed(2)}%</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#888' }}>Health</span>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: scenario.health >= 0.8 ? '#2ecc71' : scenario.health >= 0.5 ? '#f1c40f' : '#e74c3c' }}>{((scenario.health || 0) * 100).toFixed(0)}%</div>
                  </div>
                </div>
                {scenario.top_drift_feature && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #333' }}>
                    <span style={{ fontSize: '11px', color: '#888' }}>Top Drift Feature:</span>
                    <div style={{ fontSize: '13px', color: '#fff' }}>{scenario.top_drift_feature}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dataset Graphs */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ margin: '0 0 16px', color: '#fff', fontSize: '20px' }}>Analysis Graphs</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {['01_psi_vs_acc_drop', '02_accuracy_bar', '03_degradation_trend', '04_accuracy_vs_psi'].map((graph, idx) => (
            <div key={idx} style={{ backgroundColor: '#1f2833', padding: '16px', borderRadius: '12px', border: '1px solid #333' }}>
              <h3 style={{ margin: '0 0 12px', color: '#c5c6c7', fontSize: '14px' }}>{graph.replace('_', ' ').replace(/^\d+_/, '').replace(/_/g, ' ').toUpperCase()}</h3>
              <img src={`/graphs/${datasetId}_${graph}.png`} alt={graph} style={{ width: '100%', borderRadius: '8px' }} onError={(e) => e.target.style.display = 'none'} />
            </div>
          ))}
        </div>
      </div>

      {/* Action Required */}
      {details && details.find(d => d.action) && (
        <div style={{ marginTop: '32px', backgroundColor: '#1f2833', padding: '20px', borderRadius: '12px', border: `1px solid ${getRiskColor(dataset.riskLevel)}` }}>
          <h3 style={{ margin: '0 0 12px', color: '#fff', fontSize: '16px' }}>Action Required</h3>
          <p style={{ margin: 0, color: '#c5c6c7', fontSize: '14px' }}>{details.find(d => d.action)?.action || 'No action required'}</p>
        </div>
      )}
    </div>
  );
}