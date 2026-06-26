import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bus, Users, LogOut, Search, Plus, 
  SlidersHorizontal, Download, ChevronLeft, ChevronRight, X, Wrench, Calendar, AlertTriangle, MapPin
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import '../styles/dashboard.css';

// Initial active fleet data from Figma
const INITIAL_FLEET = [
  { id: '#402-A', capacity: 65, status: 'Active' },
  { id: '#315-B', capacity: 92, status: 'Active' },
  { id: '#108-C', capacity: 0, status: 'Maintenance' }
];

// Initial maintenance queue data from Figma
const INITIAL_REPAIRS = [
  {
    id: '#108-C',
    issue: 'Transmission fluid leak detected during morning inspection.',
    priority: 'High',
    date: 'Oct 24, 2023'
  },
  {
    id: '#212-A',
    issue: 'Worn brake pads on rear axle (routine schedule).',
    priority: 'Medium',
    date: 'Oct 22, 2023'
  },
  {
    id: '#055-B',
    issue: 'Passenger side mirror motor unresponsive.',
    priority: 'Low',
    date: 'Oct 20, 2023'
  }
];

const FleetManagementPage = ({ user, onSignOut, fleet, setFleet, repairs, setRepairs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);

  // New Repair Form State
  const [newBusId, setNewBusId] = useState('');
  const [newIssue, setNewIssue] = useState('');
  const [newPriority, setNewPriority] = useState('Medium'); // High | Medium | Low
  const [formErrors, setFormErrors] = useState({});

  // Update Repair Form State
  const [updateIssue, setUpdateIssue] = useState('');
  const [updatePriority, setUpdatePriority] = useState('Medium');

  // Helper for profile initials
  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Helper for priority styling
  const getPriorityClass = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  // Search Logic (applies to Maintenance Queue)
  const filteredRepairs = repairs.filter((r) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.id.toLowerCase().includes(query) ||
      r.issue.toLowerCase().includes(query) ||
      r.priority.toLowerCase().includes(query) ||
      r.date.toLowerCase().includes(query)
    );
  });

  // Handle Log New Repair
  const validateForm = () => {
    const errors = {};
    if (!newBusId.trim()) {
      errors.busId = 'Bus ID is required';
    } else if (!/^#[0-9a-zA-Z-]+$/.test(newBusId)) {
      errors.busId = 'Bus ID must start with # (e.g. #102-A)';
    }
    if (!newIssue.trim()) errors.issue = 'Issue description is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddRepair = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const newRepair = {
      id: newBusId.trim(),
      issue: newIssue.trim(),
      priority: newPriority,
      date: formattedDate
    };

    setRepairs([newRepair, ...repairs]);

    // Also transition the corresponding bus into 'Maintenance' status locally if it exists
    const updatedFleet = fleet.map(b => {
      if (b.id === newBusId.trim()) {
        return { ...b, status: 'Maintenance', capacity: 0 };
      }
      return b;
    });
    setFleet(updatedFleet);

    closeAddModal();
  };

  // Handle Update Repair
  const handleOpenUpdateModal = (repair) => {
    setSelectedRepair(repair);
    setUpdateIssue(repair.issue);
    setUpdatePriority(repair.priority);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateRepair = (e) => {
    e.preventDefault();
    if (!updateIssue.trim()) return;

    const updatedRepairs = repairs.map((r) => {
      if (r.id === selectedRepair.id && r.date === selectedRepair.date) {
        return { ...r, issue: updateIssue, priority: updatePriority };
      }
      return r;
    });

    setRepairs(updatedRepairs);
    closeUpdateModal();
  };

  const handleResolveRepair = () => {
    // Remove from repairs queue
    const updatedRepairs = repairs.filter(
      (r) => !(r.id === selectedRepair.id && r.date === selectedRepair.date)
    );
    setRepairs(updatedRepairs);

    // Revert the bus status to 'Active'
    const updatedFleet = fleet.map(b => {
      if (b.id === selectedRepair.id) {
        return { ...b, status: 'Active', capacity: 60 }; // Reset to a safe starting capacity
      }
      return b;
    });
    setFleet(updatedFleet);

    closeUpdateModal();
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewBusId('');
    setNewIssue('');
    setNewPriority('Medium');
    setFormErrors({});
  };

  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedRepair(null);
    setUpdateIssue('');
    setUpdatePriority('Medium');
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
          <button type="button" className="sidebar-link">
            <Users size={18} />
            Students
          </button>
          <Link to="/users" className="sidebar-link">
            <Users size={18} />
            User Management
          </Link>
          <Link to="/fleet" className="sidebar-link is-active">
            <Bus size={18} />
            Fleet & Maintenance
          </Link>
          <button type="button" className="sidebar-link">
            <MapPin size={18} />
            Route Logistics
          </button>
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
          <h2 className="top-navbar-title">SBMS Dashboard</h2>

          <div className="top-navbar-actions">
            <div className="top-navbar-search">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search fleet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="top-navbar-profile">
              <div className="profile-avatar">
                {getInitials(user.email)}
              </div>
              <span>{user.email}</span>
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="content-canvas">
          {/* Page Header */}
          <div className="canvas-header">
            <div className="header-text-container">
              <h1 className="canvas-title">Fleet Overview</h1>
              <p className="canvas-subtitle">Real-time status and maintenance tracking.</p>
            </div>
            <button 
              type="button" 
              className="add-user-btn"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={16} />
              Log New Repair
            </button>
          </div>

          {/* Bento Stats Cards */}
          <div className="bento-grid">
            <div className="bento-card">
              <p className="bento-card-title">Total Buses</p>
              <p className="bento-card-value">142</p>
              <p className="bento-card-subtext">Active fleet vehicles</p>
            </div>
            <div className="bento-card">
              <p className="bento-card-title">Pending Repairs</p>
              <p className="bento-card-value">{repairs.length}</p>
              <p className="bento-card-subtext" style={{ color: repairs.length > 0 ? '#dc2626' : 'inherit' }}>
                {repairs.length > 0 ? 'Requires attention' : 'All clear'}
              </p>
            </div>
            <div className="bento-card">
              <p className="bento-card-title">Avg. Capacity</p>
              <p className="bento-card-value">84%</p>
              <p className="bento-card-subtext">Optimized transport allocation</p>
            </div>
          </div>

          {/* Active Fleet Status Grid */}
          <div>
            <h2 className="active-fleet-title">Active Fleet Status</h2>
            <div className="fleet-cards-grid">
              {fleet.map((bus) => (
                <Link 
                  key={bus.id} 
                  to={`/fleet/${encodeURIComponent(bus.id)}`} 
                  className="bus-card"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="bus-card-header">
                    <span className="bus-card-id">
                      <Bus size={18} />
                      Bus {bus.id}
                    </span>
                    <span className={`bus-card-status ${bus.status === 'Maintenance' ? 'is-maintenance' : ''}`}>
                      {bus.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="capacity-label-row">
                      <span>Seat Capacity</span>
                      <span style={{ fontWeight: 600 }}>
                        {bus.status === 'Maintenance' ? 'N/A' : `${bus.capacity}%`}
                      </span>
                    </div>
                    {bus.status !== 'Maintenance' ? (
                      <div className="progress-bar-container">
                        <div 
                          className={`progress-bar-fill ${bus.capacity > 90 ? 'danger' : bus.capacity > 80 ? 'warning' : ''}`}
                          style={{ width: `${bus.capacity}%` }}
                        ></div>
                      </div>
                    ) : (
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: '0%', backgroundColor: '#d1d5db' }}></div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginTop: '4px' }}>
                    <span className="bus-card-link">
                      <Bus size={14} />
                      View Details →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Maintenance Queue Table */}
          <div className="canvas-header" style={{ marginTop: '8px' }}>
            <div className="header-text-container">
              <h2 className="canvas-title" style={{ fontSize: '18px' }}>Pending Maintenance Queue</h2>
            </div>
            <div className="filters-actions">
              <button type="button" className="action-btn">
                <SlidersHorizontal size={14} />
                Filter
              </button>
              <button type="button" className="action-btn">
                <Download size={14} />
                Export
              </button>
            </div>
          </div>

          <Card className="directory-card">
            <div className="directory-table-container">
              <table className="directory-table">
                <thead>
                  <tr>
                    <th>Bus ID</th>
                    <th>Issue Description</th>
                    <th>Priority</th>
                    <th>Date Logged</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRepairs.length > 0 ? (
                    filteredRepairs.map((r, index) => (
                      <tr key={`${r.id}-${index}`}>
                        <td style={{ fontWeight: 700, color: 'var(--primary-brand)' }}>{r.id}</td>
                        <td style={{ maxWidth: '300px' }}>{r.issue}</td>
                        <td>
                          <span className={`priority-badge ${getPriorityClass(r.priority)}`}>
                            {r.priority}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                            <Calendar size={14} className="icon-color" />
                            {r.date}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => handleOpenUpdateModal(r)}
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--icon-color)' }}>
                        No pending maintenance requests match the search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination-footer">
              <span className="pagination-info">
                Showing {filteredRepairs.length} of {repairs.length} entries
              </span>

              <div className="pagination-controls">
                <button type="button" className="pagination-btn" disabled>
                  <ChevronLeft size={16} />
                </button>
                <button type="button" className="pagination-btn is-active">1</button>
                <button type="button" className="pagination-btn" disabled>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Log New Repair Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <header className="modal-header">
              <h2>Log New Repair Request</h2>
              <button type="button" className="modal-close-btn" onClick={closeAddModal}>
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleAddRepair}>
              <div className="modal-body">
                <Input
                  label="Bus ID"
                  id="busId"
                  placeholder="e.g. #108-C"
                  value={newBusId}
                  onChange={(e) => setNewBusId(e.target.value)}
                  error={formErrors.busId}
                  iconLeft={<Bus size={18} />}
                />

                <Input
                  label="Issue Description"
                  id="issue"
                  placeholder="e.g. Transmission fluid leak detected during morning inspection."
                  value={newIssue}
                  onChange={(e) => setNewIssue(e.target.value)}
                  error={formErrors.issue}
                  iconLeft={<AlertTriangle size={18} />}
                />

                <div className="select-input-wrapper">
                  <label htmlFor="priority" className="ui-input-label">Priority Level</label>
                  <select
                    id="priority"
                    className="select-input"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                  >
                    <option value="High">High (Immediate Action)</option>
                    <option value="Medium">Medium (Routine maintenance)</option>
                    <option value="Low">Low (Non-critical)</option>
                  </select>
                </div>
              </div>

              <footer className="modal-footer">
                <button 
                  type="button" 
                  className="action-btn"
                  onClick={closeAddModal}
                >
                  Cancel
                </button>
                <Button type="submit">
                  Log Repair
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Update Repair Modal */}
      {isUpdateModalOpen && selectedRepair && (
        <div className="modal-overlay">
          <div className="modal-card">
            <header className="modal-header">
              <h2>Update Repair Status: {selectedRepair.id}</h2>
              <button type="button" className="modal-close-btn" onClick={closeUpdateModal}>
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleUpdateRepair}>
              <div className="modal-body">
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-light)', borderRadius: '8px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', border: '1px solid rgba(197, 197, 211, 0.3)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary-brand)' }}>Date Logged:</span>
                  <span>{selectedRepair.date}</span>
                </div>

                <Input
                  label="Issue Description"
                  id="updateIssue"
                  value={updateIssue}
                  onChange={(e) => setUpdateIssue(e.target.value)}
                  iconLeft={<AlertTriangle size={18} />}
                  required
                />

                <div className="select-input-wrapper">
                  <label htmlFor="updatePriority" className="ui-input-label">Priority Level</label>
                  <select
                    id="updatePriority"
                    className="select-input"
                    value={updatePriority}
                    onChange={(e) => setUpdatePriority(e.target.value)}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <footer className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button 
                  type="button" 
                  className="ui-button"
                  onClick={handleResolveRepair}
                  style={{ backgroundColor: '#10b981', color: '#ffffff', width: 'auto' }}
                >
                  Mark Resolved
                </button>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button" 
                    className="action-btn"
                    onClick={closeUpdateModal}
                  >
                    Cancel
                  </button>
                  <Button type="submit" style={{ width: 'auto' }}>
                    Save Changes
                  </Button>
                </div>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManagementPage;
