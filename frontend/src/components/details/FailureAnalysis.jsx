import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function FailureAnalysis({ dataset, details }) {
  const realScenarios = details || [];
  
  const isHighRisk = dataset?.riskLevel === 'high' || realScenarios.some(r => r.severity === 'High');
  
  const maxPsi = realScenarios.length > 0 ? Math.max(...realScenarios.map(s => s.psi || 0)) : 0;
  const maxAccDrop = realScenarios.length > 0 ? Math.max(...realScenarios.map(s => s.acc_drop || 0)) : 0;
  const avgHealth = realScenarios.length > 0 
    ? realScenarios.reduce((a, s) => a + (s.health || 0), 0) / realScenarios.length
    : 0;
  
  const severityCounts = {
    High: realScenarios.filter(s => s.severity === 'High').length,
    Moderate: realScenarios.filter(s => s.severity === 'Moderate').length,
    Low: realScenarios.filter(s => s.severity === 'Low').length
  };

  const data = {
    labels: ['High Severity', 'Moderate Severity', 'Low Severity'],
    datasets: [
      {
        data: [severityCounts.High, severityCounts.Moderate, severityCounts.Low],
        backgroundColor: [
          'rgba(231, 76, 60, 0.8)',
          'rgba(241, 196, 15, 0.8)',
          'rgba(46, 204, 113, 0.8)'
        ],
        borderWidth: 1,
        borderColor: '#12141a'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: '#c5c6c7' } }
    }
  };

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        Failure Analysis Panel
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', alignItems: 'center' }}>
        <div>
          <h4 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>Severity Distribution</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '16px' }}>
            Breakdown of scenario severity levels from monitoring results.
          </p>
          <div style={{ height: '220px' }}>
            <Pie data={data} options={options} />
          </div>
        </div>

        <div>
          <h4 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>Scenario Results</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
             
              {realScenarios.map((s, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    background: 'rgba(231, 76, 60, 0.1)', 
                    borderLeft: `3px solid ${s.severity === 'High' ? 'var(--status-red)' : s.severity === 'Moderate' ? 'var(--status-yellow)' : 'var(--status-green)'}`, 
                    padding: '12px', 
                    borderRadius: '4px' 
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                    {s.scenario} - {s.severity} Severity
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>
                    PSI: {s.psi?.toFixed(4) || 'N/A'} | Acc: {((s.accuracy || 0) * 100).toFixed(1)}% | Health: {((s.health || 0) * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-main)', marginTop: '4px' }}>
                    {s.explanation}
                  </div>
                </div>
              ))}
              
              {realScenarios.length === 0 && (
                <div style={{ background: 'rgba(52, 152, 219, 0.1)', borderLeft: '3px solid var(--chart-blue)', padding: '12px', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>No Data</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>Run datasets to see failure analysis.</div>
                </div>
              )}

          </div>
        </div>
      </div>
    </div>
  );
}
