import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  Bus, Users, LogOut, Search, Plus, 
  SlidersHorizontal, Download, ChevronLeft, MapPin, 
  GraduationCap, Check, X, ArrowLeft, User, Trash2, GripVertical,
  MoreVertical, Pencil, UserPlus
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import { useRoutes, useManageStops, useUpdateRoute } from '../hooks/useRoutes';
import { useStudents } from '../hooks/useStudents';
import LocationPinPicker from '../components/LocationPinPicker';
import RouteOverviewMap from '../components/RouteOverviewMap';
import '../styles/dashboard.css';

function getInitials(name) {
  if (!name) return 'ST';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const PHNOM_PENH_PIN_PRESETS = [
  { id: 'wat-phnom', name: 'Wat Phnom', address: 'Preah Norodom Blvd, Phnom Penh', lat: 11.5760835, lng: 104.9230554, category: 'Landmark' },
  { id: 'central-market', name: 'Central Market (Phsar Thmey)', address: 'Calmette St, Phnom Penh', lat: 11.5695535, lng: 104.9210271, category: 'Market' },
  { id: 'independence-monument', name: 'Independence Monument', address: 'Sihanouk Blvd, Phnom Penh', lat: 11.556278, lng: 104.928222, category: 'Landmark' },
  { id: 'koh-pich', name: 'Diamond Island (Koh Pich)', address: 'Tonle Bassac, Phnom Penh', lat: 11.551800, lng: 104.939800, category: 'District' },
  { id: 'aeon-1', name: 'Aeon Mall Phnom Penh', address: 'Sothearos Blvd, Phnom Penh', lat: 11.547514, lng: 104.935100, category: 'Shopping' },
  { id: 'rupp', name: 'Royal University of Phnom Penh', address: 'Russian Blvd, Phnom Penh', lat: 11.568321, lng: 104.890694, category: 'Education' },
  { id: 'tuol-sleng', name: 'Tuol Sleng Genocide Museum', address: 'St 113, Phnom Penh', lat: 11.542289, lng: 104.908076, category: 'Museum' },
  { id: 'russian-market', name: 'Russian Market', address: 'St 163, Phnom Penh', lat: 11.540700, lng: 104.914500, category: 'Market' },
  { id: 'aeon-mean-chey', name: 'Aeon Mall Mean Chey', address: 'Hun Sen Blvd, Phnom Penh', lat: 11.498100, lng: 104.925200, category: 'Shopping' },
  { id: 'airport', name: 'Phnom Penh International Airport', address: 'Russian Blvd, Phnom Penh', lat: 11.546555, lng: 104.844111, category: 'Transport' },
  { id: 'custom-pin', name: '📍 Custom Pin Coordinates', address: 'Specify manual Lat & Lng', lat: '', lng: '', category: 'Custom' }
];

const ROUTE_DETAILS = {
  'route-1': {
    name: 'Route 1 - Phnom Penh Central',
    busId: '#402-A',
    driver: 'Sarah Jenkins',
    capacityUsed: 7,
    capacityTotal: 60,
    stops: [
      { id: 1, name: 'Wat Phnom', address: 'Preah Norodom Blvd', type: 'stop', lat: 11.5760835, lng: 104.9230554, pinCategory: 'Landmark', students: [{ id: 's1', name: 'Lucas Vance', grade: 'Grade 3', avatar: 'LV' }, { id: 's2', name: 'Sophia Chen', grade: 'Grade 5', avatar: 'SC' }] },
      { id: 2, name: 'Central Market (Phsar Thmey)', address: 'Calmette St', type: 'stop', lat: 11.5695535, lng: 104.9210271, pinCategory: 'Market', students: [{ id: 's3', name: 'Ethan Miller', grade: 'Grade 2', avatar: 'EM' }] },
      { id: 3, name: 'Independence Monument', address: 'Sihanouk Blvd', type: 'stop', lat: 11.556278, lng: 104.928222, pinCategory: 'Landmark', students: [{ id: 's4', name: 'Chloe Sterling', grade: 'Grade 4', avatar: 'CS' }, { id: 's5', name: 'Oliver Jenkins', grade: 'Grade 1', avatar: 'OJ' }] },
      { id: 4, name: 'Diamond Island (Koh Pich)', address: 'Tonle Bassac', type: 'stop', lat: 11.551800, lng: 104.939800, pinCategory: 'District', students: [{ id: 's6', name: 'Emma Watson', grade: 'Grade 6', avatar: 'EW' }] },
      { id: 5, name: 'Aeon Mall Phnom Penh', address: 'Sothearos Blvd', type: 'stop', lat: 11.547514, lng: 104.935100, pinCategory: 'Shopping', students: [{ id: 's7', name: 'Liam Vance', grade: 'Grade 3', avatar: 'LV' }] },
      { id: 6, name: 'Royal University of Phnom Penh', address: 'Russian Blvd', type: 'arrival', lat: 11.568321, lng: 104.890694, pinCategory: 'Education', students: [] }
    ],
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d31271.21157297371!2d104.897258!3d11.558778!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e0!4m5!1s0x310951448b111165%3A0x6442654c60205842!2sWat+Phnom%2C+Phnom+Penh!3m2!1d11.5760835!2d104.9230554!4m5!1s0x3109513e9a7e6b7b%3A0xe54e6012e8fb7a3!2sCentral+Market%2C+Phnom+Penh!3m2!1d11.5695535!2d104.9210271!5e0!3m2!1sen!2s!4v1719914375000!5m2!1sen!2s'
  },
  'route-12': {
    name: 'Route 12 - South District',
    busId: '#108',
    driver: 'Elena Rodriguez',
    capacityUsed: 3,
    capacityTotal: 52,
    stops: [
      { id: 1, name: 'Tuol Sleng Genocide Museum', address: 'St 113, Phnom Penh', type: 'stop', lat: 11.542289, lng: 104.908076, pinCategory: 'Museum', students: [{ id: 's8', name: 'Noah Rodriguez', grade: 'Grade 4', avatar: 'NR' }] },
      { id: 2, name: 'Russian Market', address: 'St 163, Phnom Penh', type: 'stop', lat: 11.540700, lng: 104.914500, pinCategory: 'Market', students: [{ id: 's9', name: 'Mia Vance', grade: 'Grade 2', avatar: 'MV' }] },
      { id: 3, name: 'Aeon Mall Mean Chey', address: 'Hun Sen Blvd, Phnom Penh', type: 'stop', lat: 11.498100, lng: 104.925200, pinCategory: 'Shopping', students: [{ id: 's10', name: 'Aiden Chen', grade: 'Grade 5', avatar: 'AC' }] },
      { id: 4, name: 'ISPP - International School', address: 'Hun Sen Blvd, Phnom Penh', type: 'arrival', lat: 11.512300, lng: 104.926500, pinCategory: 'Education', students: [] }
    ],
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15636.568478440078!2d104.9080765!3d11.54228945!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3109513cd77ff535%3A0x89eeebec3a42eb2!2sTuol%20Sleng%20Genocide%20Museum!5e0!3m2!1sen!2skh!4v1719914400000!5m2!1sen!2skh'
  },
  'route-31': {
    name: 'Route 31 - Central Special Ed',
    busId: '#S-14',
    driver: 'David Vance',
    capacityUsed: 2,
    capacityTotal: 15,
    stops: [
      { id: 1, name: 'Wat Phnom', address: 'Preah Norodom Blvd', type: 'stop', lat: 11.5760835, lng: 104.9230554, pinCategory: 'Landmark', students: [{ id: 's11', name: 'Benjamin Vance', grade: 'Grade 1', avatar: 'BV' }] },
      { id: 2, name: 'National Museum of Cambodia', address: 'Preah Ang Eng St', type: 'stop', lat: 11.5682919, lng: 104.9257252, pinCategory: 'Museum', students: [{ id: 's12', name: 'Charlotte Chen', grade: 'Grade 3', avatar: 'CC' }] },
      { id: 3, name: 'Royal University of Fine Arts', address: 'St 19, Phnom Penh', type: 'arrival', lat: 11.569100, lng: 104.926100, pinCategory: 'Education', students: [] }
    ],
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3908.7706603126786!2d104.9257252!3d11.5682919!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31095138e6ff3e3b%3A0xa64aa27d2c70da0!2sNational%20Museum%20of%20Cambodia!5e0!3m2!1sen!2skh!4v1719914500000!5m2!1sen!2skh'
  },
  'route-42': {
    name: 'Route 42 - North Campus',
    busId: '#402',
    driver: 'Marcus Sterling',
    capacityUsed: 2,
    capacityTotal: 45,
    stops: [
      { id: 1, name: 'Phnom Penh International Airport', address: 'Russian Blvd', type: 'stop', lat: 11.546555, lng: 104.844111, pinCategory: 'Transport', students: [{ id: 's13', name: 'Henry Sterling', grade: 'Grade 5', avatar: 'HS' }] },
      { id: 2, name: 'Royal University of Phnom Penh', address: 'Russian Blvd', type: 'stop', lat: 11.568321, lng: 104.890694, pinCategory: 'Education', students: [{ id: 's14', name: 'Amelia Miller', grade: 'Grade 4', avatar: 'AM' }] },
      { id: 3, name: 'Institute of Technology of Cambodia', address: 'Russian Blvd', type: 'arrival', lat: 11.570100, lng: 104.897000, pinCategory: 'Education', students: [] }
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
  const { data: rawStudents = [], isLoading: isStudentsLoading } = useStudents();
  const manageStopsMutation = useManageStops();
  const updateRouteMutation = useUpdateRoute();
  const [stops, setStops] = useState([]);
  const [selectedStopId, setSelectedStopId] = useState(1);
  const [activeDriver, setActiveDriver] = useState('');
  const [capacityUsed, setCapacityUsed] = useState(0);
  const [capacityTotal, setCapacityTotal] = useState(60);

  // Route Rename states
  const [routeNameOverride, setRouteNameOverride] = useState('');
  const [isRouteRenameModalOpen, setIsRouteRenameModalOpen] = useState(false);
  const [renameInputValue, setRenameInputValue] = useState('');

  const displayRouteName = routeNameOverride || currentRoute.name;

  const handleOpenRenameRouteModal = () => {
    setRenameInputValue(displayRouteName);
    setIsRouteRenameModalOpen(true);
  };

  const handleRenameRouteSubmit = async (e) => {
    e.preventDefault();
    if (!renameInputValue.trim()) return;

    const newName = renameInputValue.trim();
    setRouteNameOverride(newName);

    if (ROUTE_DETAILS[routeId]) {
      ROUTE_DETAILS[routeId].name = newName;
    }

    const numericRouteId = routeId ? parseInt(routeId.replace('route-', ''), 10) : null;
    if (numericRouteId && !isNaN(numericRouteId)) {
      try {
        await updateRouteMutation.mutateAsync({
          id: numericRouteId,
          routeData: { route_name: newName }
        });
      } catch (err) {
        console.warn('Backend route rename sync failed:', err);
      }
    }

    setIsRouteRenameModalOpen(false);
  };

  // Student directory search & selection states
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedStudentObj, setSelectedStudentObj] = useState(null);

  const DEFAULT_STUDENT_ROSTER = useMemo(() => [
    { id: 'st_1', name: 'Lucas Vance', grade: 'Grade 3', avatar: 'LV' },
    { id: 'st_2', name: 'Sophia Chen', grade: 'Grade 5', avatar: 'SC' },
    { id: 'st_3', name: 'Ethan Miller', grade: 'Grade 2', avatar: 'EM' },
    { id: 'st_4', name: 'Chloe Sterling', grade: 'Grade 4', avatar: 'CS' },
    { id: 'st_5', name: 'Oliver Jenkins', grade: 'Grade 1', avatar: 'OJ' },
    { id: 'st_6', name: 'Emma Watson', grade: 'Grade 6', avatar: 'EW' },
    { id: 'st_7', name: 'Liam Vance', grade: 'Grade 3', avatar: 'LV' },
    { id: 'st_8', name: 'Noah Rodriguez', grade: 'Grade 4', avatar: 'NR' },
    { id: 'st_9', name: 'Mia Vance', grade: 'Grade 2', avatar: 'MV' },
    { id: 'st_10', name: 'Aiden Chen', grade: 'Grade 5', avatar: 'AC' },
    { id: 'st_11', name: 'Benjamin Vance', grade: 'Grade 1', avatar: 'BV' },
    { id: 'st_12', name: 'Charlotte Chen', grade: 'Grade 3', avatar: 'CC' },
    { id: 'st_13', name: 'Henry Sterling', grade: 'Grade 5', avatar: 'HS' },
    { id: 'st_14', name: 'Amelia Miller', grade: 'Grade 4', avatar: 'AM' }
  ], []);

  const studentDirectory = useMemo(() => {
    if (rawStudents.length > 0) {
      return rawStudents.map(s => {
        const fullName = `${s.first_name} ${s.last_name}`;
        return {
          id: String(s.student_id),
          name: fullName,
          grade: s.grade_level || 'Grade 3',
          avatar: getInitials(fullName)
        };
      });
    }
    return DEFAULT_STUDENT_ROSTER;
  }, [rawStudents, DEFAULT_STUDENT_ROSTER]);

  const filteredStudents = useMemo(() => {
    if (!studentSearchTerm.trim()) return studentDirectory;
    const term = studentSearchTerm.toLowerCase();
    return studentDirectory.filter(s => 
      s.name.toLowerCase().includes(term) || s.grade.toLowerCase().includes(term)
    );
  }, [studentDirectory, studentSearchTerm]);

  const isLoading = isQueryLoading && stops.length === 0;
  const error = queryError ? queryError.message : null;

  // Sync details state with routeId param changes
  useEffect(() => {
    if (rawRoutes.length > 0) {
      const matched = rawRoutes.find(r => String(r.route_id) === routeId || `route-${r.route_id}` === routeId);
      if (matched) {
        const uiStops = [];
        uiStops.push({ id: 'start', name: matched.start_location, address: matched.start_location, type: 'stop', lat: 11.5760835, lng: 104.9230554, pinCategory: 'Start Depot' });
        
        if (matched.students) {
          matched.students.forEach((s, idx) => {
            uiStops.push({
              id: String(s.student_id),
              name: `${s.first_name} ${s.last_name}'s Pick-up`,
              address: s.pickup_add || 'Pick-up Address',
              type: 'stop',
              lat: 11.556278 + (idx * 0.005),
              lng: 104.928222 + (idx * 0.005),
              pinCategory: 'Student Pick-up'
            });
          });
        }
        
        uiStops.push({ id: 'end', name: matched.end_location, address: matched.end_location, type: 'arrival', lat: 11.568321, lng: 104.890694, pinCategory: 'Destination School' });

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
  const [selectedPresetPinId, setSelectedPresetPinId] = useState('wat-phnom');
  const [newStopName, setNewStopName] = useState('');
  const [newStopAddress, setNewStopAddress] = useState('');
  const [newStopLat, setNewStopLat] = useState('11.5760835');
  const [newStopLng, setNewStopLng] = useState('104.9230554');
  const [insertIndex, setInsertIndex] = useState(null);

  const [newStudentName, setNewStudentName] = useState('');
  const [selectedStudentStopId, setSelectedStudentStopId] = useState('');

  const [driverSearch, setDriverSearch] = useState('');

  const openAddStudentForStop = (e, stopId) => {
    if (e) e.stopPropagation();
    setSelectedStudentStopId(String(stopId));
    setOpenMenuStopId(null);
    setIsStudentModalOpen(true);
  };
  const [openMenuStopId, setOpenMenuStopId] = useState(null);
  const [isEditStopModalOpen, setIsEditStopModalOpen] = useState(false);
  const [editingStop, setEditingStop] = useState(null);
  const [editStopName, setEditStopName] = useState('');
  const [editStopAddress, setEditStopAddress] = useState('');
  const [editStopLat, setEditStopLat] = useState('11.5760835');
  const [editStopLng, setEditStopLng] = useState('104.9230554');

  const handleOpenEditStop = (e, stop) => {
    e.stopPropagation();
    setEditingStop(stop);
    setEditStopName(stop.name || '');
    setEditStopAddress(stop.address || '');
    setEditStopLat(stop.lat ? String(stop.lat) : '11.5760835');
    setEditStopLng(stop.lng ? String(stop.lng) : '104.9230554');
    setOpenMenuStopId(null);
    setIsEditStopModalOpen(true);
  };

  const handleInteractiveEditPinSelect = (pinData) => {
    if (pinData.lat) setEditStopLat(String(pinData.lat));
    if (pinData.lng) setEditStopLng(String(pinData.lng));
    if (pinData.name) setEditStopName(pinData.name);
    if (pinData.address) setEditStopAddress(pinData.address);
  };

  const handleSaveEditedStop = async (e) => {
    e.preventDefault();
    if (!editingStop || !editStopName.trim()) return;

    const updatedStops = stops.map(s => {
      if (s.id === editingStop.id) {
        return {
          ...s,
          name: editStopName.trim(),
          address: editStopAddress.trim() || 'Phnom Penh Location',
          lat: editStopLat ? parseFloat(editStopLat) : s.lat,
          lng: editStopLng ? parseFloat(editStopLng) : s.lng,
          pinCategory: s.pinCategory || 'Pinned Location'
        };
      }
      return s;
    });

    setStops(updatedStops);

    // Sync state with server via TanStack Query (React Query)
    const numericRouteId = routeId ? parseInt(routeId.replace('route-', ''), 10) : null;
    if (numericRouteId && !isNaN(numericRouteId)) {
      try {
        await manageStopsMutation.mutateAsync({
          id: numericRouteId,
          stopData: { stops: updatedStops }
        });
      } catch (err) {
        console.warn('Backend stop edit sync failed, cached locally:', err);
      }
    }

    setIsEditStopModalOpen(false);
    setEditingStop(null);
  };

  const handleInteractivePinSelect = (pinData) => {
    if (pinData.lat) setNewStopLat(String(pinData.lat));
    if (pinData.lng) setNewStopLng(String(pinData.lng));
    if (pinData.name) setNewStopName(pinData.name);
    if (pinData.address) setNewStopAddress(pinData.address);
  };

  const handlePresetPinSelect = (presetId) => {
    setSelectedPresetPinId(presetId);
    const found = PHNOM_PENH_PIN_PRESETS.find(p => p.id === presetId);
    if (found && presetId !== 'custom-pin') {
      setNewStopName(found.name);
      setNewStopAddress(found.address);
      setNewStopLat(found.lat ? String(found.lat) : '');
      setNewStopLng(found.lng ? String(found.lng) : '');
    } else if (presetId === 'custom-pin') {
      setNewStopName('');
      setNewStopAddress('');
      setNewStopLat('');
      setNewStopLng('');
    }
  };

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

  const handleAddStop = async (e) => {
    e.preventDefault();
    if (!newStopName.trim()) return;

    const numericIds = stops.map(s => (typeof s.id === 'number' ? s.id : parseInt(s.id, 10) || 0));
    const maxId = numericIds.length > 0 ? Math.max(...numericIds, 0) : 0;
    const newId = maxId + 1;

    const selectedPreset = PHNOM_PENH_PIN_PRESETS.find(p => p.id === selectedPresetPinId);

    const newStop = {
      id: newId,
      name: newStopName.trim(),
      address: newStopAddress.trim() || 'Phnom Penh Location',
      type: 'stop',
      lat: newStopLat ? parseFloat(newStopLat) : null,
      lng: newStopLng ? parseFloat(newStopLng) : null,
      pinCategory: selectedPresetPinId !== 'custom-pin' ? (selectedPreset?.category || 'Landmark') : 'Custom Pin'
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
    setSelectedStopId(newId);

    // Sync state with server via TanStack Query (React Query) if routeId is numeric
    const numericRouteId = routeId ? parseInt(routeId.replace('route-', ''), 10) : null;
    if (numericRouteId && !isNaN(numericRouteId)) {
      try {
        await manageStopsMutation.mutateAsync({
          id: numericRouteId,
          stopData: { stops: updatedStops }
        });
      } catch (err) {
        console.warn('Backend stop creation sync failed, stored in React Query cache:', err);
      }
    }

    setNewStopName('');
    setNewStopAddress('');
    setNewStopLat('');
    setNewStopLng('');
    setInsertIndex(null);
    setIsStopModalOpen(false);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudentStopId) return;

    const studentToAssign = selectedStudentObj || (newStudentName.trim() ? {
      id: `std_${Date.now()}`,
      name: newStudentName.trim(),
      grade: 'Grade 3',
      avatar: getInitials(newStudentName.trim())
    } : null);

    if (!studentToAssign) return;

    let totalPassengers = 0;
    const updatedStops = stops.map(s => {
      if (String(s.id) === String(selectedStudentStopId)) {
        const existingStudents = s.students || [];
        const exists = existingStudents.some(st => String(st.id) === String(studentToAssign.id) || st.name === studentToAssign.name);
        const updated = exists ? existingStudents : [...existingStudents, studentToAssign];
        totalPassengers += updated.length;
        return { ...s, students: updated };
      }
      totalPassengers += (s.students ? s.students.length : 0);
      return s;
    });

    setStops(updatedStops);
    setCapacityUsed(totalPassengers);

    // Persist updated stop sequence & student assignments to database via TanStack Query
    const numericRouteId = routeId ? parseInt(routeId.replace('route-', ''), 10) : null;
    if (numericRouteId && !isNaN(numericRouteId)) {
      try {
        await manageStopsMutation.mutateAsync({
          id: numericRouteId,
          stopData: { stops: updatedStops }
        });
      } catch (err) {
        console.warn('Backend student registration sync failed:', err);
      }
    }

    setNewStudentName('');
    setStudentSearchTerm('');
    setSelectedStudentObj(null);
    setSelectedStudentStopId('');
    setIsStudentModalOpen(false);
  };

  const handleDeleteStop = async () => {
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

    const numericRouteId = routeId ? parseInt(routeId.replace('route-', ''), 10) : null;
    if (numericRouteId && !isNaN(numericRouteId)) {
      try {
        await manageStopsMutation.mutateAsync({
          id: numericRouteId,
          stopData: { stops: updatedStops }
        });
      } catch (err) {
        console.warn('Backend stop deletion sync failed:', err);
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
    const defaultPreset = PHNOM_PENH_PIN_PRESETS[0];
    setSelectedPresetPinId(defaultPreset.id);
    setNewStopName(defaultPreset.name);
    setNewStopAddress(defaultPreset.address);
    setNewStopLat(String(defaultPreset.lat));
    setNewStopLng(String(defaultPreset.lng));
    setIsStopModalOpen(true);
  };

  // Google Maps Dynamic URL based on selected stop
  const getMapUrl = () => {
    const selectedStop = stops.find(s => String(s.id) === String(selectedStopId));
    if (selectedStop) {
      if (selectedStop.lat && selectedStop.lng) {
        return `https://www.google.com/maps?q=${selectedStop.lat},${selectedStop.lng}&z=16&output=embed`;
      }
      return `https://www.google.com/maps?q=${encodeURIComponent(selectedStop.name + ', Phnom Penh')}&z=16&output=embed`;
    }
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
            <h2 className="top-navbar-title" style={{ fontSize: '18px', fontWeight: 700 }}>{displayRouteName}</h2>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 className="canvas-title" style={{ fontSize: '28px', margin: 0 }}>{displayRouteName}</h1>
                <button
                  type="button"
                  onClick={handleOpenRenameRouteModal}
                  title="Rename Route"
                  style={{
                    background: 'rgba(0, 35, 111, 0.06)',
                    border: '1px solid rgba(0, 35, 111, 0.15)',
                    color: 'var(--primary-brand)',
                    cursor: 'pointer',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 35, 111, 0.12)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 35, 111, 0.06)'}
                >
                  <Pencil size={13} />
                  Rename
                </button>
              </div>
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

                        {/* Location Details, Linked Pin & Assigned Students */}
                        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-dark)' }}>
                              {stop.name}
                            </span>
                            {stop.pinCategory && (
                              <span style={{ fontSize: '10px', backgroundColor: 'rgba(0, 35, 111, 0.08)', color: 'var(--primary-brand)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <MapPin size={10} />
                                {stop.pinCategory}
                              </span>
                            )}
                          </div>

                          <span style={{ fontSize: '12px', color: 'var(--icon-color)' }}>
                            {stop.address}
                          </span>

                          {stop.lat && stop.lng && (
                            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 500, fontFamily: 'monospace' }}>
                              📍 {stop.lat.toFixed(4)}° N, {stop.lng.toFixed(4)}° E
                            </span>
                          )}

                          {/* Assigned Students Badges */}
                          {!isArrival && (
                            <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed rgba(197, 197, 211, 0.4)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dark)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Users size={12} style={{ color: 'var(--primary-brand)' }} />
                                  Passengers ({stop.students ? stop.students.length : 0})
                                </span>

                                <button
                                  type="button"
                                  onClick={(e) => openAddStudentForStop(e, stop.id)}
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: '#ffffff',
                                    backgroundColor: 'var(--primary-brand)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '4px 10px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    boxShadow: '0 2px 6px rgba(0, 35, 111, 0.2)',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#001d5c';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--primary-brand)';
                                    e.currentTarget.style.transform = 'none';
                                  }}
                                >
                                  <Plus size={11} strokeWidth={2.5} />
                                  Add Student
                                </button>
                              </div>

                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                                {stop.students && stop.students.length > 0 ? (
                                  stop.students.map((st) => (
                                    <span 
                                      key={st.id || st.name}
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        backgroundColor: '#f1f5f9',
                                        padding: '3px 8px',
                                        borderRadius: '12px',
                                        border: '1px solid #cbd5e1',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                      }}
                                    >
                                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--primary-brand)', color: '#ffffff', fontSize: '9px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {st.avatar || getInitials(st.name)}
                                      </span>
                                      {st.name} {st.grade ? `(${st.grade})` : ''}
                                    </span>
                                  ))
                                ) : (
                                  <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                                    No students assigned to pick-up
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {isArrival && (
                          <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            ARRIVAL
                          </span>
                        )}

                        {!isArrival && (
                          <div style={{ position: 'relative' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuStopId(openMenuStopId === stop.id ? null : stop.id);
                              }}
                              className="stop-menu-btn"
                              title="Stop Options"
                              style={{
                                background: openMenuStopId === stop.id ? 'rgba(0, 35, 111, 0.08)' : 'none',
                                border: 'none',
                                color: 'var(--text-dark)',
                                cursor: 'pointer',
                                padding: '6px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {openMenuStopId === stop.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: 'absolute',
                                  top: '100%',
                                  right: 0,
                                  marginTop: '4px',
                                  backgroundColor: '#ffffff',
                                  border: '1px solid rgba(197, 197, 211, 0.4)',
                                  borderRadius: '8px',
                                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
                                  zIndex: 100,
                                  minWidth: '180px',
                                  overflow: 'hidden',
                                  padding: '4px'
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => openAddStudentForStop(e, stop.id)}
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 12px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: 'var(--text-dark)',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <UserPlus size={14} style={{ color: '#059669' }} />
                                  Add Student to Stop
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleOpenEditStop(e, stop)}
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 12px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: 'var(--text-dark)',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <Pencil size={14} style={{ color: 'var(--primary-brand)' }} />
                                  Edit Details & Pin
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStopToDelete(stop);
                                    setIsDeleteConfirmModalOpen(true);
                                    setOpenMenuStopId(null);
                                  }}
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 12px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: '#ef4444',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <Trash2 size={14} />
                                  Remove Stop
                                </button>
                              </div>
                            )}
                          </div>
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
                {/* Interactive Connected Route Pins Map */}
                <RouteOverviewMap 
                  stops={stops} 
                  selectedStopId={selectedStopId} 
                  onSelectStop={(id) => setSelectedStopId(id)} 
                />

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
          <form onSubmit={handleAddStop} className="modal-card" style={{ maxWidth: '560px', width: '92%' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={20} style={{ color: 'var(--primary-brand)' }} />
                  Pin Route Stop Location
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--icon-color)', margin: '2px 0 0 0', textAlign: 'left' }}>
                  Click anywhere on the map or drag the pin marker to visually set the stop's location.
                </p>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setIsStopModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Interactive Map Pin Dropper */}
                <LocationPinPicker 
                  initialLat={newStopLat ? parseFloat(newStopLat) : 11.5760835}
                  initialLng={newStopLng ? parseFloat(newStopLng) : 104.9230554}
                  onPinSelect={handleInteractivePinSelect}
                />

                {/* Stop Name & Address Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Stop Location Name</label>
                    <Input 
                      type="text" 
                      placeholder="e.g. Wat Phnom"
                      value={newStopName}
                      onChange={(e) => setNewStopName(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Location Address</label>
                    <Input 
                      type="text" 
                      placeholder="e.g. Preah Norodom Blvd"
                      value={newStopAddress}
                      onChange={(e) => setNewStopAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>

              </div>
            </div>

            <div className="modal-footer">
              <Button type="button" variant="secondary" onClick={() => setIsStopModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save & Link Pinned Stop
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* --- Edit Stop Modal --- */}
      {isEditStopModalOpen && editingStop && (
        <div className="modal-overlay">
          <form onSubmit={handleSaveEditedStop} className="modal-card" style={{ maxWidth: '560px', width: '92%' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Pencil size={18} style={{ color: 'var(--primary-brand)' }} />
                  Edit Stop Details & Location
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--icon-color)', margin: '2px 0 0 0', textAlign: 'left' }}>
                  Modify the stop details or re-pin its location on the interactive map below.
                </p>
              </div>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => {
                  setIsEditStopModalOpen(false);
                  setEditingStop(null);
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Interactive Re-Pinning Map */}
                <LocationPinPicker 
                  initialLat={editStopLat ? parseFloat(editStopLat) : 11.5760835}
                  initialLng={editStopLng ? parseFloat(editStopLng) : 104.9230554}
                  onPinSelect={handleInteractiveEditPinSelect}
                />

                {/* Stop Name & Address Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Stop Location Name</label>
                    <Input 
                      type="text" 
                      value={editStopName}
                      onChange={(e) => setEditStopName(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Location Address</label>
                    <Input 
                      type="text" 
                      value={editStopAddress}
                      onChange={(e) => setEditStopAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>

              </div>
            </div>

            <div className="modal-footer">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setIsEditStopModalOpen(false);
                  setEditingStop(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* --- Add Student Modal with Searchable Student Selector --- */}
      {isStudentModalOpen && (
        <div className="modal-overlay">
          <form onSubmit={handleAddStudent} className="modal-card" style={{ maxWidth: '480px', width: '92%' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserPlus size={18} style={{ color: 'var(--primary-brand)' }} />
                  Register Student to Stop
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--icon-color)', margin: '2px 0 0 0', textAlign: 'left' }}>
                  Select an existing student from the database or search by name / grade.
                </p>
              </div>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => {
                  setIsStudentModalOpen(false);
                  setSelectedStudentObj(null);
                  setStudentSearchTerm('');
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                
                {/* Target Pick-up Stop Selection */}
                <div className="select-input-wrapper">
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>Assign to Pick-up Stop</label>
                  <select 
                    className="select-input" 
                    value={selectedStudentStopId}
                    onChange={(e) => setSelectedStudentStopId(e.target.value)}
                    required
                  >
                    <option value="">Select Target Stop...</option>
                    {stops.filter(s => s.type !== 'arrival').map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.address})</option>
                    ))}
                  </select>
                </div>

                {/* Searchable Student Dropdown Picker */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)' }}>
                      Select Student ({isStudentsLoading ? 'Loading API...' : `${filteredStudents.length} available`})
                    </label>
                    {selectedStudentObj && (
                      <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                        ✓ {selectedStudentObj.name} Selected
                      </span>
                    )}
                  </div>

                  {/* Live Search Input */}
                  <Input 
                    type="text" 
                    icon={<Search size={14} />}
                    placeholder="Search student by name or grade level..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                  />

                  {/* Scrollable Student Selection List */}
                  <div 
                    style={{
                      maxHeight: '180px',
                      overflowY: 'auto',
                      border: '1px solid rgba(197, 197, 211, 0.4)',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      marginTop: '4px'
                    }}
                  >
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((st) => {
                        const isSelected = selectedStudentObj && selectedStudentObj.id === st.id;
                        return (
                          <div
                            key={st.id}
                            onClick={() => {
                              setSelectedStudentObj(st);
                              setNewStudentName(st.name);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              borderBottom: '1px solid rgba(197, 197, 211, 0.15)',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? 'rgba(0, 35, 111, 0.06)' : 'transparent',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => !isSelected && (e.currentTarget.style.backgroundColor = '#f8fafc')}
                            onMouseLeave={(e) => !isSelected && (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--primary-brand)', color: '#ffffff', fontSize: '10px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                {st.avatar}
                              </span>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>{st.name}</span>
                                <span style={{ fontSize: '11px', color: 'var(--icon-color)' }}>{st.grade}</span>
                              </div>
                            </div>

                            {isSelected ? (
                              <Check size={16} style={{ color: 'var(--primary-brand)' }} />
                            ) : (
                              <span style={{ fontSize: '11px', color: 'var(--primary-brand)', fontWeight: 600 }}>Select</span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                        No matching students found for "{studentSearchTerm}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Fallback Manual Name Entry */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--icon-color)' }}>Or enter a custom student name if not in directory:</label>
                  <Input 
                    type="text" 
                    placeholder="e.g. Custom Student Name"
                    value={newStudentName}
                    onChange={(e) => {
                      setNewStudentName(e.target.value);
                      if (selectedStudentObj && selectedStudentObj.name !== e.target.value) {
                        setSelectedStudentObj(null);
                      }
                    }}
                  />
                </div>

              </div>
            </div>

            <div className="modal-footer">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setIsStudentModalOpen(false);
                  setSelectedStudentObj(null);
                  setStudentSearchTerm('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedStudentStopId || (!selectedStudentObj && !newStudentName.trim())}>
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

      {/* --- Rename Route Modal --- */}
      {isRouteRenameModalOpen && (
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
                onClick={() => setIsRouteRenameModalOpen(false)}
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
                onClick={() => setIsRouteRenameModalOpen(false)}
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
    </div>
  );
};

export default RouteDetailPage;
