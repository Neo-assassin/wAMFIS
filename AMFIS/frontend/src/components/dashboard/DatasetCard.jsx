import { Activity, GitCommit, Target, AlertTriangle, CheckCircle, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DatasetCard({ dataset }) {
  const navigate = useNavigate();
  
  const getRiskColor = (risk) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'var(--status-green)';
      case 'medium': return 'var(--status-yellow)';
      case 'high': return 'var(--status-red)';
      default: return 'var(--text-main)';
    }
  };

  const getRiskBg = (risk) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'rgba(46, 204, 113, 0.15)';
      case 'medium': return 'rgba(241, 196, 15, 0.15)';
      case 'high': return 'rgba(231, 76, 60, 0.15)';
      default: return 'transparent';
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {dataset.name}
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-main)' }}>
            Updated: {dataset.lastUpdated}
          </span>
        </div>
        <div style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          fontSize: '12px', 
          fontWeight: 'bold',
          color: getRiskColor(dataset.riskLevel),
          backgroundColor: getRiskBg(dataset.riskLevel),
          border: `1px solid ${getRiskColor(dataset.riskLevel)}`
        }}>
          {dataset.riskLevel.toUpperCase()} RISK
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '80px', height: '40px', margin: '0 auto', overflow: 'hidden' }}>
             {/* Simple visual gauge mockup */}
             <div style={{ 
               width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#12141a',
               border: `8px solid ${getRiskColor(dataset.healthScore < 70 ? 'High' : dataset.healthScore < 85 ? 'Medium' : 'Low')}`, 
               borderBottomColor: 'transparent', borderRightColor: 'transparent',
               transform: `rotate(${-45 + (dataset.healthScore / 100) * 180}deg)`,
               transition: 'transform 1s'
             }}></div>
             <div style={{ position: 'absolute', bottom: 0, width: '100%', textAlign: 'center', fontWeight: 'bold' }}>
               {dataset.healthScore}%
             </div>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-main)' }}>Health Score</span>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <Target size={14} className={dataset.accuracyDrop ? "text-red" : "text-green"} />
              Acc Drop: {dataset.accuracyDrop ? 'Yes' : 'No'}
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <GitCommit size={14} className={dataset.driftDetected ? "text-red" : "text-green"} />
              Drift: {dataset.driftDetected ? dataset.driftMetric : 'None'}
           </div>
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
           {dataset.failures > 0 && <AlertTriangle size={16} className="text-red" title="Failures Detected" />}
           {dataset.failures === 0 && <CheckCircle size={16} className="text-green" title="No Failures" />}
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate(`/dataset/${dataset.id}`)}
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          View Details <Navigation size={14} />
        </button>
      </div>
    </div>
  );
}
