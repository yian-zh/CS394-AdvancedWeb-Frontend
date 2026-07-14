import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  Bus, Users, LogOut, Search, Plus, 
  SlidersHorizontal, Download, ChevronLeft, MapPin, 
  GraduationCap, Check, X, ArrowLeft, User, Trash2, GripVertical
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import { useRoutes } from '../hooks/useRoutes';
import '../styles/dashboard.css';

const ROUTE_DETAILS = {
  'route-1': {
    name: 'Route 1 - Phnom Penh Central',
    busId: '#402-A',
    driver: 'Sarah Jenkins',
    capacityUsed: 45,
    capacityTotal: 60,
    stops: [
      { id: 1, name: 'Wat Phnom', address: 'Preah Norodom Blvd', type: 'stop' },
      { id: 2, name: 'Central Market (Phsar Thmey)', address: 'Calmette St', type: 'stop' },
      { id: 3, name: 'Independence Monument', address: 'Sihanouk Blvd', type: 'stop' },
      { id: 4, name: 'Diamond Island (Koh Pich)', address: 'Tonle Bassac', type: 'stop' },
      { id: 5, name: 'Aeon Mall Phnom Penh', address: 'Sothearos Blvd', type: 'stop' },
      { id: 6, name: 'Royal University of Phnom Penh', address: 'Russian Blvd', type: 'arrival' }
    ],
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d31271.21157297371!2d104.897258!3d11.558778!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e0!4m5!1s0x310951448b111165%3A0x6442654c60205842!2sWat+Phnom%2C+Phnom+Penh!3m2!1d11.5760835!2d104.9230554!4m5!1s0x3109513e9a7e6b7b%3A0xe54e6012e8fb7a3!2sCentral+Market%2C+Phnom+Penh!3m2!1d11.5695535!2d104.9210271!5e0!3m2!1sen!2s!4v1719914375000!5m2!1sen!2s'
  },
  'route-12': {
    name: 'Route 12 - South District',
    busId: '#108',
    driver: 'Elena Rodriguez',
    capacityUsed: 48,
    capacityTotal: 52,
    stops: [
      { id: 1, name: 'Tuol Sleng Genocide Museum', address: 'St 113, Phnom Penh', type: 'stop' },
      { id: 2, name: 'Russian Market', address: 'St 163, Phnom Penh', type: 'stop' },
      { id: 3, name: 'Aeon Mall Mean Chey', address: 'Hun Sen Blvd, Phnom Penh', type: 'stop' },
      { id: 4, name: 'ISPP - International School', address: 'Hun Sen Blvd, Phnom Penh', type: 'arrival' }
    ],
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15636.568478440078!2d104.9080765!3d11.54228945!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3109513cd77ff535%3A0x89eeebec3a42eb2!2sTuol%20Sleng%20Genocide%20Museum!5e0!3m2!1sen!2skh!4v1719914400000!5m2!1sen!2skh'
  },
  'route-31': {
    name: 'Route 31 - Central Special Ed',
    busId: '#S-14',
    driver: 'David Vance',
    capacityUsed: 14,
    capacityTotal: 15,
    stops: [
      { id: 1, name: 'Wat Phnom', address: 'Preah Norodom Blvd', type: 'stop' },
      { id: 2, name: 'National Museum of Cambodia', address: 'Preah Ang Eng St', type: 'stop' },
      { id: 3, name: 'Royal University of Fine Arts', address: 'St 19, Phnom Penh', type: 'arrival' }
    ],
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3908.7706603126786!2d104.9257252!3d11.5682919!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31095138e6ff3e3b%3A0xa64aa27d2c70da0!2sNational%20Museum%20of%20Cambodia!5e0!3m2!1sen!2skh!4v1719914500000!5m2!1sen!2skh'
  },
  'route-42': {
    name: 'Route 42 - North Campus',
    busId: '#402',
    driver: 'Marcus Sterling',
    capacityUsed: 32,
    capacityTotal: 45,
    stops: [
      { id: 1, name: 'Phnom Penh International Airport', address: 'Russian Blvd', type: 'stop' },
      { id: 2, name: 'Royal University of Phnom Penh', address: 'Russian Blvd', type: 'stop' },
      { id: 3, name: 'Institute of Technology of Cambodia', address: 'Russian Blvd', type: 'arrival' }
    ],
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3908.68307481285!2d104.887258!3d11.574678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3109519fe4055555%3A0x2fca62d64024220!2sPhnom%20Penh%20International%20Airport!5e0!3m2!1sen!2skh!4v1719914600000!5m2!1sen!2skh'
  }
};

