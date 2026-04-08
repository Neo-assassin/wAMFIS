import { Line, Bar } from 'react-chartjs-2';

export default function PerformanceMetrics({ dataset, details }) {
  const realScenarios = details || [];
  
  const avgAccuracy = realScenarios.length > 0
    ? realScenarios.reduce((a, s) => a + (s.accuracy || 0), 0) / realScenarios.length
    : 0;
  
  const avgAccDrop = realScenarios.length > 0
    ? realScenarios.reduce((a, s) => a + (s.acc_drop || 0), 0) / realScenarios.length
    : 0;
  
  const avgConfidenceDrop = realScenarios.length > 0
    ? realScenarios.reduce((a, s) => a + (s.confidence_drop || 0), 0) / realScenarios.length
    : 0;
  
  const maxAccDrop = realScenarios.length > 0
    ? Math.max(...realScenarios.map(s => s.acc_drop || 0))
    : 0;
  
  const labels = realScenarios.length > 0 
    ? realScenarios.map(s => s.scenario || 'unknown')
    : ['noise', 'shift', 'feature_removed'];
  
  const accuracyValues = realScenarios.length > 0
    ? realScenarios.map(s => (s.accuracy || 0) * 100)
    : [0, 0, 0];
  
  const accDropValues = realScenarios.length > 0
    ? realScenarios.map(s => (s.acc_drop || 0) * 100)
    : [0, 0, 0];
  
  const isHighRisk = dataset?.riskLevel === 'high' || (realScenarios.some(r => r.severity === 'High'));

  const accuracyData = {
    labels: labels,
    datasets: [
      {
        label: 'Accuracy (%)',
        data: accuracyValues,
        borderColor: isHighRisk ? 'rgba(231, 76, 60, 1)' : 'rgba(46, 204, 113, 1)',
        backgroundColor: isHighRisk ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  const accDropData = {
    labels: labels,
    datasets: [
      {
        label: 'Accuracy Drop (%)',
        data: accDropValues,
        backgroundColor: 'rgba(231, 76, 60, 0.8)',
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { 
      y: { min: 0, max: 100, grid: { color: '#333' }, ticks: { color: '#c5c6c7' } },
      x: { grid: { display: false }, ticks: { color: '#c5c6c7' } }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: '#333' }, ticks: { color: '#c5c6c7' } },
      x: { grid: { display: false }, ticks: { color: '#c5c6c7' } }
    }
  };

  const precision = avgAccuracy > 0 ? ((avgAccuracy - avgAccDrop) * 100).toFixed(1) : 'N/A';
  const recall = (avgAccuracy * 100).toFixed(1);

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        Performance Monitoring
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px' }}>
        
        {/* Accuracy Chart */}
        <div>
          <h4 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>Scenario Accuracy</h4>
          <div style={{ height: '250px' }}>
            <Line data={accuracyData} options={lineOptions} />
          </div>
          <div style={{ marginTop: '24px' }}>
            <h4 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>Accuracy Drop by Scenario</h4>
            <div style={{ height: '150px' }}>
              <Bar data={accDropData} options={barOptions} />
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
             <div style={{ background: '#12141a', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
               <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>Avg Accuracy</div>
               <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{(avgAccuracy * 100).toFixed(1)}%</div>
             </div>
             <div style={{ background: '#12141a', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
               <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>Max Acc Drop</div>
               <div style={{ fontSize: '18px', fontWeight: 'bold', color: maxAccDrop > 0.01 ? 'var(--status-red)' : '' }}>{(maxAccDrop * 100).toFixed(2)}%</div>
             </div>
             <div style={{ background: '#12141a', padding: '12px', borderRadius: '4px', textAlign: 'center', gridColumn: '1 / -1' }}>
               <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>Confidence Drop</div>
               <div style={{ fontSize: '18px', fontWeight: 'bold', color: avgConfidenceDrop > 0.01 ? 'var(--status-red)' : 'var(--status-green)' }}>
                 {avgConfidenceDrop.toFixed(4)}
               </div>
             </div>
          </div>

          <div style={{ background: '#12141a', padding: '16px', borderRadius: '4px', marginTop: 'auto' }}>
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-main)' }}>Action Required</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0 }}>
              {realScenarios.length > 0 
                ? realScenarios.find(s => s.action)?.action || 'No action required.'
                : 'No scenario data available.'
              }
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
