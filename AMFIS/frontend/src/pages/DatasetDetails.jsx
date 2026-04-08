import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DataMonitoring from '../components/details/DataMonitoring';
import DriftCharts from '../components/details/DriftCharts';
import PerformanceMetrics from '../components/details/PerformanceMetrics';
import Robustness from '../components/details/Robustness';
import Explainability from '../components/details/Explainability';
import FailureAnalysis from '../components/details/FailureAnalysis';
import RiskAlerts from '../components/details/RiskAlerts';
import StatusReport from '../components/details/StatusReport';
import { mockDatasets } from '../data/mockData';
import { useEffect, useState } from 'react';

export default function DatasetDetails() {
  const { id } = useParams();
  const dataset = mockDatasets.find(d => d.id === id) || mockDatasets[0];
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || '';
    // Use backendName when available (dashboard creates backendName), otherwise use dataset.name
    const backendName = dataset?.backendName || dataset?.name || id;
    fetch(`${API}/api/monitoring/results/?dataset=${encodeURIComponent(backendName)}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('no api')))
      .then(payload => {
        if (payload && Array.isArray(payload.data)) {
          setDetails(payload.data);
        }
      })
      .catch(() => {
        fetch('/combinedResultsDetailed.json')
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data && data[id]) setDetails(data[id]); })
          .catch(() => {});
      });
  }, [id]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/dashboard" className="btn" style={{ textDecoration: 'none', padding: '8px' }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            {dataset.name} 
            <span style={{ 
              fontSize: '12px', 
              padding: '4px 8px', 
              borderRadius: '4px',
              backgroundColor: dataset.riskLevel === 'high' ? 'rgba(231, 76, 60, 0.2)' : dataset.riskLevel === 'medium' ? 'rgba(241, 196, 15, 0.2)' : 'rgba(46, 204, 113, 0.2)',
              color: dataset.riskLevel === 'high' ? 'var(--status-red)' : dataset.riskLevel === 'medium' ? 'var(--status-yellow)' : 'var(--status-green)',
              border: `1px solid ${dataset.riskLevel === 'high' ? 'var(--status-red)' : dataset.riskLevel === 'medium' ? 'var(--status-yellow)' : 'var(--status-green)'}`
            }}>
              {dataset.riskLevel.toUpperCase()} RISK
            </span>
          </h2>
          <p style={{ color: 'var(--text-main)', margin: '4px 0 0 0', fontSize: '14px' }}>
            Last Detailed Scan: {dataset.lastUpdated}
          </p>
        </div>
      </div>

      <RiskAlerts dataset={dataset} details={details} />
      <StatusReport dataset={dataset} details={details} />
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <DataMonitoring dataset={dataset} details={details} />
        <DriftCharts dataset={dataset} details={details} />
        <PerformanceMetrics dataset={dataset} details={details} />
        <Robustness dataset={dataset} details={details} />
        <Explainability dataset={dataset} details={details} />
        <FailureAnalysis dataset={dataset} details={details} />
      </div>

    </div>
  );
}
