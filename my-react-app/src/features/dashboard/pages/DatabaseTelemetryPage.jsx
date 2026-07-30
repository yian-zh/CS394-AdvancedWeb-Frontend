import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bus, Users, LogOut, Search, Plus, 
  SlidersHorizontal, Download, X, MapPin, DollarSign,
  GraduationCap, Database, Server, Cpu, Activity, RefreshCw, CheckCircle2, 
  AlertTriangle, HardDrive, Layers, Clock, Zap
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import { useDatabaseTelemetry } from '../hooks/useTelemetry';
import '../styles/dashboard.css';

const DatabaseTelemetryPage = ({ user, onSignOut }) => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { data: telemetryData, isLoading, isRefetching, error, forceRefetch } = useDatabaseTelemetry({ 
    refetchInterval: autoRefresh ? 15000 : false 
  });

  const summary = telemetryData?.summary || {};
  const pgData = telemetryData?.postgres || {};
  const mongoData = telemetryData?.mongodb || {};
  const queryFeed = telemetryData?.query_feed || [];
  const timestamp = telemetryData?.timestamp ? new Date(telemetryData.timestamp).toLocaleTimeString() : 'Live';

  const handleRefresh = async () => {
    await forceRefetch();
  };

  const getStatusBadge = (status) => {
    const isOk = status && status.toLowerCase() === 'healthy';
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: isOk ? 'rgba(22, 163, 74, 0.12)' : 'rgba(220, 38, 38, 0.12)',
        color: isOk ? '#16a34a' : '#dc2626',
        border: `1px solid ${isOk ? 'rgba(22, 163, 74, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`
      }}>
        {isOk ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
        {status || 'Unknown'}
      </span>
    );
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <h1 className="sidebar-brand-title">
            <Bus size={20} strokeWidth={2.5} />
            SBMS Admin
          </h1>
          <p className="sidebar-brand-subtitle">District Central</p>
        </div>

        <nav className="sidebar-nav">
          <Link to="/students" className="sidebar-link">
            <GraduationCap size={18} />
            Students
          </Link>
          <Link to="/users" className="sidebar-link">
            <Users size={18} />
            User Management
          </Link>
          <Link to="/fleet" className="sidebar-link">
            <Bus size={18} />
            Fleet & Maintenance
          </Link>
          <Link to="/logistics" className="sidebar-link">
            <MapPin size={18} />
            Route Logistics
          </Link>
          <Link to="/finance" className="sidebar-link">
            <DollarSign size={18} />
            Finance
          </Link>
          <Link to="/telemetry" className="sidebar-link is-active">
            <Activity size={18} />
            Telemetry
          </Link>
          <button type="button" className="sidebar-link">
            <SlidersHorizontal size={18} />
            Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-profile">
            <div className="sidebar-profile-avatar">AM</div>
            <div className="sidebar-profile-info">
              <span className="sidebar-profile-name">Alex Mercer</span>
              <span className="sidebar-profile-role">System Admin</span>
            </div>
          </div>
          <button 
            type="button" 
            className="sidebar-link" 
            onClick={onSignOut}
            style={{ color: '#fda4af' }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Top Navbar */}
        <header className="top-navbar">
          <h2 className="top-navbar-title">SBMS Dashboard</h2>

          <div className="top-navbar-actions">
            <div className="top-navbar-profile">
              <div className="profile-avatar">AM</div>
              <span>Alex Mercer</span>
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="content-canvas">
          {/* Page Header */}
          <div className="canvas-header" style={{ marginBottom: '24px' }}>
            <div className="header-text-container">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-brand)', display: 'flex' }}>
                  <Activity size={24} />
                </div>
                <div>
                  <h1 className="canvas-title" style={{ fontSize: '22px', margin: 0 }}>Database Telemetry & Health</h1>
                  <p className="canvas-subtitle" style={{ margin: '4px 0 0 0' }}>
                    Live latency metrics, query telemetry, and record distribution across PostgreSQL & MongoDB
                  </p>
                </div>
              </div>
            </div>

            <div className="filters-actions" style={{ gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}>
                <input 
                  type="checkbox" 
                  checked={autoRefresh} 
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  style={{ accentColor: 'var(--primary-brand)', cursor: 'pointer' }}
                />
                Auto-poll (15s)
              </label>

              <button 
                type="button" 
                className="action-btn"
                onClick={handleRefresh}
                disabled={isRefetching || isLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-white)', borderColor: 'var(--border-color)', fontWeight: 600 }}
              >
                <RefreshCw size={14} className={isRefetching || isLoading ? 'spin' : ''} />
                {isRefetching || isLoading ? 'Pinging DB...' : 'Force Health Ping'}
              </button>
            </div>
          </div>

          {/* Bento Grid Latency & Overview Cards */}
          <div className="telemetry-grid">
            {/* PostgreSQL Card */}
            <Card className="telemetry-bento-card">
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={18} style={{ color: '#3b82f6' }} />
                  <span className="bento-card-title" style={{ margin: 0 }}>POSTGRESQL DB</span>
                </div>
                {getStatusBadge(pgData.status)}
              </div>
              <div className="bento-card-value" style={{ color: '#3b82f6', display: 'flex', alignItems: 'baseline', gap: '4px', width: '100%', margin: '4px 0' }}>
                {pgData.latency_ms ?? '--'} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>ms ping</span>
              </div>
              <span className="bento-card-subtext" style={{ color: 'var(--text-secondary)', width: '100%' }}>
                Relational Storage • {(pgData.table_counts ? Object.keys(pgData.table_counts).length : 8)} active tables
              </span>
            </Card>

            {/* MongoDB Card */}
            <Card className="telemetry-bento-card">
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HardDrive size={18} style={{ color: '#10b981' }} />
                  <span className="bento-card-title" style={{ margin: 0 }}>MONGODB CLUSTER</span>
                </div>
                {getStatusBadge(mongoData.status)}
              </div>
              <div className="bento-card-value" style={{ color: '#10b981', display: 'flex', alignItems: 'baseline', gap: '4px', width: '100%', margin: '4px 0' }}>
                {mongoData.latency_ms ?? '--'} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>ms ping</span>
              </div>
              <span className="bento-card-subtext" style={{ color: 'var(--text-secondary)', width: '100%' }}>
                Document Store • {(summary.mongo_total_records ?? 0).toLocaleString()} maintenance logs
              </span>
            </Card>

            {/* Grand Total Records */}
            <Card className="telemetry-bento-card">
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Layers size={18} style={{ color: '#8b5cf6' }} />
                <span className="bento-card-title" style={{ margin: 0 }}>TOTAL HYBRID RECORDS</span>
              </div>
              <div className="bento-card-value" style={{ color: '#8b5cf6', width: '100%', margin: '4px 0' }}>
                {(summary.grand_total_records ?? 0).toLocaleString()}
              </div>
              <span className="bento-card-subtext" style={{ color: '#16a34a', fontWeight: '600', width: '100%' }}>
                {(summary.pg_total_records ?? 0).toLocaleString()} PG + {(summary.mongo_total_records ?? 0).toLocaleString()} Mongo
              </span>
            </Card>

            {/* Average Latency */}
            <Card className="telemetry-bento-card">
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Zap size={18} style={{ color: '#f59e0b' }} />
                <span className="bento-card-title" style={{ margin: 0 }}>AVG QUERY LATENCY</span>
              </div>
              <div className="bento-card-value" style={{ color: '#f59e0b', display: 'flex', alignItems: 'baseline', gap: '4px', width: '100%', margin: '4px 0' }}>
                {summary.avg_query_latency_ms ?? '--'} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>ms</span>
              </div>
              <span className="bento-card-subtext" style={{ color: 'var(--text-secondary)', width: '100%' }}>
                Last pinged at {timestamp}
              </span>
            </Card>
          </div>

          {/* Database Tables & Collection Breakdown Grid */}
          <div className="telemetry-breakdown-grid">
            {/* PostgreSQL Tables Card */}
            <Card style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Server size={18} style={{ color: '#3b82f6' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>PostgreSQL Tables</h3>
                </div>
                <span className="role-badge badge-route-1">Relational</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pgData.table_counts ? Object.entries(pgData.table_counts).map(([tableName, count]) => (
                  <div key={tableName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-light)', borderRadius: '8px', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{tableName}</span>
                    <span style={{ fontWeight: 700, color: '#3b82f6' }}>{count.toLocaleString()} rows</span>
                  </div>
                )) : (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '16px' }}>Loading table statistics...</div>
                )}
              </div>
            </Card>

            {/* MongoDB Collections Card */}
            <Card style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={18} style={{ color: '#10b981' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>MongoDB Collections</h3>
                </div>
                <span className="role-badge badge-route-4">Document Store</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {mongoData.collection_counts ? Object.entries(mongoData.collection_counts).map(([collName, count]) => (
                  <div key={collName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-light)', borderRadius: '8px', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{collName}</span>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>{count.toLocaleString()} docs</span>
                  </div>
                )) : (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '16px' }}>Loading collection statistics...</div>
                )}

                <div style={{ marginTop: '16px', padding: '14px 18px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px dashed rgba(16, 185, 129, 0.3)', fontSize: '13px', color: '#047857' }}>
                  <span style={{ fontWeight: 600 }}>Hybrid Data Pipeline Active:</span> Operational maintenance logs & diagnostics synchronize transparently with PostgreSQL vehicle records.
                </div>
              </div>
            </Card>
          </div>

          {/* Live Query Execution Feed Table */}
          <div className="canvas-header" style={{ marginBottom: '12px' }}>
            <div className="header-text-container">
              <h2 className="canvas-title" style={{ fontSize: '18px' }}>Live Query Execution Telemetry</h2>
            </div>
          </div>

          <Card className="directory-card">
            <div className="directory-table-container">
              <table className="directory-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>API Endpoint / Operation</th>
                    <th>Database Engine</th>
                    <th>Query Type</th>
                    <th>Latency</th>
                    <th style={{ textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--primary-brand)' }}>
                        <div className="ui-button-spinner" style={{ display: 'inline-block', borderTopColor: 'var(--primary-brand)', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }} />
                        <span style={{ marginLeft: '8px', verticalAlign: 'middle' }}>Gathering telemetry feed...</span>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#dc2626' }}>
                        Error loading telemetry: {error.message || String(error)}
                      </td>
                    </tr>
                  ) : queryFeed.length > 0 ? (
                    queryFeed.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                          {item.endpoint}
                        </td>
                        <td>
                          <span className={`role-badge ${item.engine === 'PostgreSQL' ? 'badge-route-1' : 'badge-route-4'}`}>
                            {item.engine}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {item.query_type}
                        </td>
                        <td style={{ fontWeight: 700, color: item.duration_ms > 20 ? '#d97706' : '#16a34a' }}>
                          {item.duration_ms} ms
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '12px' }}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--icon-color)' }}>
                        No recent query telemetry recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DatabaseTelemetryPage;
