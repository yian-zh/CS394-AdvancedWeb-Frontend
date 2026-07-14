import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bus, Users, LogOut, Search, Plus, 
  SlidersHorizontal, ChevronLeft, ChevronRight, X, MapPin, 
  GraduationCap, ArrowRight, Clock
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import '../styles/dashboard.css';

const INITIAL_ROUTES = [
  { 
    id: 'route-42', 
    name: 'Route 42 - North Campus', 
    status: 'Active', 
    detail: 'Mornings & Afternoons',
    driver: 'Marcus Sterling', 
    driverInitials: 'MS',
    busId: '#402', 
    timeWindow: '06:45 AM - 08:15 AM', 
    stopsCount: 14, 
    capacityUsed: 32, 
    capacityTotal: 45 
  },
  { 
    id: 'route-12', 
    name: 'Route 12 - South District', 
    status: 'Delayed', 
    detail: 'Traffic: 12 min delay',
    driver: 'Elena Rodriguez', 
    driverInitials: 'ER',
    busId: '#108', 
    timeWindow: '07:15 AM - 08:30 AM', 
    stopsCount: 22, 
    capacityUsed: 48, 
    capacityTotal: 52 
  },
  { 
    id: 'route-31', 
    name: 'Route 31 - Central Special Ed', 
    status: 'Active', 
    detail: 'Specialized Equipment Required',
    driver: 'David Vance', 
    driverInitials: 'DV',
    busId: '#S-14', 
    timeWindow: '07:00 AM - 08:30 AM', 
    stopsCount: 11, 
    capacityUsed: 14, 
    capacityTotal: 15 
  },
  { 
    id: 'route-1', 
    name: 'Route 1 - Phnom Penh Central', 
    status: 'Active', 
    detail: 'Mornings & Afternoons',
    driver: 'Sarah Jenkins', 
    driverInitials: 'SJ',
    busId: '#402-A', 
    timeWindow: '06:30 AM - 08:00 AM', 
    stopsCount: 6, 
    capacityUsed: 45, 
    capacityTotal: 60 
  }
];