const INITIAL_DRIVERS = [
  { id: 'Robert Miller', number: '#8829', license: 'Class A CDL', expiry: '10/24', status: 'Available', avatar: 'RM' },
  { id: 'Sarah Jenkins', number: '#7741', license: 'Class B CDL', expiry: '12/25', status: 'Assigned', avatar: 'SJ' },
  { id: 'David Chen', number: '#9012', license: 'Class A CDL', expiry: '05/26', status: 'On Leave', avatar: 'DC' }
];

const RouteDetailPage = ({ user, onSignOut, fleet, setFleet }) => {
  const { routeId } = useParams();
  const currentRoute = ROUTE_DETAILS[routeId] || ROUTE_DETAILS['route-1'];

  const { data: rawRoutes = [], isLoading: isQueryLoading, error: queryError } = useRoutes();
  const [stops, setStops] = useState([]);
  const [selectedStopId, setSelectedStopId] = useState(1);
  const [activeDriver, setActiveDriver] = useState('');
  const [capacityUsed, setCapacityUsed] = useState(0);
  const [capacityTotal, setCapacityTotal] = useState(60);

  const isLoading = isQueryLoading && stops.length === 0;
  const error = queryError ? queryError.message : null;

  // Sync details state with routeId param changes
  useEffect(() => {
    if (rawRoutes.length > 0) {
      const matched = rawRoutes.find(r => String(r.route_id) === routeId || `route-${r.route_id}` === routeId);
      if (matched) {
        const uiStops = [];
        uiStops.push({ id: 'start', name: matched.start_location, address: matched.start_location, type: 'stop' });
        
        if (matched.students) {
          matched.students.forEach((s) => {
            uiStops.push({
              id: String(s.student_id),
              name: `${s.first_name} ${s.last_name}'s Pick-up`,
              address: s.pickup_add || 'Pick-up Address',
              type: 'stop'
            });
          });
        }
        
        uiStops.push({ id: 'end', name: matched.end_location, address: matched.end_location, type: 'arrival' });

        setStops(uiStops);
        setSelectedStopId(uiStops[0]?.id || 'start');
        setActiveDriver(matched.driver ? `${matched.driver.first_name} ${matched.driver.last_name}` : 'Sarah Jenkins');
        setCapacityUsed(matched.students ? matched.students.length : 0);
      } else {
        // Fallback to mock data if route not found in API list
        setStops(currentRoute.stops);
        setSelectedStopId(currentRoute.stops[0]?.id || 1);
        setActiveDriver(currentRoute.driver);
        setCapacityUsed(currentRoute.capacityUsed);
        setCapacityTotal(currentRoute.capacityTotal);
      }
    } else if (!isQueryLoading) {
      // Fallback to mock data if query loaded but no backend records exist
      setStops(currentRoute.stops);
      setSelectedStopId(currentRoute.stops[0]?.id || 1);
      setActiveDriver(currentRoute.driver);
      setCapacityUsed(currentRoute.capacityUsed);
      setCapacityTotal(currentRoute.capacityTotal);
    }
  }, [rawRoutes, isQueryLoading, routeId, currentRoute]);

  // Modal triggers
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [stopToDelete, setStopToDelete] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Modal form states
  const [newStopName, setNewStopName] = useState('');
  const [newStopAddress, setNewStopAddress] = useState('');
  const [insertIndex, setInsertIndex] = useState(null);

  const [newStudentName, setNewStudentName] = useState('');
  const [selectedStudentStopId, setSelectedStudentStopId] = useState('');

  const [driverSearch, setDriverSearch] = useState('');

  const handleAssignDriver = (driverName) => {
    setActiveDriver(driverName);
    
    // Save to local storage overrides for Bus #402-A
    const saved = localStorage.getItem('bus_override_#402-A');
    let parsed = {};
    if (saved) {
      parsed = JSON.parse(saved);
    }
    parsed.driver = driverName;
    localStorage.setItem('bus_override_#402-A', JSON.stringify(parsed));

    // Update the fleet list status if needed
    const updatedFleet = fleet.map(b => {
      if (b.id === '#402-A') {
        return { ...b, driver: driverName };
      }
      return b;
    });
    setFleet(updatedFleet);

    setIsDriverModalOpen(false);
  };

  const handleAddStop = (e) => {
    e.preventDefault();
    if (!newStopName.trim() || !newStopAddress.trim()) return;

    const newId = Math.max(...stops.map(s => s.id)) + 1;
    const newStop = {
      id: newId,
      name: newStopName.trim(),
      address: newStopAddress.trim(),
      type: 'stop'
    };

    let updatedStops = [...stops];
    if (insertIndex !== null) {
      updatedStops.splice(insertIndex, 0, newStop);
    } else {
      // Insert right before arrival stop
      const arrivalIdx = updatedStops.findIndex(s => s.type === 'arrival');
      if (arrivalIdx !== -1) {
        updatedStops.splice(arrivalIdx, 0, newStop);
      } else {
        updatedStops.push(newStop);
      }
    }

    setStops(updatedStops);
    setNewStopName('');
    setNewStopAddress('');
    setInsertIndex(null);
    setIsStopModalOpen(false);
  };

  const handleAddStudent = (e) => {
    e.preventDefault();
    if (!newStudentName.trim() || !selectedStudentStopId) return;

    // Simulate adding a student to a stop
    alert(`Successfully registered student "${newStudentName.trim()}" to pick-up stop.`);
    setNewStudentName('');
    setSelectedStudentStopId('');
    setIsStudentModalOpen(false);
  };

  const handleDeleteStop = () => {
    if (!stopToDelete) return;
    const stopId = stopToDelete.id;
    const updatedStops = stops.filter(s => s.id !== stopId);
    setStops(updatedStops);
    if (selectedStopId === stopId) {
      if (updatedStops.length > 0) {
        setSelectedStopId(updatedStops[0].id);
      } else {
        setSelectedStopId(null);
      }
    }
    setStopToDelete(null);
    setIsDeleteConfirmModalOpen(false);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    if (stops[draggedIndex].type === 'arrival' || stops[index].type === 'arrival') return;

    const updatedStops = [...stops];
    const temp = updatedStops[draggedIndex];
    updatedStops.splice(draggedIndex, 1);
    updatedStops.splice(index, 0, temp);
    setDraggedIndex(index);
    setStops(updatedStops);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const openInsertStopModal = (index) => {
    setInsertIndex(index);
    setIsStopModalOpen(true);
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

  // Google Maps Dynamic URL based on selected stop
  const getMapUrl = () => {
    const selectedStop = stops.find(s => s.id === selectedStopId);
    if (selectedStop) {
      // Keyless dynamic map search points to Phnom Penh stop address
      return `https://www.google.com/maps?q=${encodeURIComponent(selectedStop.name + ', Phnom Penh')}&z=16&output=embed`;
    }
    // Default route view of Phnom Penh
    return currentRoute.mapUrl;
  };

  const filteredDrivers = INITIAL_DRIVERS.filter(d => 
    d.id.toLowerCase().includes(driverSearch.toLowerCase()) ||
    d.number.includes(driverSearch)
  );

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
          <div className="detail-navbar-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to="/logistics" className="back-arrow-link" style={{ color: 'var(--icon-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(197, 197, 211, 0.3)', backgroundColor: '#ffffff', transition: 'all 0.2s' }}>
              <ArrowLeft size={16} />
            </Link>
            <h2 className="top-navbar-title" style={{ fontSize: '18px', fontWeight: 700 }}>{currentRoute.name}</h2>
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
          {/* Header Action Grid */}
          <div className="canvas-header" style={{ alignItems: 'flex-start' }}>
            <div className="header-text-container" style={{ textAlign: 'left' }}>
              <h1 className="canvas-title" style={{ fontSize: '28px', margin: 0 }}>{currentRoute.name} Logistics</h1>
              <p className="canvas-subtitle" style={{ fontSize: '14px' }}>
                Route Stop sequence and dynamic assignment planner for Phnom Penh District.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                className="add-user-btn"
                onClick={() => openInsertStopModal(null)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} />
                Add Stop
              </button>
              <button 
                type="button" 
                className="add-user-btn"
                onClick={() => setIsDriverModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} />
                Add Driver
              </button>
              <button 
                type="button" 
                className="add-user-btn"
                onClick={() => setIsStudentModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} />
                Add Student
              </button>
            </div>
          </div>

          {/* Logistics Workspace Grid */}
          <div className="bus-detail-grid" style={{ gridTemplateColumns: '1.2fr 1.5fr', marginTop: '16px' }}>
            {/* Left Column: Stops Sequence */}
            <div className="detail-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 className="detail-card-title">
                <MapPin size={16} />
                STOP SEQUENCE PLANNER
              </h3>
              
              <div className="stops-sequence-list" style={{ position: 'relative', paddingLeft: '8px' }}>
                {stops.map((stop, index) => {
                  const isArrival = stop.type === 'arrival';
                  const isSelected = selectedStopId === stop.id;

                  return (
                    <div key={stop.id} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                      {/* Connector Plus Icon (above card, except first stop) */}
                      {index > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
                          <button 
                            type="button"
                            className="insert-stop-connector-btn"
                            onClick={() => openInsertStopModal(index)}
                            title="Insert Stop Here"
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              color: '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              zIndex: 10,
                              fontSize: '12px',
                              padding: 0,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Plus size={12} strokeWidth={3} />
                          </button>
                        </div>
                      )}

                      {/* Stop Sequence Item Card */}
                      <div 
                        onClick={() => setSelectedStopId(stop.id)}
                        className={`stop-card ${isSelected ? 'is-selected' : ''}`}
                        draggable={!isArrival}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          padding: '16px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid var(--primary-brand)' : '1px solid rgba(197, 197, 211, 0.3)',
                          backgroundColor: isSelected ? 'rgba(0, 35, 111, 0.02)' : '#ffffff',
                          cursor: isArrival ? 'pointer' : (draggedIndex === index ? 'grabbing' : 'grab'),
                          transition: 'all 0.2s',
                          textAlign: 'left',
                          boxShadow: isSelected ? '0 4px 12px rgba(0, 35, 111, 0.05)' : 'none',
                          opacity: draggedIndex === index ? 0.4 : 1
                        }}
                      >
                        {/* Drag Handle Indicator */}
                        {!isArrival && (
                          <div style={{ color: 'var(--icon-color)', display: 'flex', alignItems: 'center', cursor: 'grab', marginRight: '-4px' }}>
                            <GripVertical size={16} />
                          </div>
                        )}
                        {/* Index Indicator Circle */}
                        <div 
                          className="stop-index-circle"
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: isArrival ? '#f1f5f9' : (isSelected ? 'var(--primary-brand)' : 'var(--bg-light)'),
                            color: isArrival ? '#475569' : (isSelected ? '#ffffff' : 'var(--primary-brand)'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '14px',
                            flexShrink: 0
                          }}
                        >
                          {isArrival ? <GraduationCap size={16} /> : index + 1}
                        </div>

                        {/* Location Details */}
                        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-dark)' }}>
                            {stop.name}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--icon-color)', marginTop: '2px' }}>
                            {stop.address}
                          </span>
                        </div>

                        {isArrival && (
                          <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            ARRIVAL
                          </span>
                        )}

                        {!isArrival && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStopToDelete(stop);
                              setIsDeleteConfirmModalOpen(true);
                            }}
                            className="delete-stop-btn"
                            title="Delete Stop"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Map Embed & Widget Overlay */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div 
                className="bus-image-container"
                style={{ 
                  height: '520px', 
                  position: 'relative', 
                  overflow: 'hidden', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                  border: '1px solid rgba(197, 197, 211, 0.3)'
                }}
              >
                {/* Embedded Interactive Google Map */}
                <iframe
                  title="Route stops Map"
                  src={getMapUrl()}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>

                {/* Status Overlay Widget (Bottom Right) */}
                <div 
                  className="map-status-overlay"
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    right: '16px',
                    left: '16px',
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    padding: '16px',
                    boxShadow: '0 10px 25px rgba(20, 27, 43, 0.15)',
                    border: '1px solid rgba(197, 197, 211, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(0, 35, 111, 0.06)', color: 'var(--primary-brand)' }}>
                        <Bus size={18} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-brand)' }}>
                          Bus {currentRoute.busId}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--icon-color)' }}>
                          Driver: {activeDriver}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', backgroundColor: '#dcfce7', padding: '3px 8px', borderRadius: '4px' }}>
                        Scheduled
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: 'var(--icon-color)' }}>
                      <span>Passenger Capacity</span>
                      <span>{capacityUsed} / {capacityTotal} ({Math.round((capacityUsed/capacityTotal)*100)}%)</span>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-fill"
                        style={{ width: `${(capacityUsed/capacityTotal)*100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- Assign Driver to Route Modal --- */}
      {isDriverModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div>
                <h2>Assign Driver to Route</h2>
                <p style={{ fontSize: '12px', color: 'var(--icon-color)', margin: '4px 0 0 0' }}>{currentRoute.name}</p>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setIsDriverModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div className="top-navbar-search" style={{ width: '100%', marginBottom: '12px', border: '1px solid rgba(197, 197, 211, 0.4)' }}>
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search by driver name or ID..."
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '8px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                <span className="modal-section-title" style={{ margin: '0 0 4px 0' }}>AVAILABLE DRIVERS</span>
                {filteredDrivers.map(d => {
                  const getStatusClass = (status) => {
                    switch(status.toLowerCase()) {
                      case 'available': return 'driver-badge-available';
                      case 'assigned': return 'driver-badge-assigned';
                      case 'on leave': return 'driver-badge-leave';
                      default: return '';
                    }
                  };

                  return (
                    <div 
                      key={d.id}
                      onClick={() => d.status !== 'On Leave' && handleAssignDriver(d.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        border: '1px solid rgba(197, 197, 211, 0.2)',
                        borderRadius: '8px',
                        cursor: d.status === 'On Leave' ? 'not-allowed' : 'pointer',
                        opacity: d.status === 'On Leave' ? 0.6 : 1,
                        backgroundColor: '#ffffff',
                        transition: 'all 0.2s'
                      }}
                      className="driver-row-hover"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(0, 35, 111, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--primary-brand)' }}>
                          {d.avatar}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>{d.id}</span>
                          <span style={{ fontSize: '11px', color: 'var(--icon-color)' }}>ID: {d.number} • {d.license} • Exp: {d.expiry}</span>
                        </div>
                      </div>

                      <span className={`driver-status-badge ${getStatusClass(d.status)}`}>
                        {d.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="modal-footer">
              <Button type="button" variant="secondary" onClick={() => setIsDriverModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- Add Stop Modal --- */}
      {isStopModalOpen && (
        <div className="modal-overlay">
          <form onSubmit={handleAddStop} className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2>Add Route Stop</h2>
              <button type="button" className="modal-close-btn" onClick={() => setIsStopModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Stop Location Name</label>
                  <Input 
                    type="text" 
                    placeholder="e.g. Aeon Mall Phnom Penh"
                    value={newStopName}
                    onChange={(e) => setNewStopName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Location Address / Street</label>
                  <Input 
                    type="text" 
                    placeholder="e.g. Sothearos Blvd"
                    value={newStopAddress}
                    onChange={(e) => setNewStopAddress(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <Button type="button" variant="secondary" onClick={() => setIsStopModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Stop
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* --- Add Student Modal --- */}
      {isStudentModalOpen && (
        <div className="modal-overlay">
          <form onSubmit={handleAddStudent} className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2>Register Student to Route</h2>
              <button type="button" className="modal-close-btn" onClick={() => setIsStudentModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Student Full Name</label>
                  <Input 
                    type="text" 
                    placeholder="e.g. Alice Mercer"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    required
                  />
                </div>

                <div className="select-input-wrapper">
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Assign to Pick-up Stop</label>
                  <select 
                    className="select-input" 
                    value={selectedStudentStopId}
                    onChange={(e) => setSelectedStudentStopId(e.target.value)}
                    required
                  >
                    <option value="">Select Stop...</option>
                    {stops.filter(s => s.type !== 'arrival').map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.address})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <Button type="button" variant="secondary" onClick={() => setIsStudentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Register Student
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* --- Delete Confirmation Modal --- */}
      {isDeleteConfirmModalOpen && stopToDelete && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => {
                  setIsDeleteConfirmModalOpen(false);
                  setStopToDelete(null);
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px', textAlign: 'left' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-dark)', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to remove <strong>{stopToDelete.name}</strong> from the stop sequence of Route 1?
              </p>
              <p style={{ fontSize: '12px', color: '#ef4444', margin: '8px 0 0 0', fontWeight: 500 }}>
                This action will update the routing coordinates and passenger stops list.
              </p>
            </div>

            <div className="modal-footer" style={{ backgroundColor: '#fafbfc' }}>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setIsDeleteConfirmModalOpen(false);
                  setStopToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleDeleteStop}
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
              >
                Remove Stop
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteDetailPage;
