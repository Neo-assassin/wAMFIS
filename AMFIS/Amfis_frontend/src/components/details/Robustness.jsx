import { ShieldAlert, Fingerprint } from 'lucide-react';

export default function Robustness({ dataset, details }) {
  const realScenarios = details || [];
  
  const maxPsi = realScenarios.length > 0 ? Math.max(...realScenarios.map(s => s.psi || 0)) : 0;
  const maxAccDrop = realScenarios.length > 0 ? Math.max(...realScenarios.map(s => s.acc_drop || 0)) : 0;
  
  const isHighRisk = dataset?.riskLevel === 'high' || realScenarios.some(r => r.severity === 'High');
  
  const avgHealth = realScenarios.length > 0 
    ? realScenarios.reduce((a, s) => a + (s.health || 0), 0) / realScenarios.length
    : 0;

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        Robustness & Adversarial Testing
      </h3>
      
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Fingerprint className="text-primary" size={20} />
            <h4 style={{ margin: 0 }}>Scenario Stress Results</h4>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-main)' }}>
            Model performance degradation under different stress scenarios.
          </p>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
            <span>Max PSI (Drift):</span>
            <strong className={maxPsi > 0.3 ? "text-red" : maxPsi > 0.1 ? "text-yellow" : "text-green"}>
              {maxPsi.toFixed(4)}
            </strong>
          </div>
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Max Acc Drop:</span>
            <strong className={maxAccDrop > 0.02 ? "text-red" : maxAccDrop > 0.01 ? "text-yellow" : "text-green"}>
              {(maxAccDrop * 100).toFixed(2)}%
            </strong>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '250px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <ShieldAlert className="text-primary" size={20} />
            <h4 style={{ margin: 0 }}>Health Score</h4>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-main)' }}>
            Average model health based on all scenarios.
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
            <div style={{ flex: 1, textAlign: 'center', background: '#12141a', padding: '8px', borderRadius: '4px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-main)', marginBottom: '4px' }}>Avg Health</div>
              <strong className={avgHealth < 0.5 ? "text-red" : avgHealth < 0.8 ? "text-yellow" : "text-green"}>
                {(avgHealth * 100).toFixed(1)}%
              </strong>
            </div>
            <div style={{ flex: 1, textAlign: 'center', background: '#12141a', padding: '8px', borderRadius: '4px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-main)', marginBottom: '4px' }}>Severity</div>
              <strong className={isHighRisk ? "text-red" : "text-green"}>
                {isHighRisk ? 'High' : 'Low'}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
