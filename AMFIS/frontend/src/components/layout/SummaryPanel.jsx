import { Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function SummaryPanel({ isCollapsed }) {
  if (isCollapsed) {
    // Only applied visually via CSS class width toggle, but returning early is fine though it might break transition.
    // Better to always render and let CSS handle width.
  }

  return (
    <aside className={`summary-panel ${isCollapsed ? 'collapsed' : ''}`} style={{ padding: isCollapsed ? '0' : '24px' }}>
      <div style={{ minWidth: '250px' }}>
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '24px' }}>
          System Health
        </h3>

        <div className="card" style={{ marginBottom: '16px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-main)' }}>Overall Health Score</p>
          <h2 className="text-green" style={{ margin: 0, fontSize: '36px' }}>92%</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px' }}>Average Accuracy</span>
            <span style={{ fontWeight: '600' }}>88.4%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px' }}>High-Risk Datasets</span>
            <span className="text-red" style={{ fontWeight: '600' }}>2</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px' }}>Active Alerts</span>
            <span className="text-yellow" style={{ fontWeight: '600' }}>5</span>
          </div>
        </div>

        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
          Recent Alerts
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <AlertItem 
            type="error" 
            title="Accuracy Drop" 
            desc="Financial_Q3_Data accuracy fell below 85%" 
            time="10 min ago" 
          />
          <AlertItem 
            type="warning" 
            title="Data Drift Detected" 
            desc="User_Behavior_Log shows KL divergence > 0.1" 
            time="1 hr ago" 
          />
          <AlertItem 
            type="success" 
            title="Model Retrained" 
            desc="Vision_Sensor_V2 successfully deployed" 
            time="2 hrs ago" 
          />
        </div>
      </div>
    </aside>
  );
}

function AlertItem({ type, title, desc, time }) {
  const iconMap = {
    error: <AlertTriangle size={16} className="text-red" />,
    warning: <Activity size={16} className="text-yellow" />,
    success: <ShieldCheck size={16} className="text-green" />
  };

  return (
    <div style={{ padding: '12px', backgroundColor: '#12141a', borderRadius: '6px', borderLeft: `3px solid var(--status-${type === 'error' ? 'red' : type === 'warning' ? 'yellow' : 'green'})`}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <strong style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {iconMap[type]} {title}
        </strong>
        <span style={{ fontSize: '10px', color: 'var(--text-main)' }}>{time}</span>
      </div>
      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-main)' }}>{desc}</p>
    </div>
  );
}
