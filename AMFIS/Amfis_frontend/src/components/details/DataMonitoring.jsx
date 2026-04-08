import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

export default function DataMonitoring({ dataset, details }) {
  const realScenarios = details || [];
  
  const maxPsi = realScenarios.length > 0 
    ? Math.max(...realScenarios.map(s => s.psi || 0))
    : 0;
  
  const maxAccDrop = realScenarios.length > 0
    ? Math.max(...realScenarios.map(s => s.acc_drop || 0))
    : 0;
  
  const avgHealth = realScenarios.length > 0
    ? realScenarios.reduce((a, s) => a + (s.health || 0), 0) / realScenarios.length
    : 0;
  
  const topDriftFeature = realScenarios.find(s => s.top_drift_feature)?.top_drift_feature || 'N/A';
  
  const isHighRisk = realScenarios.some(r => r.severity === 'High');
  const isModerateRisk = realScenarios.some(r => r.severity === 'Moderate');
  
  const highestSeverity = isHighRisk ? 'High' : isModerateRisk ? 'Moderate' : 'Low';
  const driftFeaturesCount = realScenarios.filter(s => (s.psi || 0) > 0.1).length;

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        Data Monitoring
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>PSI (Stability Index)</span>
            {isHighRisk ? <AlertTriangle size={18} className="text-yellow" /> : <CheckCircle size={18} className="text-green" />}
          </div>
          <h4 style={{ margin: 0, color: isHighRisk ? 'var(--status-red)' : '' }}>
            {maxPsi.toFixed(4)}
          </h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-main)' }}>
            {driftFeaturesCount} features with significant drift (&gt;0.1 PSI)
          </p>
        </div>

        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>Accuracy Drop</span>
            {maxAccDrop > 0.01 ? <AlertCircle size={18} className="text-red" /> : <CheckCircle size={18} className="text-green" />}
          </div>
          <h4 style={{ margin: 0, color: maxAccDrop > 0.01 ? 'var(--status-red)' : '' }}>
            {(maxAccDrop * 100).toFixed(2)}%
          </h4>
          <div style={{ width: '100%', backgroundColor: '#333', height: '4px', marginTop: '8px', borderRadius: '2px' }}>
             <div style={{ width: `${Math.min(maxAccDrop * 100 * 10, 100)}%`, backgroundColor: maxAccDrop > 0.01 ? 'var(--status-red)' : 'var(--status-green)', height: '100%' }}></div>
          </div>
        </div>

        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>Top Drift Feature</span>
            {isHighRisk ? <AlertTriangle size={18} className="text-yellow" /> : <CheckCircle size={18} className="text-green" />}
          </div>
          <h4 style={{ margin: 0 }}>{topDriftFeature}</h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-main)' }}>
            Severity: {highestSeverity}
          </p>
        </div>
      </div>
    </div>
  );
}
