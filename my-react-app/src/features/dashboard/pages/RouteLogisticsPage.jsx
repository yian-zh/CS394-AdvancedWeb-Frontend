import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bus, Users, LogOut, Search, Plus, 
  SlidersHorizontal, X, MapPin, 
  GraduationCap, ArrowRight, Clock, Pencil, Check, ChevronDown, Trash2, DollarSign, Activity
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Pagination from '../../../components/ui/Pagination';
import AsyncSelect from '../../../components/ui/AsyncSelect';
import { useDebounce } from '../../../hooks/useDebounce';
import { dashboardService } from '../services/dashboardService';
import { useRoutes, useCreateRoute, useUpdateRoute, useDeleteRoute } from '../hooks/useRoutes';
import { useBuses } from '../hooks/useFleet';
import { useUsers } from '../hooks/useUsers';
import '../styles/dashboard.css';

const DEFAULT_DRIVERS = [];

const TIME_OPTIONS = [
  '06:00 AM', '06:15 AM', '06:30 AM', '06:45 AM',
  '07:00 AM', '07:15 AM', '07:30 AM', '07:45 AM',
  '08:00 AM', '08:15 AM', '08:30 AM', '08:45 AM',
  '09:00 AM', '11:30 AM', '12:00 PM', '01:00 PM',
  '02:30 PM', '03:30 PM', '04:00 PM', '05:00 PM'
];

const PRESET_SHIFTS = [
  { label: '🌅 Morning A', start: '06:45 AM', end: '08:15 AM' },
  { label: '🌅 Morning B', start: '07:00 AM', end: '08:30 AM' },
  { label: '☀️ Mid-Day', start: '11:30 AM', end: '01:00 PM' },
  { label: '🌆 Afternoon', start: '02:30 PM', end: '04:00 PM' }
];

