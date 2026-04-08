import { useState, useEffect } from 'react';
import { Bell, User, Search, PanelRightClose, PanelRightOpen } from 'lucide-react';

export default function Navbar({ toggleSummary }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}`;
  };

  const formatTime = (date) => {
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${min}`;
  };

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>AMFIS</h2>
        <span style={{ color: 'var(--text-main)', fontSize: '14px', borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
          Autonomous Model Failure Intelligence System
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#12141a', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
          <Search size={16} style={{ marginRight: '8px', color: 'var(--text-main)' }} />
          <input 
            type="text" 
            placeholder="Search datasets..." 
            style={{ border: 'none', background: 'transparent', padding: 0, width: '200px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
          <span>{formatDate(time)}</span>
          <span style={{ color: 'var(--primary-color)' }}>{formatTime(time)}</span>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button className="btn" style={{ padding: '6px' }}>
            <Bell size={18} />
          </button>
          <button className="btn" style={{ padding: '6px' }}>
            <User size={18} />
          </button>
          <button className="btn" onClick={toggleSummary} style={{ padding: '6px', marginLeft: '8px' }}>
            <PanelRightClose size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}
