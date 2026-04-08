import { Filter } from 'lucide-react';

export default function FilterBar({ onFilterChange }) {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '16px', 
      padding: '16px', 
      backgroundColor: 'var(--bg-card)', 
      borderRadius: 'var(--border-radius)',
      border: '1px solid var(--border-color)',
      marginBottom: '24px',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
        <Filter size={20} />
        <strong>Filters</strong>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', flex: 1 }}>
        <select onChange={(e) => onFilterChange('risk', e.target.value)} defaultValue="all">
          <option value="all">All Risk Levels</option>
          <option value="high">High Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="low">Low Risk</option>
        </select>

        <select onChange={(e) => onFilterChange('time', e.target.value)} defaultValue="24h">
          <option value="1h">Last 1 Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>

        <select onChange={(e) => onFilterChange('failure', e.target.value)} defaultValue="all">
          <option value="all">All Failure Types</option>
          <option value="data">Data Issues</option>
          <option value="bias">Feature Bias</option>
          <option value="drift">Drift Related</option>
          <option value="model">Model Limitation</option>
        </select>
      </div>
      
      <button className="btn">Clear Filters</button>
    </div>
  );
}
