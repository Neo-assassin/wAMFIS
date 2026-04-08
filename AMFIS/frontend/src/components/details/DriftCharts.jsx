import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function DriftCharts({ dataset, details }) {
  const realScenarios = details || [];
  
  const maxPsi = realScenarios.length > 0 
    ? Math.max(...realScenarios.map(s => s.psi || 0))
    : 0;
  
  const avgPsi = realScenarios.length > 0
    ? (realScenarios.reduce((a, s) => a + (s.psi || 0), 0) / realScenarios.length)
    : 0;
  
  const avgAccDrop = realScenarios.length > 0
    ? realScenarios.reduce((a, s) => a + (s.acc_drop || 0), 0) / realScenarios.length
    : 0;
  
  const avgHealth = realScenarios.length > 0
    ? realScenarios.reduce((a, s) => a + (s.health || 0), 0) / realScenarios.length
    : 0;
  
  const labels = realScenarios.length > 0 
    ? realScenarios.map(s => s.scenario || 'unknown')
    : ['noise', 'shift', 'feature_removed'];
  
  const psiValues = realScenarios.length > 0
    ? realScenarios.map(s => s.psi || 0)
    : [0, 0, 0];
  
  const accValues = realScenarios.length > 0
    ? realScenarios.map(s => (s.accuracy || 0) * 100)
    : [0, 0, 0];
  
  const accDropValues = realScenarios.length > 0
    ? realScenarios.map(s => (s.acc_drop || 0) * 100)
    : [0, 0, 0];
  
  const severityLevels = realScenarios.length > 0
    ? realScenarios.map(s => s.severity || 'Low')
    : ['Low', 'Low', 'Low'];
  
  // Line chart data
  const distributionData = {
    labels: labels,
    datasets: [
      {
        label: 'PSI (Population Stability Index)',
        data: psiValues,
        borderColor: 'rgba(52, 152, 219, 1)',
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Accuracy (%)',
        data: accValues,
        borderColor: 'rgba(46, 204, 113, 1)',
        backgroundColor: 'rgba(46, 204, 113, 0.2)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      }
    ]
  };

  // Bar chart data for accuracy drop
  const accDropData = {
    labels: labels,
    datasets: [
      {
        label: 'Accuracy Drop (%)',
        data: accDropValues,
        backgroundColor: severityLevels.map(s => 
          s === 'High' ? 'rgba(231, 76, 60, 0.8)' : 
          s === 'Moderate' ? 'rgba(241, 196, 15, 0.8)' : 
          'rgba(46, 204, 113, 0.8)'
        ),
        borderColor: severityLevels.map(s => 
          s === 'High' ? 'rgba(231, 76, 60, 1)' : 
          s === 'Moderate' ? 'rgba(241, 196, 15, 1)' : 
          'rgba(46, 204, 113, 1)'
        ),
        borderWidth: 1,
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#c5c6c7' } },
      title: { display: false }
    },
    scales: {
      x: { grid: { color: '#333' }, ticks: { color: '#c5c6c7' } },
      y: { 
        type: 'linear',
        position: 'left',
        grid: { color: '#333' }, 
        ticks: { color: '#c5c6c7' },
        title: { display: true, text: 'PSI', color: '#c5c6c7' }
      },
      y1: {
        type: 'linear',
        position: 'right',
        grid: { display: false },
        ticks: { color: '#c5c6c7' },
        title: { display: true, text: 'Accuracy %', color: '#c5c6c7' },
        min: 0,
        max: 100
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#c5c6c7' } },
      y: { 
        grid: { color: '#333' }, 
        ticks: { color: '#c5c6c7' },
        title: { display: true, text: 'Accuracy Drop %', color: '#c5c6c7' }
      }
    }
  };

  const psiDisplay = avgPsi.toFixed(4);
  const accDropDisplay = (avgAccDrop * 100).toFixed(2);
  const healthDisplay = (avgHealth * 100).toFixed(1);
  const severity = realScenarios.find(s => s.severity === 'High') ? 'High' 
    : realScenarios.find(s => s.severity === 'Moderate') ? 'Moderate' 
    : 'Low';

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>Drift Analysis</h3>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
          <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>Max PSI: <strong>{maxPsi.toFixed(4)}</strong></span>
          <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>Avg PSI: <strong>{psiDisplay}</strong></span>
          <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>Acc Drop: <strong>{accDropDisplay}%</strong></span>
          <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>Health: <strong>{healthDisplay}%</strong></span>
        </div>
      </div>
      
      {/* Line Chart - PSI and Accuracy */}
      <div style={{ height: '250px', width: '100%' }}>
        <Line data={distributionData} options={lineOptions} />
      </div>
      
      {/* Bar Chart - Accuracy Drop */}
      <div style={{ height: '180px', width: '100%', marginTop: '24px' }}>
        <Bar data={accDropData} options={barOptions} />
      </div>
      
      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '24px' }}>
        <span style={{ 
          fontSize: '12px', 
          color: severity === 'High' ? 'var(--status-red)' : severity === 'Moderate' ? 'var(--status-yellow)' : 'var(--status-green)'
        }}>
          Severity: {severity}
        </span>
        {realScenarios.length > 0 && realScenarios[0].top_drift_feature && (
          <span style={{ fontSize: '12px', color: 'var(--text-main)' }}>
            Top Drift Feature: <strong>{realScenarios[0].top_drift_feature}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
