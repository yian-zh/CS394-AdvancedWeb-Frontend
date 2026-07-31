import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bus, Users, LogOut, Search, Plus, 
  SlidersHorizontal, Download, X, Wrench, Calendar, AlertTriangle, MapPin,
  GraduationCap, FileText, DollarSign, Activity
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Pagination from '../../../components/ui/Pagination';
import { useDebounce } from '../../../hooks/useDebounce';
import { useBuses, usePendingMaintenance, useCreateMaintenanceRequest, useResolveMaintenanceRequest, useCreateBus } from '../hooks/useFleet';
import '../styles/dashboard.css';

const FleetManagementPage = ({ user, onSignOut }) => {
  const [busPage, setBusPage] = useState(1);
  const [maintPage, setMaintPage] = useState(1);
  const itemsPerPage = 10;

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: busesResponse, isLoading: isBusesLoading, error: busesError } = useBuses({ page: busPage, perPage: itemsPerPage });
  const rawBuses = busesResponse?.data ?? [];
  const busesMeta = busesResponse?.meta ?? busesResponse ?? {};
  const { data: maintResponse, isLoading: isMaintLoading, error: maintError } = usePendingMaintenance({ page: maintPage, perPage: itemsPerPage, search: debouncedSearch });
  const maintenanceData = maintResponse?.data ?? [];
  const maintMeta = maintResponse?.meta ?? maintResponse ?? {};
  
  const createMaintenanceMutation = useCreateMaintenanceRequest();
  const resolveMaintenanceMutation = useResolveMaintenanceRequest();
  const createBusMutation = useCreateBus();

  const isLoading = isBusesLoading || isMaintLoading;
  const error = busesError ? (busesError.message || String(busesError)) : (maintError ? (maintError.message || String(maintError)) : null);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);

  // New Repair Form State
  const [newBusId, setNewBusId] = useState('');
  const [newIssue, setNewIssue] = useState('');
  const [newPriority, setNewPriority] = useState('Medium'); // High | Medium | Low
  const [newCategories, setNewCategories] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [photoInput, setPhotoInput] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const availableCategories = ['Brakes', 'Engine', 'Transmission', 'Electrical', 'HVAC', 'Tires', 'Body/Exterior'];

  const toggleCategory = (cat) => {
    setNewCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleAddPhoto = (e) => {
    if (e) e.preventDefault();
    if (photoInput.trim()) {
      setNewPhotos(prev => [...prev, photoInput.trim()]);
      setPhotoInput('');
    }
  };

  const handleRemovePhoto = (index) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // New Bus Form State
  const [busNumber, setBusNumber] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [busCapacity, setBusCapacity] = useState('60');
  const [busModel, setBusModel] = useState('');
  const [busManufacturer, setBusManufacturer] = useState('');
  const [busYear, setBusYear] = useState(new Date().getFullYear().toString());
  const [busMileage, setBusMileage] = useState('0');
  const [busErrors, setBusErrors] = useState({});

  // Update Repair Form State
  const [updateIssue, setUpdateIssue] = useState('');
  const [updatePriority, setUpdatePriority] = useState('Medium');

  const fleet = useMemo(() => {
    return rawBuses.map(b => ({
      id: `#${b.bus_number}`,
      capacity: b.capacity,
      status: b.availability_status ? (b.availability_status.charAt(0).toUpperCase() + b.availability_status.slice(1)) : 'Active'
    }));
  }, [rawBuses]);

  const repairs = useMemo(() => {
    return maintenanceData.map(r => {
      const matched = rawBuses.find(b => b.bus_id === r.bus_id);
      const busNum = matched ? `#${matched.bus_number}` : `#Bus-${r.bus_id}`;
      const priorityVal = r.priority || 'Medium';
      const formattedDate = r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) : 'Oct 24, 2023';

      const targetMongoId = r._id || r.id || (typeof r.id === 'string' ? r.id : null);
      return {
        id: busNum,
        issue: r.issue,
        priority: priorityVal,
        date: formattedDate,
        mongo_id: targetMongoId,
        bus_id: r.bus_id,
      };
    });
  }, [maintenanceData, rawBuses]);

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

  const filteredRepairs = repairs;

  // Handle Log New Repair
  const validateForm = () => {
    const errors = {};
    if (!newBusId || !String(newBusId).trim()) {
      errors.busId = 'Please select a bus';
    }
    if (!newIssue.trim()) errors.issue = 'Issue description is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddRepair = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const selectedBus = rawBuses.find(b => String(b.bus_id) === String(newBusId) || String(b.bus_number) === String(newBusId));
      const busIdVal = selectedBus ? selectedBus.bus_id : (Number(newBusId) || newBusId);

      const requestData = {
        bus_id: busIdVal,
        driver_id: user?.user_id || 2,
        issue: newIssue.trim(),
        priority: newPriority,
        categories: newCategories,
        photos: newPhotos,
        diagnostic_details: odometerReading ? { odometer: Number(odometerReading) } : null,
      };

      await createMaintenanceMutation.mutateAsync(requestData);
      closeAddModal();
    } catch (err) {
      setFormErrors(prev => ({ ...prev, submit: err.message || 'Failed to submit maintenance request' }));
    }
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
    alert('Updating pending maintenance details is not supported by the backend. Please resolve the request and create a new request if needed.');
    closeUpdateModal();
  };

  const handleResolveRepair = async () => {
    if (!selectedRepair) return;
    const targetId = selectedRepair.mongo_id || selectedRepair.id;
    if (!targetId) {
      alert('Error: Missing MongoDB record identifier for this repair request.');
      return;
    }

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await resolveMaintenanceMutation.mutateAsync({
        mongoId: targetId,
        repairData: {
          repair_details: `Resolved issue: ${selectedRepair.issue}`,
          repair_cost: 0,
          repair_date: todayStr
        }
      });
      closeUpdateModal();
    } catch (err) {
      alert(err.message || 'Failed to resolve maintenance request');
    }
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewBusId('');
    setNewIssue('');
    setNewPriority('Medium');
    setNewCategories([]);
    setNewPhotos([]);
    setPhotoInput('');
    setOdometerReading('');
    setFormErrors({});
  };

  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedRepair(null);
    setUpdateIssue('');
    setUpdatePriority('Medium');
  };

  const validateBusForm = () => {
    const errors = {};
    const bNum = String(busNumber || '').trim();
    const pNum = String(plateNumber || '').trim();
    const cap = String(busCapacity || '').trim();
    const yr = String(busYear || '').trim();
    const mil = String(busMileage || '').trim();

    if (!bNum) errors.busNumber = 'Bus Number is required';
    if (!pNum) errors.plateNumber = 'Plate Number is required';
    if (!cap) {
      errors.busCapacity = 'Capacity is required';
    } else if (isNaN(cap) || parseInt(cap, 10) < 1) {
      errors.busCapacity = 'Capacity must be at least 1';
    }
    if (yr && (isNaN(yr) || parseInt(yr, 10) < 1900 || parseInt(yr, 10) > 2100)) {
      errors.busYear = 'Enter a valid year (1900 - 2100)';
    }
    if (mil && (isNaN(mil) || parseInt(mil, 10) < 0)) {
      errors.busMileage = 'Mileage must be 0 or more';
    }
    setBusErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddBus = async (e) => {
    e.preventDefault();
    if (!validateBusForm()) return;

    try {
      const busData = {
        bus_number: String(busNumber).trim(),
        plate_number: String(plateNumber).trim(),
        capacity: parseInt(busCapacity, 10),
        model: busModel ? String(busModel).trim() : undefined,
        manufacturer: busManufacturer ? String(busManufacturer).trim() : undefined,
        year: busYear && String(busYear).trim() ? parseInt(busYear, 10) : undefined,
        mileage: busMileage && String(busMileage).trim() ? parseInt(busMileage, 10) : 0,
        availability_status: 'Available',
      };

      await createBusMutation.mutateAsync(busData);
      closeBusModal();
    } catch (err) {
      const fieldErrors = {};
      if (err.data?.errors) {
        if (err.data.errors.bus_number) fieldErrors.busNumber = err.data.errors.bus_number[0];
        if (err.data.errors.plate_number) fieldErrors.plateNumber = err.data.errors.plate_number[0];
        if (err.data.errors.capacity) fieldErrors.busCapacity = err.data.errors.capacity[0];
        if (err.data.errors.year) fieldErrors.busYear = err.data.errors.year[0];
        if (err.data.errors.mileage) fieldErrors.busMileage = err.data.errors.mileage[0];
        if (err.data.errors.model) fieldErrors.busModel = err.data.errors.model[0];
        if (err.data.errors.manufacturer) fieldErrors.busManufacturer = err.data.errors.manufacturer[0];
      }
      setBusErrors({
        ...fieldErrors,
        submit: err.data?.message || err.message || 'Failed to add bus to the fleet',
      });
    }
  };

  const closeBusModal = () => {
    setIsBusModalOpen(false);
    setBusNumber('');
    setPlateNumber('');
    setBusCapacity('60');
    setBusModel('');
    setBusManufacturer('');
    setBusYear(new Date().getFullYear().toString());
    setBusMileage('0');
    setBusErrors({});
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
          <Link to="/fleet" className="sidebar-link is-active">
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
          <Link to="/telemetry" className="sidebar-link">
            <Activity size={18} />
            Telemetry
          </Link>
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
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                className="add-user-btn"
                onClick={() => setIsBusModalOpen(true)}
                style={{ backgroundColor: 'var(--text-dark)' }}
              >
                <Plus size={16} />
                Add Bus
              </button>
              <button 
                type="button" 
                className="add-user-btn"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus size={16} />
                Log New Repair
              </button>
            </div>
          </div>

          {/* Bento Stats Cards */}
          <div className="bento-grid">
            <div className="bento-card">
              <p className="bento-card-title">Total Buses</p>
              <p className="bento-card-value">{busesMeta.total || rawBuses.length}</p>
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
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '32px', gridColumn: '1 / -1', color: 'var(--primary-brand)' }}>
                  <div className="ui-button-spinner" style={{ display: 'inline-block', borderTopColor: 'var(--primary-brand)', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }} />
                  <span style={{ marginLeft: '8px', verticalAlign: 'middle' }}>Loading fleet...</span>
                </div>
              ) : error ? (
                <div style={{ textAlign: 'center', padding: '32px', gridColumn: '1 / -1', color: '#dc2626' }}>
                  Error loading fleet: {error}
                </div>
              ) : fleet.length > 0 ? (
                fleet.map((bus) => (
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
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', gridColumn: '1 / -1', color: 'var(--icon-color)' }}>
                No active fleet vehicles found.
              </div>
            )}
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
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--primary-brand)' }}>
                        <div className="ui-button-spinner" style={{ display: 'inline-block', borderTopColor: 'var(--primary-brand)', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }} />
                        <span style={{ marginLeft: '8px', verticalAlign: 'middle' }}>Loading repairs...</span>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#dc2626' }}>
                        Error loading repairs: {error}
                      </td>
                    </tr>
                  ) : filteredRepairs.length > 0 ? (
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

            <Pagination
              currentPage={maintPage}
              lastPage={maintMeta.last_page || 1}
              total={maintMeta.total || 0}
              perPage={itemsPerPage}
              onChange={setMaintPage}
              label="maintenance entries"
            />
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
                {formErrors.submit && (
                  <div style={{ color: '#ef4444', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
                    {formErrors.submit}
                  </div>
                )}
                <div className="select-input-wrapper" style={{ marginBottom: '16px' }}>
                  <label htmlFor="busId" className="ui-input-label">Select Bus</label>
                  <select
                    id="busId"
                    className={`select-input ${formErrors.busId ? 'is-invalid' : ''}`}
                    value={newBusId}
                    onChange={(e) => setNewBusId(e.target.value)}
                  >
                    <option value="">
                      {isBusesLoading ? 'Loading buses...' : '-- Select a Bus --'}
                    </option>
                    {rawBuses.map((bus) => (
                      <option key={bus.bus_id || bus._id || bus.bus_number} value={bus.bus_id}>
                        Bus #{bus.bus_number} {bus.model ? `(${bus.model})` : ''} {bus.plate_number ? `- ${bus.plate_number}` : (bus.license_plate ? `- ${bus.license_plate}` : '')}
                      </option>
                    ))}
                  </select>
                  {formErrors.busId && (
                    <span className="ui-input-error">{formErrors.busId}</span>
                  )}
                </div>

                <Input
                  label="Issue Description"
                  id="issue"
                  placeholder="e.g. Transmission fluid leak detected during morning inspection."
                  value={newIssue}
                  onChange={(e) => setNewIssue(e.target.value)}
                  error={formErrors.issue}
                  iconLeft={<AlertTriangle size={18} />}
                />

                <div className="select-input-wrapper" style={{ marginBottom: '16px' }}>
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

                <div className="select-input-wrapper" style={{ marginBottom: '16px' }}>
                  <label className="ui-input-label">Affected Vehicle Systems (MongoDB Document Array)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                    {availableCategories.map((cat) => {
                      const isSelected = newCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '16px',
                            border: isSelected ? '1px solid #00236f' : '1px solid #cbd5e1',
                            backgroundColor: isSelected ? '#00236f' : '#f8fafc',
                            color: isSelected ? '#ffffff' : '#334155',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {isSelected ? `✓ ${cat}` : `+ ${cat}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Input
                  label="Diagnostic Odometer Reading (Optional Telemetry)"
                  id="odometer"
                  type="number"
                  placeholder="e.g. 45200"
                  value={odometerReading}
                  onChange={(e) => setOdometerReading(e.target.value)}
                />

                <div className="select-input-wrapper" style={{ marginBottom: '16px' }}>
                  <label htmlFor="photoInput" className="ui-input-label">Damage Evidence Photo URLs (MongoDB Embedded Array)</label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <input
                      id="photoInput"
                      type="url"
                      className="select-input"
                      placeholder="https://example.com/damage-photo.jpg"
                      value={photoInput}
                      onChange={(e) => setPhotoInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPhoto(); } }}
                    />
                    <button
                      type="button"
                      onClick={handleAddPhoto}
                      style={{
                        padding: '0 16px',
                        backgroundColor: '#00236f',
                        color: '#fff',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '13px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Add Photo
                    </button>
                  </div>
                  {newPhotos.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {newPhotos.map((url, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>📷 {url}</span>
                          <button type="button" onClick={() => handleRemovePhoto(idx)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <footer className="modal-footer">
                <button 
                  type="button" 
                  className="action-btn"
                  onClick={closeAddModal}
                  disabled={createMaintenanceMutation.isPending}
                >
                  Cancel
                </button>
                <Button 
                  type="submit"
                  disabled={createMaintenanceMutation.isPending}
                  isLoading={createMaintenanceMutation.isPending}
                >
                  {createMaintenanceMutation.isPending ? 'Logging Repair...' : 'Log Repair'}
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
                <Button 
                  type="button" 
                  disabled={resolveMaintenanceMutation.isPending}
                  isLoading={resolveMaintenanceMutation.isPending}
                  onClick={handleResolveRepair}
                  style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: '#ffffff', width: 'auto' }}
                >
                  {resolveMaintenanceMutation.isPending ? 'Resolving...' : 'Mark Resolved'}
                </Button>

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

      {/* Add New Bus Modal */}
      {isBusModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <header className="modal-header">
              <h2>Add New Fleet Vehicle</h2>
              <button type="button" className="modal-close-btn" onClick={closeBusModal}>
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleAddBus}>
              <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                {busErrors.submit && (
                  <div style={{ color: '#ef4444', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', textAlign: 'left' }}>
                    {busErrors.submit}
                  </div>
                )}

                <div className="modal-section-title">Required Details</div>
                <div className="modal-row-2col">
                  <Input
                    label="Bus Number"
                    id="busNumber"
                    placeholder="e.g. 201-A"
                    value={busNumber}
                    onChange={(e) => setBusNumber(e.target.value)}
                    error={busErrors.busNumber}
                    iconLeft={<Bus size={18} />}
                    required
                  />
                  <Input
                    label="Plate Number"
                    id="plateNumber"
                    placeholder="e.g. PP-1234"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    error={busErrors.plateNumber}
                    iconLeft={<FileText size={18} />}
                    required
                  />
                </div>

                <div className="modal-row-2col" style={{ marginTop: '12px' }}>
                  <Input
                    label="Capacity"
                    id="busCapacity"
                    type="number"
                    placeholder="e.g. 60"
                    value={busCapacity}
                    onChange={(e) => setBusCapacity(e.target.value)}
                    error={busErrors.busCapacity}
                    iconLeft={<Users size={18} />}
                    required
                  />
                  <Input
                    label="Odometer Mileage"
                    id="busMileage"
                    type="number"
                    placeholder="e.g. 12000"
                    value={busMileage}
                    onChange={(e) => setBusMileage(e.target.value)}
                    error={busErrors.busMileage}
                    iconLeft={<Wrench size={18} />}
                  />
                </div>

                <div className="modal-section-title" style={{ marginTop: '16px' }}>Optional Vehicle Specs</div>
                <div className="modal-row-2col">
                  <Input
                    label="Manufacturer"
                    id="busManufacturer"
                    placeholder="e.g. Blue Bird"
                    value={busManufacturer}
                    onChange={(e) => setBusManufacturer(e.target.value)}
                    error={busErrors.busManufacturer}
                  />
                  <Input
                    label="Model"
                    id="busModel"
                    placeholder="e.g. All American"
                    value={busModel}
                    onChange={(e) => setBusModel(e.target.value)}
                    error={busErrors.busModel}
                  />
                </div>

                <div className="modal-row-2col" style={{ marginTop: '12px' }}>
                  <Input
                    label="Year"
                    id="busYear"
                    type="number"
                    placeholder="e.g. 2020"
                    value={busYear}
                    onChange={(e) => setBusYear(e.target.value)}
                    error={busErrors.busYear}
                  />
                </div>
              </div>

              <footer className="modal-footer">
                <button 
                  type="button" 
                  className="action-btn"
                  onClick={closeBusModal}
                  disabled={createBusMutation.isPending}
                >
                  Cancel
                </button>
                <Button 
                  type="submit"
                  disabled={createBusMutation.isPending}
                  isLoading={createBusMutation.isPending}
                >
                  {createBusMutation.isPending ? 'Adding Bus...' : 'Add Bus'}
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManagementPage;
