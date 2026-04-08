import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

export default function RiskAlerts({ dataset, details }) {
  const realScenarios = details || [];
  
  const isHighRisk = dataset?.riskLevel === 'high' || realScenarios.some(r => r.severity === 'High');
  const isModerateRisk = dataset?.riskLevel === 'medium' || realScenarios.some(r => r.severity === 'Moderate');
  
  const riskLevel = isHighRisk ? 'high' : isModerateRisk ? 'medium' : (dataset?.riskLevel || 'low');
  const riskColor = isHighRisk ? 'var(--status-red)' : isModerateRisk ? 'var(--status-yellow)' : 'var(--status-green)';
  const riskBg = isHighRisk ? 'rgba(231, 76, 60, 0.1)' : isModerateRisk ? 'rgba(241, 196, 15, 0.1)' : 'rgba(46, 204, 113, 0.1)';

  const maxPsi = realScenarios.length > 0 ? Math.max(...realScenarios.map(s => s.psi || 0)) : 0;
  const avgPsi = realScenarios.length > 0 ? realScenarios.reduce((a, s) => a + (s.psi || 0), 0) / realScenarios.length : 0;
  const maxAccDrop = realScenarios.length > 0 ? Math.max(...realScenarios.map(s => s.acc_drop || 0)) : 0;
  const avgAccDrop = realScenarios.length > 0 ? realScenarios.reduce((a, s) => a + (s.acc_drop || 0), 0) / realScenarios.length : 0;
  const avgHealth = realScenarios.length > 0 ? realScenarios.reduce((a, s) => a + (s.health || 0), 0) / realScenarios.length : 0;
  
  const warnings = [];
  const healthyChecks = [];
  
  // Generate per-scenario alerts based on real data
  realScenarios.forEach((s, idx) => {
    const scenarioName = s.scenario || `Scenario ${idx + 1}`;
    const psiVal = s.psi || 0;
    const accDropVal = (s.acc_drop || 0) * 100;
    const severity = s.severity || 'Low';
    
    if (psiVal > 0.25 || accDropVal > 10) {
      warnings.push({
        type: 'accuracy',
        title: `${scenarioName}: High Drift/Degradation`,
        message: `PSI: ${psiVal.toFixed(4)} | Acc Drop: ${accDropVal.toFixed(2)}% | ${s.explanation || ''}`,
        severity: severity
      });
    } else if (psiVal > 0.1 || accDropVal > 5) {
      warnings.push({
        type: 'drift',
        title: `${scenarioName}: Moderate Drift`,
        message: `PSI: ${psiVal.toFixed(4)} | Acc Drop: ${accDropVal.toFixed(2)}% | ${s.explanation || ''}`,
        severity: severity
      });
    } else {
      healthyChecks.push({
        title: `${scenarioName}: Stable`,
        message: `PSI: ${psiVal.toFixed(4)} | Acc Drop: ${accDropVal.toFixed(2)}%`
      });
    }
  });
  
  // Check overall thresholds
  if (dataset?.accuracyDrop || maxAccDrop > 0.01) {
    const alreadyHasAccWarning = warnings.some(w => w.type === 'accuracy');
    if (!alreadyHasAccWarning) {
      warnings.push({
        type: 'accuracy',
        title: 'Accuracy Drop Detected',
        message: `Maximum accuracy drop of ${(maxAccDrop * 100).toFixed(2)}% detected across scenarios. Avg drop: ${(avgAccDrop * 100).toFixed(2)}%`
      });
    }
  }
  
  if (dataset?.driftDetected || maxPsi > 0.1) {
    const alreadyHasDriftWarning = warnings.some(w => w.type === 'drift');
    if (!alreadyHasDriftWarning) {
      warnings.push({
        type: 'drift',
        title: 'Drift Exceeds Threshold',
        message: `Maximum PSI of ${maxPsi.toFixed(4)} exceeds threshold of 0.1. Avg PSI: ${avgPsi.toFixed(4)}`
      });
    }
  }

  const getBorderColor = (severity) => {
    if (severity === 'High') return 'var(--status-red)';
    if (severity === 'Moderate') return 'var(--status-yellow)';
    return 'var(--status-green)';
  };

  return (
    <div className="card" style={{ marginBottom: '24px', borderColor: isHighRisk ? 'var(--status-red)' : 'var(--border-color)' }}>
      <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: isHighRisk ? 'var(--status-red)' : '' }}>
        {isHighRisk && <ShieldAlert size={20} />}
        Risk &amp; Alerts
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Risk Level Indicator with Real Metrics */}
        <div style={{ background: riskBg, border: `1px solid ${riskColor}`, borderRadius: '8px', padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <AlertTriangle size={48} className={isHighRisk ? "text-red" : isModerateRisk ? "text-yellow" : "text-green"} style={{ marginBottom: '16px' }} />
          <h2 style={{ margin: 0, color: riskColor, textTransform: 'uppercase' }}>{riskLevel} RISK</h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--text-main)' }}>
            System Assessment
          </p>
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', width: '100%' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>Max PSI</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: maxPsi > 0.25 ? 'var(--status-red)' : maxPsi > 0.1 ? 'var(--status-yellow)' : 'var(--status-green)' }}>
              {maxPsi.toFixed(4)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '8px' }}>Max Acc Drop</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: maxAccDrop > 0.1 ? 'var(--status-red)' : maxAccDrop > 0.05 ? 'var(--status-yellow)' : 'var(--status-green)' }}>
              {(maxAccDrop * 100).toFixed(2)}%
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '8px' }}>Avg Health</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: avgHealth < 0.5 ? 'var(--status-red)' : avgHealth < 0.8 ? 'var(--status-yellow)' : 'var(--status-green)' }}>
              {(avgHealth * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Alerts List with Per-Scenario Results */}
        <div>
          <h4 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>Scenario Results ({realScenarios.length} scenarios)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
            
            {warnings.map((warn, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: '#12141a', padding: '12px', borderRadius: '4px', borderLeft: `3px solid ${getBorderColor(warn.severity)}` }}>
                {warn.type === 'accuracy' ? <AlertCircle size={18} className="text-red" style={{ marginTop: '2px' }} /> : <AlertTriangle size={18} className="text-yellow" style={{ marginTop: '2px' }} />}
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>{warn.title}</strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>{warn.message}</span>
                  <div style={{ fontSize: '11px', color: warn.severity === 'High' ? 'var(--status-red)' : 'var(--status-yellow)', marginTop: '4px' }}>
                    Severity: {warn.severity}
                  </div>
                </div>
              </div>
            ))}
            
            {healthyChecks.map((check, idx) => (
              <div key={`healthy-${idx}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: '#12141a', padding: '12px', borderRadius: '4px', borderLeft: '3px solid var(--status-green)' }}>
                <CheckCircle size={18} className="text-green" style={{ marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>{check.title}</strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>{check.message}</span>
                </div>
              </div>
            ))}
            
            {warnings.length === 0 && healthyChecks.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--status-green)' }}>
                No active alerts. System is running optimally.
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
