import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, BarChart2, GitCommit, Search, ShieldAlert } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/data-monitoring', label: 'Data Monitoring', icon: Activity },
  { path: '/model-performance', label: 'Model Performance', icon: BarChart2 },
  { path: '/drift-analysis', label: 'Drift Analysis', icon: GitCommit },
  { path: '/explainability', label: 'Explainability', icon: Search },
  { path: '/failure-analysis', label: 'Failure Analysis', icon: ShieldAlert },
  { path: '/alerts-risk', label: 'Alerts & Risk', icon: ShieldAlert }, // Reusing icon for brevity
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: isActive ? 'var(--text-header)' : 'var(--text-main)',
              backgroundColor: isActive ? 'var(--bg-card-hover)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
              transition: 'all 0.2s ease',
              fontWeight: isActive ? '600' : '400'
            })}
          >
            <item.icon size={20} style={{ color: 'var(--primary-color)' }} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      
      <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--border-color)' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-main)', textAlign: 'center' }}>
          AMFIS Core v1.2.0<br/>Status: <span className="text-green">Online</span>
        </p>
      </div>
    </aside>
  );
}
