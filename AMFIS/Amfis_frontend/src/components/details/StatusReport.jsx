import React from 'react';

export default function StatusReport({ dataset, details }) {
  const realScenarios = details || [];
  
  // Calculate real metrics from scenario data
  const maxPsi = realScenarios.length > 0 ? Math.max(...realScenarios.map(s => s.psi || 0)) : 0;
  const maxAccDrop = realScenarios.length > 0 ? Math.max(...realScenarios.map(s => s.acc_drop || 0)) : 0;
  const avgHealth = realScenarios.length > 0 ? realScenarios.reduce((a, s) => a + (s.health || 0), 0) / realScenarios.length : 0;
  const avgAccuracy = realScenarios.length > 0 ? realScenarios.reduce((a, s) => a + (s.accuracy || 0), 0) / realScenarios.length : 0;
  const topDriftFeature = realScenarios.find(s => s.top_drift_feature)?.top_drift_feature || 'N/A';
  const worstScenario = realScenarios.reduce((worst, s) => (!worst || (s.acc_drop || 0) > (worst.acc_drop || 0) ? s : worst), null);
  const actionRequired = realScenarios.find(s => s.action)?.action || 'No action required';
  
  const summary = {
    id: dataset?.id,
    name: dataset?.name,
    lastUpdated: dataset?.lastUpdated,
    healthScore: dataset?.healthScore,
    riskLevel: dataset?.riskLevel,
    failures: dataset?.failures,
    accuracyDrop: dataset?.accuracyDrop,
    driftDetected: dataset?.driftDetected,
    scenarios: realScenarios
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset?.id || 'dataset'}-status-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    const html = `
      <html><head><title>Report - ${dataset?.name}</title>
        <style>
          body{font-family: Inter, Arial, sans-serif;color:#cbd5e1;background:#0b0c0f;padding:24px}
          .section{background:#0f1114;padding:16px;border-radius:8px;margin-bottom:12px}
          h1{font-size:20px;margin:0 0 8px 0}
          .kv{display:flex;justify-content:space-between;margin:4px 0}
          .kv b{color:#9ca3af}
        </style>
      </head><body>
        <h1>Dataset Status Report — ${dataset?.name}</h1>
        <div class="section">
          <div class="kv"><b>ID</b><span>${dataset?.id}</span></div>
          <div class="kv"><b>Last Updated</b><span>${dataset?.lastUpdated}</span></div>
          <div class="kv"><b>Health Score</b><span>${dataset?.healthScore}%</span></div>
          <div class="kv"><b>Risk Level</b><span>${dataset?.riskLevel}</span></div>
          <div class="kv"><b>Max PSI</b><span>${maxPsi.toFixed(4)}</span></div>
          <div class="kv"><b>Max Acc Drop</b><span>${(maxAccDrop * 100).toFixed(2)}%</span></div>
          <div class="kv"><b>Failures</b><span>${dataset?.failures}</span></div>
        </div>
        <div class="section">
          <h2 style="margin-top:0">Scenario Results</h2>
          ${ realScenarios.map(s => `
            <div style="margin-bottom:12px;padding:8px;background:#1a1d23;border-radius:4px">
              <div class="kv"><b>Scenario</b><span>${s.scenario}</span></div>
              <div class="kv"><b>Accuracy</b><span>${(s.accuracy * 100).toFixed(2)}%</span></div>
              <div class="kv"><b>PSI</b><span>${s.psi?.toFixed(4) || 'N/A'}</span></div>
              <div class="kv"><b>Acc Drop</b><span>${(s.acc_drop * 100).toFixed(2)}%</span></div>
              <div class="kv"><b>Health</b><span>${(s.health * 100).toFixed(1)}%</span></div>
              <div class="kv"><b>Severity</b><span>${s.severity || 'N/A'}</span></div>
              <div class="kv"><b>Action</b><span>${s.action || ''}</span></div>
            </div>
          `).join('') }
        </div>
        <script>window.print();</script>
      </body></html>
    `;
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px' }}>
        <h3 style={{ margin: 0 }}>Status Report</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn" onClick={downloadJson} style={{ fontSize: '13px', padding: '6px 10px' }}>Download JSON</button>
          <button className="btn btn-primary" onClick={printReport} style={{ fontSize: '13px', padding: '6px 10px' }}>Print</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
        <div style={{ padding: '12px', background: '#121418', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>Health Score</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: avgHealth < 0.5 ? 'var(--status-red)' : avgHealth < 0.8 ? 'var(--status-yellow)' : 'var(--status-green)' }}>
            {(avgHealth * 100).toFixed(1)}%
          </div>
        </div>
        <div style={{ padding: '12px', background: '#121418', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>Risk Level</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: dataset?.riskLevel === 'high' ? 'var(--status-red)' : dataset?.riskLevel === 'medium' ? 'var(--status-yellow)' : 'var(--status-green)' }}>
            {(dataset?.riskLevel || 'unknown').toUpperCase()}
          </div>
        </div>
        <div style={{ padding: '12px', background: '#121418', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>Max PSI</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: maxPsi > 0.25 ? 'var(--status-red)' : maxPsi > 0.1 ? 'var(--status-yellow)' : 'var(--status-green)' }}>
            {maxPsi.toFixed(4)}
          </div>
        </div>
        <div style={{ padding: '12px', background: '#121418', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>Max Acc Drop</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: maxAccDrop > 0.1 ? 'var(--status-red)' : maxAccDrop > 0.05 ? 'var(--status-yellow)' : 'var(--status-green)' }}>
            {(maxAccDrop * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      <div style={{ padding: '12px', background: '#121418', borderRadius: '6px', marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-main)', marginBottom: '8px' }}>Worst Scenario: {worstScenario?.scenario || 'N/A'}</div>
        <div style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '4px' }}>
          {worstScenario?.explanation || 'No detailed scan results available.'}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>
          Top Drift Feature: <strong>{topDriftFeature}</strong>
        </div>
      </div>

      <div style={{ padding: '12px', background: '#121418', borderRadius: '6px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-main)', marginBottom: '8px' }}>Action Required</div>
        <div style={{ fontSize: '14px', color: dataset?.riskLevel === 'high' ? 'var(--status-red)' : 'var(--text-main)' }}>
          {actionRequired}
        </div>
      </div>
    </div>
  );
}