const RouteLogisticsPage = ({ user, onSignOut }) => {
  const [routes, setRoutes] = useState(INITIAL_ROUTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // All | Active | Delayed
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // New Route Form State
  const [newRouteName, setNewRouteName] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newBusId, setNewBusId] = useState('');
  const [newTimeWindow, setNewTimeWindow] = useState('07:00 AM - 08:30 AM');
  const [newStopsCount, setNewStopsCount] = useState(10);
  const [newCapacityTotal, setNewCapacityTotal] = useState(60);
  const [newDetail, setNewDetail] = useState('Mornings & Afternoons');

  const handleAddRoute = (e) => {
    e.preventDefault();
    if (!newRouteName.trim() || !newDriverName.trim() || !newBusId.trim()) return;

    const routeId = `route-${newRouteName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const initials = newDriverName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

    const newRoute = {
      id: routeId,
      name: newRouteName.trim(),
      status: 'Active',
      detail: newDetail.trim(),
      driver: newDriverName.trim(),
      driverInitials: initials,
      busId: newBusId.trim().startsWith('#') ? newBusId.trim() : `#${newBusId.trim()}`,
      timeWindow: newTimeWindow,
      stopsCount: parseInt(newStopsCount) || 5,
      capacityUsed: 0,
      capacityTotal: parseInt(newCapacityTotal) || 50
    };

    setRoutes([newRoute, ...routes]);
    setIsAddModalOpen(false);

    // Reset Form
    setNewRouteName('');
    setNewDriverName('');
    setNewBusId('');
    setNewTimeWindow('07:00 AM - 08:30 AM');
    setNewStopsCount(10);
    setNewCapacityTotal(60);
    setNewDetail('Mornings & Afternoons');
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Filter routes based on search and status tabs
  const filteredRoutes = routes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.busId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || 
                          r.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

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
          <Link to="/logistics" className="sidebar-link is-active">
            <MapPin size={18} />
            Route Logistics
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

      {/* Main content frame */}
      <main className="dashboard-main">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div className="detail-navbar-left">
            <h2 className="top-navbar-title" style={{ fontSize: '18px', fontWeight: 700 }}>SBMS Dashboard</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="top-navbar-search" style={{ border: '1px solid rgba(197, 197, 211, 0.4)', borderRadius: '99px', width: '280px' }}>
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search routes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '8px' }}
              />
            </div>

            <div className="top-navbar-actions">
              <div className="top-navbar-profile">
                <div className="profile-avatar">
                  {getInitials(user?.email || 'Admin')}
                </div>
                <span>{user?.email || 'admin@sbms.edu'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="content-canvas">
          {/* Header Action Grid */}
          <div className="canvas-header" style={{ alignItems: 'flex-start' }}>
            <div className="header-text-container" style={{ textAlign: 'left' }}>
              <h1 className="canvas-title" style={{ fontSize: '28px', margin: 0 }}>Route Directory</h1>
              <p className="canvas-subtitle" style={{ fontSize: '14px' }}>
                Monitor and manage {routes.length} active transportation routes across the district.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                className="add-user-btn"
                onClick={() => setIsFilterModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#ffffff', color: 'var(--text-dark)', border: '1px solid rgba(197, 197, 211, 0.5)' }}
              >
                <SlidersHorizontal size={14} />
                Filter
              </button>
              <button 
                type="button" 
                className="add-user-btn"
                onClick={() => setIsAddModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} />
                New Route
              </button>
            </div>
          </div>

          {/* Quick status tabs */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            {['All', 'Active', 'Delayed'].map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '99px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: statusFilter === tab ? 'var(--primary-brand)' : '#ffffff',
                  color: statusFilter === tab ? '#ffffff' : 'var(--icon-color)',
                  border: '1px solid rgba(197, 197, 211, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Route Cards Grid */}
          <div className="route-grid">
            {filteredRoutes.map(route => {
              const capPercentage = Math.round((route.capacityUsed / route.capacityTotal) * 100);
              const statusClass = route.status.toLowerCase() === 'active' ? 'route-status-active' : 'route-status-delayed';
              
              return (
                <Link to={`/logistics/${route.id}`} key={route.id} className="route-card">
                  <div className="route-card-header">
                    <div>
                      <h3 className="route-card-title">{route.name}</h3>
                      <p className="route-card-detail">{route.detail}</p>
                    </div>
                    <span className={`route-status-badge ${statusClass}`}>
                      {route.status}
                    </span>
                  </div>

                  <div className="route-card-info-grid">
                    <div className="route-info-item">
                      <div className="route-info-icon-wrapper">
                        <Users size={14} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="route-info-label">Driver</span>
                        <span className="route-info-value">{route.driver}</span>
                      </div>
                    </div>

                    <div className="route-info-item">
                      <div className="route-info-icon-wrapper">
                        <Bus size={14} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="route-info-label">Assigned Bus</span>
                        <span className="route-info-value">{route.busId}</span>
                      </div>
                    </div>

                    <div className="route-info-item">
                      <div className="route-info-icon-wrapper">
                        <Clock size={14} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="route-info-label">Time Window</span>
                        <span className="route-info-value">{route.timeWindow}</span>
                      </div>
                    </div>

                    <div className="route-info-item">
                      <div className="route-info-icon-wrapper">
                        <MapPin size={14} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="route-info-label">Total Stops</span>
                        <span className="route-info-value">{route.stopsCount} Points</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: 'var(--icon-color)' }}>
                      <span>Student Capacity</span>
                      <span>{route.capacityUsed}/{route.capacityTotal} ({capPercentage}%)</span>
                    </div>
                    <div className="progress-bar-container" style={{ height: '6px', borderRadius: '3px' }}>
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${capPercentage}%`, height: '100%', borderRadius: '3px' }}
                      ></div>
                    </div>
                  </div>

                  <div className="route-card-footer">
                    <div className="route-students-group">
                      <div className="route-student-avatar">A</div>
                      <div className="route-student-avatar">B</div>
                      <div className="route-student-avatar">C</div>
                      <div className="route-student-more-badge">+{route.stopsCount * 2}</div>
                    </div>
                    
                    <span className="route-view-details-link">
                      View Details
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              );
            })}
            
            {filteredRoutes.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px dashed rgba(197, 197, 211, 0.5)', color: 'var(--icon-color)' }}>
                <MapPin size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No routes match your search or filter.</p>
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          <div className="pagination-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', borderTop: '1px solid rgba(197, 197, 211, 0.2)', paddingTop: '20px' }}>
            <span style={{ fontSize: '13px', color: 'var(--icon-color)' }}>
              Showing {filteredRoutes.length} of {routes.length} active routes
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" className="pagination-btn" style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#ffffff', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={14} />
              </button>
              <button type="button" className="pagination-btn active" style={{ padding: '6px 12px', border: '1px solid var(--primary-brand)', borderRadius: '6px', backgroundColor: 'var(--primary-brand)', color: '#ffffff', cursor: 'pointer', fontWeight: 600 }}>1</button>
              <button type="button" className="pagination-btn" style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#ffffff', color: '#64748b', cursor: 'pointer' }}>2</button>
              <button type="button" className="pagination-btn" style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#ffffff', color: '#64748b', cursor: 'pointer' }}>3</button>
              <button type="button" className="pagination-btn" style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#ffffff', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* --- Add Route Modal --- */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <form onSubmit={handleAddRoute} className="modal-card" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h2>Create New Route</h2>
              <button type="button" className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Route Name</label>
                <Input 
                  type="text" 
                  placeholder="e.g. Route 42 - North Campus"
                  value={newRouteName}
                  onChange={(e) => setNewRouteName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Schedule / Details</label>
                <Input 
                  type="text" 
                  placeholder="e.g. Mornings & Afternoons"
                  value={newDetail}
                  onChange={(e) => setNewDetail(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Driver Name</label>
                  <Input 
                    type="text" 
                    placeholder="e.g. Marcus Sterling"
                    value={newDriverName}
                    onChange={(e) => setNewDriverName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Assigned Bus ID</label>
                  <Input 
                    type="text" 
                    placeholder="e.g. #402"
                    value={newBusId}
                    onChange={(e) => setNewBusId(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Time Window</label>
                  <Input 
                    type="text" 
                    placeholder="e.g. 06:45 AM - 08:15 AM"
                    value={newTimeWindow}
                    onChange={(e) => setNewTimeWindow(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Total Stops</label>
                  <Input 
                    type="number" 
                    placeholder="e.g. 14"
                    value={newStopsCount}
                    onChange={(e) => setNewStopsCount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Total Capacity</label>
                <Input 
                  type="number" 
                  placeholder="e.g. 50"
                  value={newCapacityTotal}
                  onChange={(e) => setNewCapacityTotal(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create Route
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* --- Filter Modal --- */}
      {isFilterModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Filter Routes</h2>
              <button type="button" className="modal-close-btn" onClick={() => setIsFilterModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Route Status</label>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  {['All', 'Active', 'Delayed'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: statusFilter === status ? 'var(--primary-brand)' : '#f1f5f9',
                        color: statusFilter === status ? '#ffffff' : 'var(--text-dark)',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Time Duration</label>
                <select className="select-input" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option>All Times</option>
                  <option>Morning Shifts (before 08:00 AM)</option>
                  <option>Mid-Day Shifts</option>
                  <option>Afternoon Shifts</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <Button type="button" variant="secondary" onClick={() => setIsFilterModalOpen(false)}>
                Close
              </Button>
              <Button type="button" onClick={() => setIsFilterModalOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteLogisticsPage;