function parseTimeRange(timeWindowStr) {
  if (!timeWindowStr) return null;
  const parts = timeWindowStr.split('-').map(s => s.trim());
  if (parts.length !== 2) return null;

  const parseMinutes = (str) => {
    const match = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const start = parseMinutes(parts[0]);
  const end = parseMinutes(parts[1]);
  if (start === null || end === null) return null;
  return { start, end };
}

function isTimeOverlapping(window1, window2) {
  const range1 = parseTimeRange(window1);
  const range2 = parseTimeRange(window2);
  if (!range1 || !range2) return false;
  return range1.start < range2.end && range2.start < range1.end;
}

const RouteLogisticsPage = ({ user, onSignOut }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: routesResponse, isLoading, error } = useRoutes({ page: currentPage, perPage: itemsPerPage, search: debouncedSearch });
  const rawRoutes = routesResponse?.data ?? [];
  const routesMeta = routesResponse?.meta ?? routesResponse ?? {};
  const { data: busesResponse } = useBuses({ perPage: 200 });
  const rawBuses = busesResponse?.data ?? [];
  const createRouteMutation = useCreateRoute();
  const updateRouteMutation = useUpdateRoute();
  const deleteRouteMutation = useDeleteRoute();
  const [statusFilter, setStatusFilter] = useState('All'); // All | Active | Delayed
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRouteForRename, setSelectedRouteForRename] = useState(null);
  const [selectedRouteForDelete, setSelectedRouteForDelete] = useState(null);
  const [renameInputValue, setRenameInputValue] = useState('');

  // New Route Form State
  const [newRouteName, setNewRouteName] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newBusId, setNewBusId] = useState('');
  const [startTime, setStartTime] = useState('07:00 AM');
  const [endTime, setEndTime] = useState('08:30 AM');
  const [newTimeWindow, setNewTimeWindow] = useState('07:00 AM - 08:30 AM');
  const [newStopsCount, setNewStopsCount] = useState('');
  const [newCapacityTotal, setNewCapacityTotal] = useState('');
  const [newDetail, setNewDetail] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Searchable dropdown states
  const [busSearchQuery, setBusSearchQuery] = useState('');
  const [isBusDropdownOpen, setIsBusDropdownOpen] = useState(false);

  const fetchDrivers = useCallback(async (search) => {
    const data = await dashboardService.getUsers({ search, perPage: 20 });
    return (data?.data ?? []).map(u => ({
      id: u.user_id,
      label: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
      sub: u.phone_number ? `Contact: ${u.phone_number}` : `ID: ${u.user_id}`,
      user_id: u.user_id,
    }));
  }, []);

  const busOptions = useMemo(() => {
    return (rawBuses || []).map(b => ({
      id: `#${b.bus_number}`,
      busNumber: `#${b.bus_number}`,
      capacity: b.capacity || 50,
      status: b.availability_status ? (b.availability_status.charAt(0).toUpperCase() + b.availability_status.slice(1)) : 'Active'
    }));
  }, [rawBuses]);


  const handleSelectStartTime = (time) => {
    setStartTime(time);
    setNewTimeWindow(`${time} - ${endTime}`);
  };

  const handleSelectEndTime = (time) => {
    setEndTime(time);
    setNewTimeWindow(`${startTime} - ${time}`);
  };

  const handleSelectPresetShift = (shift) => {
    setStartTime(shift.start);
    setEndTime(shift.end);
    setNewTimeWindow(`${shift.start} - ${shift.end}`);
  };

  const [routeOverrides, setRouteOverrides] = useState({});

  const routes = useMemo(() => {
    return rawRoutes.map(r => {
      let driverName = 'Unassigned';
      let initials = 'UN';

      const savedDriver = localStorage.getItem(`sbms_route_driver_${r.route_id}`) || localStorage.getItem(`sbms_route_driver_route-${r.route_id}`);
      if (savedDriver) {
        driverName = savedDriver;
        initials = savedDriver.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';
      } else if (r.driver) {
        driverName = `${r.driver.first_name || ''} ${r.driver.last_name || ''}`.trim() || r.driver.username;
        initials = `${(r.driver.first_name || 'D')[0]}${(r.driver.last_name || 'R')[0]}`.toUpperCase();
      } else if (r.driver_id) {
        driverName = `Driver #${r.driver_id}`;
        initials = 'DR';
      }
      const routeIdStr = String(r.route_id);
      const name = routeOverrides[routeIdStr] || r.route_name;
      const savedTimeWindow = localStorage.getItem(`sbms_route_timewindow_${routeIdStr}`) || localStorage.getItem(`sbms_route_timewindow_route-${routeIdStr}`);
      const displayTimeWindow = savedTimeWindow || '07:00 AM - 08:30 AM';

      return {
        id: routeIdStr,
        name: name,
        status: 'Active',
        detail: `${r.start_location} to ${r.end_location}`,
        driver: driverName,
        driverInitials: initials,
        busId: r.buses && r.buses[0] ? `#${r.buses[0].bus_number}` : '#402-A',
        timeWindow: displayTimeWindow,
        stopsCount: r.students ? r.students.length + 2 : 10,
        capacityUsed: r.students ? r.students.length : 12,
        capacityTotal: 60
      };
    });
  }, [rawRoutes, routeOverrides]);

  const busOptionsWithSchedule = useMemo(() => {
    return busOptions.map(b => {
      const assignedRoute = routes.find(r => r.busId === b.busNumber);
      let isOverlapping = false;
      let conflictInfo = null;

      if (assignedRoute && assignedRoute.timeWindow) {
        if (isTimeOverlapping(newTimeWindow, assignedRoute.timeWindow)) {
          isOverlapping = true;
          conflictInfo = `${assignedRoute.name} (${assignedRoute.timeWindow})`;
        }
      }

      return {
        ...b,
        isOverlapping,
        conflictInfo
      };
    });
  }, [busOptions, routes, newTimeWindow]);

  const filteredBusOptions = useMemo(() => {
    if (!busSearchQuery.trim()) return busOptionsWithSchedule;
    const q = busSearchQuery.toLowerCase();
    return busOptionsWithSchedule.filter(b => b.busNumber.toLowerCase().includes(q) || String(b.capacity).includes(q));
  }, [busOptionsWithSchedule, busSearchQuery]);

  const handleAddRoute = async (e) => {
    e.preventDefault();
    if (createRouteMutation.isPending) return;
    if (!newRouteName.trim() || !newDriverName || !newBusId.trim()) return;

    try {
      const driverIdNum = newDriverName?.user_id || newDriverName?.id;

      const routeData = {
        route_name: newRouteName.trim(),
        start_location: 'School',
        end_location: 'School',
        estimated_duration: 45,
        driver_id: driverIdNum || null,
      };

      const result = await createRouteMutation.mutateAsync(routeData);
      const createdRoute = result.route || result;
      const createdId = createdRoute?.route_id || createdRoute?.id;
      if (createdId) {
        localStorage.setItem(`sbms_route_timewindow_${createdId}`, newTimeWindow);
        if (newDriverName) {
          localStorage.setItem(`sbms_route_driver_${createdId}`, newDriverName.label || newDriverName.name);
        }
      }

      setIsAddModalOpen(false);

      // Reset Form
      setNewRouteName('');
      setNewDriverName(null);
      setNewBusId('');
      setStartTime('07:00 AM');
      setEndTime('08:30 AM');
      setNewTimeWindow('07:00 AM - 08:30 AM');
      setNewStopsCount('');
      setNewCapacityTotal('');
      setNewDetail('');
      setFormErrors({});
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to create route' });
    }
  };

  const handleOpenRenameModal = (e, route) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedRouteForRename(route);
    setRenameInputValue(route.name);
    setIsRenameModalOpen(true);
  };

  const handleRenameRouteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRouteForRename || !renameInputValue.trim()) return;

    const newName = renameInputValue.trim();
    const routeId = selectedRouteForRename.id;

    // Instant local UI state update
    setRouteOverrides(prev => ({ ...prev, [routeId]: newName }));

    const numericId = parseInt(routeId, 10);
    if (numericId && !isNaN(numericId)) {
      try {
        await updateRouteMutation.mutateAsync({
          id: numericId,
          routeData: { route_name: newName }
        });
      } catch (err) {
        console.warn('Backend route rename sync note:', err);
      }
    }

    setIsRenameModalOpen(false);
    setSelectedRouteForRename(null);
  };

  const handleOpenDeleteModal = (e, route) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedRouteForDelete(route);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteRouteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRouteForDelete || deleteRouteMutation.isPending) return;

    const routeId = selectedRouteForDelete.id;
    const numericId = parseInt(routeId, 10);

    if (numericId && !isNaN(numericId)) {
      try {
        await deleteRouteMutation.mutateAsync(numericId);
      } catch (err) {
        console.warn('Backend route deletion note:', err);
      }
    }

    setIsDeleteModalOpen(false);
    setSelectedRouteForDelete(null);
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

  // Filter routes based on status tab (search is handled server-side)
  const filteredRoutes = routes.filter(r => {
    const matchesStatus = statusFilter === 'All' || 
                          r.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesStatus;
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
          <Link to="/finance" className="sidebar-link">
            <DollarSign size={18} />
            Finance
          </Link>
          <Link to="/telemetry" className="sidebar-link">
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
                Monitor and manage {(routesMeta.total || routes.length).toLocaleString()} active transportation routes across the district.
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
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '32px', gridColumn: '1 / -1', color: 'var(--primary-brand)' }}>
                <div className="ui-button-spinner" style={{ display: 'inline-block', borderTopColor: 'var(--primary-brand)', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }} />
                <span style={{ marginLeft: '8px', verticalAlign: 'middle' }}>Loading routes...</span>
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '32px', gridColumn: '1 / -1', color: '#dc2626' }}>
                Error loading routes: {error.message || String(error)}
              </div>
            ) : (
              filteredRoutes.map(route => {
                const capPercentage = Math.round((route.capacityUsed / route.capacityTotal) * 100);
              const statusClass = route.status.toLowerCase() === 'active' ? 'route-status-active' : 'route-status-delayed';
              
              return (
                <Link to={`/logistics/${route.id}`} key={route.id} className="route-card">
                  <div className="route-card-header">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexGrow: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 className="route-card-title" style={{ margin: 0 }}>{route.name}</h3>
                        <button
                          type="button"
                          onClick={(e) => handleOpenRenameModal(e, route)}
                          title="Rename Route"
                          style={{
                            background: 'rgba(0, 35, 111, 0.06)',
                            border: '1px solid rgba(0, 35, 111, 0.12)',
                            color: 'var(--primary-brand)',
                            cursor: 'pointer',
                            padding: '4px 6px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 35, 111, 0.15)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 35, 111, 0.06)'}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenDeleteModal(e, route)}
                          title="Delete Route"
                          style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px 6px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.18)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
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
            })
          )}
            
            {!isLoading && filteredRoutes.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px dashed rgba(197, 197, 211, 0.5)', color: 'var(--icon-color)' }}>
                <MapPin size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No routes match your search or filter.</p>
              </div>
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            lastPage={routesMeta.last_page || 1}
            total={routesMeta.total || 0}
            perPage={itemsPerPage}
            onChange={setCurrentPage}
            label="active routes"
          />
        </div>
      </main>

      {/* --- Add Route Modal --- */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsDriverDropdownOpen(false); setIsBusDropdownOpen(false); }}>
          <form onSubmit={handleAddRoute} className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Route</h2>
              <button type="button" className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

             <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {formErrors.submit && (
                  <div style={{ color: '#ef4444', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', textAlign: 'left' }}>
                    {formErrors.submit}
                  </div>
                )}

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

                {/* Driver & Bus ID Searchable Dropdowns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <AsyncSelect
                    label="Driver Name"
                    placeholder="Search driver..."
                    fetchOptions={fetchDrivers}
                    value={newDriverName}
                    onChange={setNewDriverName}
                    getOptionLabel={(opt) => opt.label}
                    getOptionValue={(opt) => opt.id}
                  />

                  {/* Searchable Bus ID Dropdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left', position: 'relative' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Assigned Bus ID</label>
                    <div 
                      onClick={() => {
                        setIsBusDropdownOpen(!isBusDropdownOpen);
                        setIsDriverDropdownOpen(false);
                      }}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(197, 197, 211, 0.5)',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '13px',
                        fontWeight: newBusId ? 600 : 400,
                        color: newBusId ? 'var(--text-dark)' : '#94a3b8'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        <Bus size={15} style={{ color: 'var(--primary-brand)', flexShrink: 0 }} />
                        {newBusId || 'Select Bus...'}
                      </span>
                      <ChevronDown size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                    </div>

                    {isBusDropdownOpen && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        backgroundColor: '#ffffff',
                        border: '1px solid rgba(197, 197, 211, 0.4)',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                        zIndex: 100,
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <Input 
                          type="text" 
                          icon={<Search size={13} />}
                          placeholder="Search bus number..."
                          value={busSearchQuery}
                          onChange={(e) => setBusSearchQuery(e.target.value)}
                          autoFocus
                        />
                        <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                          {filteredBusOptions.length > 0 ? (
                            filteredBusOptions.map(bus => {
                              const isSelected = newBusId === bus.busNumber;
                              const isDisabled = bus.isOverlapping && !isSelected;

                              return (
                                <div
                                  key={bus.id}
                                  onClick={() => {
                                    if (isDisabled) return;
                                    setNewBusId(bus.busNumber);
                                    if (bus.capacity) setNewCapacityTotal(bus.capacity);
                                    setIsBusDropdownOpen(false);
                                    setBusSearchQuery('');
                                  }}
                                  style={{
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: isSelected ? 'rgba(0, 35, 111, 0.06)' : (isDisabled ? '#f8fafc' : 'transparent'),
                                    opacity: isDisabled ? 0.6 : 1,
                                    fontSize: '13px'
                                  }}
                                  title={isDisabled ? `Schedule conflict: ${bus.conflictInfo}` : ''}
                                >
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ fontWeight: 600, color: isDisabled ? '#94a3b8' : 'var(--text-dark)' }}>{bus.busNumber}</span>
                                      {isDisabled && (
                                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#dc2626', backgroundColor: '#fee2e2', padding: '1px 6px', borderRadius: '4px' }}>
                                          ⚠️ Schedule Overlap
                                        </span>
                                      )}
                                    </div>
                                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                                      {isDisabled ? `Conflicts with ${bus.conflictInfo}` : `Cap: ${bus.capacity} seats • ${bus.status}`}
                                    </span>
                                  </div>
                                  {isSelected && <Check size={15} style={{ color: 'var(--primary-brand)' }} />}
                                </div>
                              );
                            })
                          ) : (
                            <div style={{ padding: '8px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>No buses match search</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Intuitive Time Window Picker */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} style={{ color: 'var(--primary-brand)' }} />
                    Time Window ({newTimeWindow})
                  </label>
                  
                  {/* Preset Shift Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {PRESET_SHIFTS.map((shift, idx) => {
                      const isActive = newTimeWindow === `${shift.start} - ${shift.end}`;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPresetShift(shift)}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: isActive ? '1px solid var(--primary-brand)' : '1px solid #cbd5e1',
                            backgroundColor: isActive ? 'rgba(0, 35, 111, 0.08)' : '#f8fafc',
                            color: isActive ? 'var(--primary-brand)' : '#475569',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          {shift.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Start & End Time Dropdowns */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '2px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Start Time</span>
                      <select 
                        value={startTime} 
                        onChange={(e) => handleSelectStartTime(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', backgroundColor: '#ffffff' }}
                      >
                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>End Time</span>
                      <select 
                        value={endTime} 
                        onChange={(e) => handleSelectEndTime(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', backgroundColor: '#ffffff' }}
                      >
                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
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
              <Button type="button" variant="secondary" disabled={createRouteMutation.isPending} onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRouteMutation.isPending || !newRouteName.trim() || !newDriverName.trim() || !newBusId.trim()}>
                {createRouteMutation.isPending ? 'Creating Route...' : 'Create Route'}
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

      {/* --- Rename Route Modal --- */}
      {isRenameModalOpen && selectedRouteForRename && (
        <div className="modal-overlay">
          <form onSubmit={handleRenameRouteSubmit} className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Pencil size={18} style={{ color: 'var(--primary-brand)' }} />
                Rename Route
              </h2>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => {
                  setIsRenameModalOpen(false);
                  setSelectedRouteForRename(null);
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>
                  Route Name
                </label>
                <Input 
                  type="text" 
                  placeholder="e.g. Route 1 - Phnom Penh Express"
                  value={renameInputValue}
                  onChange={(e) => setRenameInputValue(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setIsRenameModalOpen(false);
                  setSelectedRouteForRename(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!renameInputValue.trim()}>
                Save Route Name
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* --- Delete Route Confirmation Modal --- */}
      {isDeleteModalOpen && selectedRouteForDelete && (
        <div className="modal-overlay">
          <form onSubmit={handleDeleteRouteSubmit} className="modal-card" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={18} />
                Delete Route
              </h2>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedRouteForDelete(null);
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px', textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dark)' }}>
                Are you sure you want to delete <strong style={{ color: '#ef4444' }}>{selectedRouteForDelete.name}</strong>?
              </p>
              <p style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                This action will permanently delete the route and all associated student stops from the database.
              </p>
            </div>

            <div className="modal-footer">
              <Button 
                type="button" 
                variant="secondary" 
                disabled={deleteRouteMutation.isPending}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedRouteForDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={deleteRouteMutation.isPending}
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#ffffff' }}
              >
                {deleteRouteMutation.isPending ? 'Deleting Route...' : 'Confirm Delete'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RouteLogisticsPage;
