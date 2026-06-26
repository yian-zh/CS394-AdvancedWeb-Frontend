import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Bus, Users, LogOut, Search, ChevronLeft, Wrench, Calendar, 
  AlertTriangle, MapPin, SlidersHorizontal, Download, FileText, 
  FileCheck, Edit, ArrowLeft, ArrowUpRight, Gauge, Milestone,
  Camera, Plus
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { getBusDetails } from '../data/fleetData';
import '../styles/dashboard.css';

// Fallback school bus image in assets
import schoolBusImage from '../../../assets/yellow_school_bus.png';

const BusDetailPage = ({ user, onSignOut, fleet, setFleet, repairs, setRepairs }) => {
  const { busId: rawBusId } = useParams();
  const busId = rawBusId.startsWith('#') ? rawBusId : '#' + rawBusId;
  const navigate = useNavigate();

  // Find the bus state from the hoisted state
  const busState = fleet.find(b => b.id === busId);
  
  // Read state overrides from localStorage to keep edits persistent
  const [overrides, setOverrides] = useState({});
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`bus_override_${busId}`);
    if (saved) {
      setOverrides(JSON.parse(saved));
    }
  }, [busId]);

  // Load merged specifications
  const baseDetails = getBusDetails(busId, fleet, repairs);
  const details = {
    ...baseDetails,
    ...overrides,
    status: busState ? busState.status : baseDetails.status,
    capacityUsed: busState ? (busState.status === 'Maintenance' ? 0 : Math.round(busState.capacity * 0.82)) : baseDetails.capacityUsed,
    documents: overrides.documents || baseDetails.documents
  };

  const currentImage = details.image || schoolBusImage;

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDriver, setEditDriver] = useState('');
  const [editRoute, setEditRoute] = useState('');
  const [editMileage, setEditMileage] = useState('');
  const [editCapacity, setEditCapacity] = useState(60);

  // Add Document Modal State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocExpiry, setNewDocExpiry] = useState('');

  const openEditModal = () => {
    setEditDriver(details.driver);
    setEditRoute(details.route);
    setEditMileage(details.mileage);
    setEditCapacity(busState ? busState.capacity : 60);
    setIsEditModalOpen(true);
  };

  const handleSaveDetails = (e) => {
    e.preventDefault();
    const newOverrides = {
      ...overrides,
      driver: editDriver,
      route: editRoute,
      mileage: editMileage
    };
    localStorage.setItem(`bus_override_${busId}`, JSON.stringify(newOverrides));
    setOverrides(newOverrides);

    // Update fleet state (e.g. status and capacity)
    const updatedFleet = fleet.map(b => {
      if (b.id === busId) {
        return { 
          ...b, 
          capacity: parseInt(editCapacity) || 0,
          status: parseInt(editCapacity) === 0 ? 'Maintenance' : 'Active'
        };
      }
      return b;
    });
    setFleet(updatedFleet);
    setIsEditModalOpen(false);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newOverrides = {
          ...overrides,
          image: reader.result
        };
        localStorage.setItem(`bus_override_${busId}`, JSON.stringify(newOverrides));
        setOverrides(newOverrides);
        setImageError(false); // Reset error state to display the new image
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddDocument = (e) => {
    e.preventDefault();
    if (!newDocName.trim() || !newDocExpiry.trim()) return;

    const newDoc = {
      name: newDocName.trim(),
      status: newDocExpiry.trim()
    };

    const updatedDocs = [...details.documents, newDoc];
    const newOverrides = {
      ...overrides,
      documents: updatedDocs
    };
    localStorage.setItem(`bus_override_${busId}`, JSON.stringify(newOverrides));
    setOverrides(newOverrides);

    setNewDocName('');
    setNewDocExpiry('');
    setIsDocModalOpen(false);
  };

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
          <div className="detail-navbar-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to="/fleet" className="back-arrow-link" style={{ color: 'var(--icon-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(197, 197, 211, 0.3)', backgroundColor: '#ffffff', transition: 'all 0.2s' }}>
              <ArrowLeft size={16} />
            </Link>
            <h2 className="top-navbar-title" style={{ fontSize: '18px', fontWeight: 700 }}>Bus {busId}</h2>
          </div>

          <div className="top-navbar-actions">
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
          {/* Detailed Header Row */}
          <div className="canvas-header" style={{ alignItems: 'flex-start' }}>
            <div className="header-text-container" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <h1 className="canvas-title" style={{ fontSize: '28px', margin: 0 }}>Bus {busId}</h1>
                <span className={`bus-card-status ${details.status === 'Maintenance' ? 'is-maintenance' : ''}`} style={{ fontSize: '13px', padding: '6px 14px' }}>
                  {details.status === 'Maintenance' ? 'Maintenance' : 'In Service'}
                </span>
              </div>
              <p className="canvas-subtitle" style={{ fontSize: '14px' }}>
                {details.model} &bull; Assigned to {details.route}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                className="add-user-btn"
                onClick={openEditModal}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Edit size={14} />
                Edit Details
              </button>
            </div>
          </div>

          {/* Two-Column Grid */}
          <div className="bus-detail-grid">
            
            {/* Left Column (Images, Specifications, History) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Hidden file input for bus picture */}
              <input 
                type="file" 
                id="bus-photo-upload" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handlePhotoChange} 
              />

              {/* Image Card */}
              <div 
                className="bus-image-container"
                onClick={() => document.getElementById('bus-photo-upload').click()}
                style={{ cursor: 'pointer' }}
              >
                {!imageError ? (
                  <img 
                    src={currentImage} 
                    alt={`Bus ${busId}`} 
                    className="bus-image" 
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="bus-image-placeholder" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #00236F 0%, #00123a 100%)', color: '#ffffff' }}>
                    <Bus size={64} strokeWidth={1.5} style={{ marginBottom: '12px', opacity: 0.8 }} />
                    <span style={{ fontSize: '18px', fontWeight: 600 }}>SBMS District Fleet</span>
                    <span style={{ fontSize: '13px', opacity: 0.6 }}>Vehicle Overview</span>
                  </div>
                )}
                
                {/* Hover overlay to change picture */}
                <div className="image-overlay">
                  <Camera size={24} />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Upload New Photo</span>
                </div>

                <div className="fuel-badge">
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: details.fuelType === 'Electric' ? '#10b981' : '#f59e0b' }}></span>
                  {details.fuelType}
                </div>
              </div>

              {/* Technical Specifications */}
              <Card className="detail-card">
                <h3 className="detail-card-title">
                  <SlidersHorizontal size={18} />
                  Technical Specifications
                </h3>
                <div className="specs-grid">
                  <div className="spec-item">
                    <span className="spec-label">License Plate</span>
                    <span className="spec-value">{details.licensePlate}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Mileage</span>
                    <span className="spec-value">{details.mileage}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Make & Model</span>
                    <span className="spec-value">{details.makeModel}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Year</span>
                    <span className="spec-value">{details.year}</span>
                  </div>
                </div>
              </Card>

              {/* Maintenance History */}
              <Card className="detail-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(197, 197, 211, 0.2)', paddingBottom: '12px' }}>
                  <h3 className="detail-card-title" style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>
                    <Wrench size={18} />
                    Recent Maintenance
                  </h3>
                  <button type="button" className="bus-card-link" onClick={() => navigate('/fleet')} style={{ fontSize: '13px', margin: 0 }}>
                    View All Logs
                  </button>
                </div>

                <div className="directory-table-container">
                  <table className="directory-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '10px 16px' }}>Date</th>
                        <th style={{ padding: '10px 16px' }}>Service Type</th>
                        <th style={{ padding: '10px 16px' }}>Mileage</th>
                        <th style={{ padding: '10px 16px', textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.maintenanceLogs.length > 0 ? (
                        details.maintenanceLogs.map((log, index) => (
                          <tr key={index}>
                            <td style={{ padding: '12px 16px' }}>{log.date}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 500 }}>{log.type}</td>
                            <td style={{ padding: '12px 16px' }}>{log.mileage} mi</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <span className={`priority-badge ${log.status === 'Completed' ? 'priority-low' : 'priority-medium'}`} style={{ fontSize: '10px', textTransform: 'none', padding: '2px 8px' }}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--icon-color)' }}>
                            No logged maintenance history.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

            </div>

            {/* Right Column (Assignment, Documents) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Current Assignment */}
              <Card className="detail-card">
                <h3 className="detail-card-title">
                  <Users size={18} />
                  Current Assignment
                </h3>

                <div className="assignment-detail-item">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                    <span className="assignment-detail-label">Assigned Driver</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <div className="profile-avatar" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                        {getInitials(details.driver)}
                      </div>
                      <span className="assignment-detail-value">{details.driver}</span>
                    </div>
                  </div>
                </div>

                <div className="assignment-detail-item">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                    <span className="assignment-detail-label">Active Route</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', color: 'var(--primary-brand)', fontWeight: 600 }}>
                      <MapPin size={16} />
                      <span className="assignment-detail-value" style={{ color: 'var(--primary-brand)' }}>{details.fullRoute || details.route}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
                  <div className="capacity-label-row">
                    <span>Passenger Capacity</span>
                    <span style={{ fontWeight: 600 }}>
                      {details.status === 'Maintenance' ? '0 / 0 (N/A)' : `${details.capacityUsed} / ${details.capacityTotal}`}
                    </span>
                  </div>
                  {details.status !== 'Maintenance' ? (
                    <div>
                      <div className="progress-bar-container" style={{ height: '10px' }}>
                        <div 
                          className="progress-bar-fill"
                          style={{ width: `${(details.capacityUsed / details.capacityTotal) * 100}%` }}
                        ></div>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--icon-color)', marginTop: '4px', display: 'block', textAlign: 'right' }}>
                        Optimal capacity running
                      </span>
                    </div>
                  ) : (
                    <div className="progress-bar-container" style={{ height: '10px' }}>
                      <div className="progress-bar-fill" style={{ width: '0%', backgroundColor: '#d1d5db' }}></div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Documents & Compliance */}
              <Card className="detail-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(197, 197, 211, 0.2)', paddingBottom: '12px' }}>
                  <h3 className="detail-card-title" style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>
                    <FileText size={18} />
                    Documents & Compliance
                  </h3>
                  <button type="button" className="action-btn" style={{ padding: '4px 8px', border: 'none', background: 'none' }}>
                    <Download size={16} className="icon-color" />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {details.documents.map((doc, idx) => (
                    <div key={idx} className="document-item">
                      <div className="document-info">
                        <FileCheck size={20} style={{ color: doc.status.includes('Expired') ? '#ef4444' : 'var(--primary-brand)', flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span className="document-name">{doc.name}</span>
                          <span className="document-status" style={{ color: doc.status.includes('Expired') ? '#ef4444' : 'inherit' }}>
                            {doc.status}
                          </span>
                        </div>
                      </div>
                      <ArrowUpRight size={14} className="icon-color" style={{ opacity: 0.5, cursor: 'pointer' }} />
                    </div>
                  ))}

                  <button 
                    type="button" 
                    className="bus-card-link"
                    onClick={() => setIsDocModalOpen(true)}
                    style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={14} />
                    Add New Document
                  </button>
                </div>

                <button type="button" className="action-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '16px', fontSize: '13px' }}>
                  View All Documents
                </button>
              </Card>

            </div>

          </div>
        </div>
      </main>

      {/* Edit Details Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <header className="modal-header">
              <h2>Edit Vehicle Details: Bus {busId}</h2>
              <button type="button" className="modal-close-btn" onClick={() => setIsEditModalOpen(false)}>
                <ChevronLeft size={18} />
              </button>
            </header>

            <form onSubmit={handleSaveDetails}>
              <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                <div className="modal-section-title">Assignment Settings</div>
                
                <Input
                  label="Assigned Driver"
                  id="editDriver"
                  value={editDriver}
                  onChange={(e) => setEditDriver(e.target.value)}
                  iconLeft={<Users size={18} />}
                  required
                />

                <Input
                  label="Active Route (e.g. Route 14A)"
                  id="editRoute"
                  value={editRoute}
                  onChange={(e) => setEditRoute(e.target.value)}
                  iconLeft={<MapPin size={18} />}
                  required
                />

                <div className="modal-section-title">Specifications Overrides</div>

                <Input
                  label="Current Mileage (mi)"
                  id="editMileage"
                  value={editMileage}
                  onChange={(e) => setEditMileage(e.target.value)}
                  iconLeft={<Gauge size={18} />}
                  required
                />

                <Input
                  label="Seat Capacity Percentage (0 for Maintenance)"
                  id="editCapacity"
                  type="number"
                  min="0"
                  max="100"
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(e.target.value)}
                  iconLeft={<Milestone size={18} />}
                  required
                />
              </div>

              <footer className="modal-footer">
                <button 
                  type="button" 
                  className="action-btn"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <Button type="submit">
                  Save Details
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {isDocModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '420px' }}>
            <header className="modal-header">
              <h2>Add New Document</h2>
              <button type="button" className="modal-close-btn" onClick={() => setIsDocModalOpen(false)}>
                <ChevronLeft size={18} />
              </button>
            </header>

            <form onSubmit={handleAddDocument}>
              <div className="modal-body">
                <Input
                  label="Document Name"
                  id="newDocName"
                  placeholder="e.g. Safety Inspection Receipt"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  iconLeft={<FileText size={18} />}
                  required
                />

                <Input
                  label="Status / Expiration Date"
                  id="newDocExpiry"
                  placeholder="e.g. Expires: Jan 2027 or Valid"
                  value={newDocExpiry}
                  onChange={(e) => setNewDocExpiry(e.target.value)}
                  iconLeft={<Calendar size={18} />}
                  required
                />
              </div>

              <footer className="modal-footer">
                <button 
                  type="button" 
                  className="action-btn"
                  onClick={() => setIsDocModalOpen(false)}
                >
                  Cancel
                </button>
                <Button type="submit">
                  Add Document
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusDetailPage;
