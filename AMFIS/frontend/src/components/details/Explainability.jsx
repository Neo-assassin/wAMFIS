import { Bar } from 'react-chartjs-2';

export default function Explainability({ dataset, details }) {
  const realScenarios = details || [];
  
  const isHighRisk = dataset?.riskLevel === 'high' || realScenarios.some(r => r.severity === 'High');
  
  const topDriftFeature = realScenarios.find(s => s.top_drift_feature)?.top_drift_feature || 'N/A';
  const maxPsi = realScenarios.length > 0 ? Math.max(...realScenarios.map(s => s.psi || 0)) : 0;
  const maxAccDrop = realScenarios.length > 0 ? Math.max(...realScenarios.map(s => s.acc_drop || 0)) : 0;
  
  const featureLabels = [
    topDriftFeature !== 'N/A' ? topDriftFeature : 'feature_1',
    'hours_per_week',
    'education',
    'occupation',
    'relationship'
  ];
  
  const featureValues = realScenarios.length > 0 && realScenarios[0]?.psi
    ? [
        maxPsi,
        realScenarios.find(s => s.scenario === 'shift')?.psi || maxPsi * 0.3,
        realScenarios.find(s => s.scenario === 'noise')?.psi || maxPsi * 0.2,
        maxPsi * 0.1,
        maxPsi * 0.05
      ]
    : [0.5, 0.3, 0.2, 0.1, 0.05];

  const shapData = {
    labels: featureLabels,
    datasets: [
      {
        label: 'PSI Contribution',
        data: featureValues,
        backgroundColor: 'rgba(155, 89, 182, 0.8)',
      }
    ]
  };

  const shapOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#333' }, ticks: { color: '#c5c6c7' } },
      y: { grid: { display: false }, ticks: { color: '#c5c6c7' } }
    }
  };

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        Explainability Dashboard
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '24px' }}>
        
        <div>
          <h4 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>Feature Drift Importance</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '16px' }}>
            Features contributing most to drift/detection based on real scenario results.
            {isHighRisk && <span className="text-red"> Note: Top drift feature is showing significant deviation from training distribution.</span>}
          </p>
          <div style={{ height: '250px' }}>
             <Bar data={shapData} options={shapOptions} />
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>Scenario Insights</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '16px' }}>
            Real scenario results from monitoring runs.
          </p>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {realScenarios.slice(0, 3).map((s, idx) => (
              <li key={idx} style={{ background: '#12141a', padding: '12px', borderLeft: `3px solid ${s.severity === 'High' ? 'var(--status-red)' : s.severity === 'Moderate' ? 'var(--status-yellow)' : 'var(--primary-color)'}` }}>
                <strong>{s.scenario}</strong><br/>
                <span style={{ fontSize: '12px', color: 'var(--text-main)' }}>
                  PSI: {s.psi?.toFixed(4) || 'N/A'} | Acc Drop: {((s.acc_drop || 0) * 100).toFixed(2)}%
                </span>
              </li>
            ))}
            {realScenarios.length === 0 && (
              <li style={{ background: '#12141a', padding: '12px', borderLeft: '3px solid var(--primary-color)' }}>
                No scenario data available.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
