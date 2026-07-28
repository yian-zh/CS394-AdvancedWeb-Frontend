import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  Bus, Users, LogOut, Search, Plus, 
  SlidersHorizontal, Download, ChevronLeft, MapPin, 
  GraduationCap, Check, X, ArrowLeft, User, Trash2, GripVertical,
  MoreVertical, Pencil, UserPlus, DollarSign, Loader2, UserX
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import { useRoutes, useManageStops, useUpdateRoute, useDeleteRoute, useAssignBusToRoute } from '../hooks/useRoutes';
import { useStudents, useCreateStudent } from '../hooks/useStudents';
import { useBuses } from '../hooks/useFleet';
import { useUsers } from '../hooks/useUsers';
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

const INITIAL_DRIVERS = [];

const RouteDetailPage = ({ user, onSignOut, fleet, setFleet }) => {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const currentRoute = ROUTE_DETAILS[routeId] || ROUTE_DETAILS['route-1'];

  const { data: routesResponse, isLoading: isQueryLoading, error: queryError } = useRoutes({ perPage: 1000 });
  const rawRoutes = routesResponse?.data ?? [];
  const { data: studentsResponse, isLoading: isStudentsLoading } = useStudents({ perPage: 1000 });
  const rawStudents = studentsResponse?.data ?? [];
  const { data: busesResponse } = useBuses({ perPage: 1000 });
  const rawBuses = busesResponse?.data ?? [];
  const { data: usersResponse } = useUsers({ perPage: 1000 });
  const rawUsers = usersResponse?.data ?? [];
  const createStudentMutation = useCreateStudent();
  const manageStopsMutation = useManageStops();
  const updateRouteMutation = useUpdateRoute();
  const deleteRouteMutation = useDeleteRoute();
  const assignBusMutation = useAssignBusToRoute();

  const [stops, setStops] = useState([]);
  const [customStops, setCustomStops] = useState(() => {
    try {
      const saved = localStorage.getItem(`sbms_route_custom_stops_${routeId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [selectedStopId, setSelectedStopId] = useState(1);
  const [activeDriver, setActiveDriver] = useState('');
  const [assigningDriverId, setAssigningDriverId] = useState(null);
  const [activeBus, setActiveBus] = useState('#402-A');
  const [capacityUsed, setCapacityUsed] = useState(0);
  const [capacityTotal, setCapacityTotal] = useState(60);

  // Bus Change Modal States
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [busSearchTerm, setBusSearchTerm] = useState('');
  const [selectedBusObj, setSelectedBusObj] = useState(null);

  // Route Rename states
  const [routeNameOverride, setRouteNameOverride] = useState('');
  const [isRouteRenameModalOpen, setIsRouteRenameModalOpen] = useState(false);
  const [isDeleteRouteModalOpen, setIsDeleteRouteModalOpen] = useState(false);
  const [renameInputValue, setRenameInputValue] = useState('');

  const busOptions = useMemo(() => {
    return (rawBuses || []).map(b => ({
      id: b.bus_id,
      bus_id: b.bus_id,
      bus_number: b.bus_number,
      busNumber: `#${b.bus_number}`,
      capacity: b.capacity || 50,
      status: b.availability_status ? (b.availability_status.charAt(0).toUpperCase() + b.availability_status.slice(1)) : 'Active'
    }));
  }, [rawBuses]);

  const busOptionsWithSchedule = useMemo(() => {
    const currentRouteTime = '07:00 AM - 08:30 AM';
    return busOptions.map(b => {
      const assignedRoute = rawRoutes.find(r => 
        String(r.route_id) !== String(routeId) &&
        r.buses && r.buses.some(rb => `#${rb.bus_number}` === b.busNumber || String(rb.bus_id) === String(b.bus_id))
      );

      let isOverlapping = false;
      let conflictInfo = null;

      if (assignedRoute) {
        const assignedTime = '07:00 AM - 08:30 AM';
        if (isTimeOverlapping(currentRouteTime, assignedTime)) {
          isOverlapping = true;
          conflictInfo = `${assignedRoute.route_name} (${assignedTime})`;
        }
      }

      return {
        ...b,
        isOverlapping,
        conflictInfo
      };
    });
  }, [busOptions, rawRoutes, routeId]);

  const filteredBuses = useMemo(() => {
    if (!busSearchTerm.trim()) return busOptionsWithSchedule;
    const term = busSearchTerm.toLowerCase();
    return busOptionsWithSchedule.filter(b => 
      b.busNumber.toLowerCase().includes(term) || String(b.capacity).includes(term)
    );
  }, [busOptionsWithSchedule, busSearchTerm]);

  const handleAssignBusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBusObj || assignBusMutation.isPending) return;

    const busNumberStr = selectedBusObj.busNumber || `#${selectedBusObj.bus_number}`;
    setActiveBus(busNumberStr);
    if (selectedBusObj.capacity) setCapacityTotal(selectedBusObj.capacity);

    const numericRouteId = routeId ? parseInt(String(routeId).replace('route-', ''), 10) : null;
    const busIdNum = selectedBusObj.bus_id || selectedBusObj.id;

    if (numericRouteId && !isNaN(numericRouteId) && busIdNum) {
      try {
        await assignBusMutation.mutateAsync({
          bus_id: typeof busIdNum === 'number' ? busIdNum : 1,
          route_id: numericRouteId,
          assigned_date: new Date().toISOString().split('T')[0]
        });
      } catch (err) {
        console.warn('Backend bus assignment sync note:', err);
      }
    }

    setIsBusModalOpen(false);
    setSelectedBusObj(null);
    setBusSearchTerm('');
  };

  const matchedRoute = useMemo(() => {
    if (rawRoutes && rawRoutes.length > 0) {
      const found = rawRoutes.find(r => 
        String(r.route_id) === String(routeId) || 
        `route-${r.route_id}` === String(routeId)
      );
      if (found) return found;
    }
    return null;
  }, [rawRoutes, routeId]);

  const displayRouteName = useMemo(() => {
    if (routeNameOverride) return routeNameOverride;

    try {
      const storedName = localStorage.getItem(`sbms_route_name_${routeId}`);
      if (storedName) return storedName;
      const numId = routeId ? parseInt(String(routeId).replace('route-', ''), 10) : null;
      if (numId) {
        const storedNum = localStorage.getItem(`sbms_route_name_${numId}`);
        if (storedNum) return storedNum;
      }
    } catch (e) {}

    if (matchedRoute && matchedRoute.route_name) {
      return matchedRoute.route_name;
    }

    if (ROUTE_DETAILS[routeId] && ROUTE_DETAILS[routeId].name) {
      return ROUTE_DETAILS[routeId].name;
    }

    const cleanId = String(routeId).replace('route-', '');
    return `Route ${cleanId}`;
  }, [routeNameOverride, routeId, matchedRoute]);

  const handleOpenRenameRouteModal = () => {
    setRenameInputValue(displayRouteName);
    setIsRouteRenameModalOpen(true);
  };

  const handleOpenDeleteRouteModal = () => {
    setIsDeleteRouteModalOpen(true);
  };

  const handleDeleteRouteSubmit = async (e) => {
    e.preventDefault();
    if (deleteRouteMutation.isPending) return;

    const numericId = parseInt(routeId, 10);
    if (numericId && !isNaN(numericId)) {
      try {
        await deleteRouteMutation.mutateAsync(numericId);
      } catch (err) {
        console.warn('Backend route delete error:', err);
      }
    }

    setIsDeleteRouteModalOpen(false);
    navigate('/logistics');
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

  const studentDirectory = useMemo(() => {
    if (rawStudents && rawStudents.length > 0) {
      return rawStudents.map(s => {
        const fullName = `${s.first_name || ''} ${s.last_name || ''}`.trim() || `Student #${s.student_id}`;
        return {
          id: String(s.student_id),
          student_id: s.student_id,
          name: fullName,
          grade: s.grade_level || 'Student',
          avatar: getInitials(fullName)
        };
      });
    }
    return [];
  }, [rawStudents]);

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
        const startStop = { 
          id: 'start', 
          name: matched.start_location, 
          address: matched.start_location, 
          type: 'stop', 
          lat: 11.5760835, 
          lng: 104.9230554, 
          pinCategory: 'Start Depot',
          students: []
        };
        const uiStops = [];
        
        if (matched.students && matched.students.length > 0) {
          const stopsMap = new Map();

          matched.students.forEach((s, idx) => {
            const stopAddr = s.pivot?.stop_address || s.pickup_add || 'Pick-up Address';
            const studentObj = {
              id: String(s.student_id),
              student_id: s.student_id,
              name: `${s.first_name} ${s.last_name}`,
              grade: s.grade_level || 'Grade 3',
              avatar: getInitials(`${s.first_name} ${s.last_name}`)
            };

            const isStartDepot = stopAddr.toLowerCase() === matched.start_location.toLowerCase() || stopAddr.toLowerCase() === 'school';

            if (isStartDepot) {
              const exists = startStop.students.some(st => String(st.id) === String(studentObj.id));
              if (!exists) {
                startStop.students.push(studentObj);
              }
            } else {
              if (!stopsMap.has(stopAddr)) {
                stopsMap.set(stopAddr, {
                  id: s.pivot?.student_stop_id ? `stop_${s.pivot.student_stop_id}` : `stop_${idx + 1}`,
                  name: `${stopAddr}`,
                  address: stopAddr,
                  type: 'stop',
                  lat: 11.556278 + (idx * 0.005),
                  lng: 104.928222 + (idx * 0.005),
                  pinCategory: 'Student Pick-up',
                  students: []
                });
              }
              const existingStudents = stopsMap.get(stopAddr).students;
              const exists = existingStudents.some(st => String(st.id) === String(studentObj.id));
              if (!exists) {
                existingStudents.push(studentObj);
              }
            }
          });

          uiStops.push(startStop);
          stopsMap.forEach(stopObj => uiStops.push(stopObj));
        } else {
          uiStops.push(startStop);
        }

        // Merge backend student_stops if available
        if (matched.stops && matched.stops.length > 0) {
          matched.stops.forEach((st, idx) => {
            const stopAddr = st.stop_address || 'Stop Address';
            const isStart = stopAddr.toLowerCase() === (matched.start_location || '').toLowerCase();
            const isEnd = stopAddr.toLowerCase() === (matched.end_location || '').toLowerCase();
            if (!isStart && !isEnd) {
              const stopObj = {
                id: st.student_stop_id || `backend_stop_${idx}`,
                name: stopAddr,
                address: stopAddr,
                type: 'stop',
                lat: 11.556278 + (idx * 0.005),
                lng: 104.928222 + (idx * 0.005),
                pinCategory: 'Stop Location',
                students: st.student ? [{
                  id: String(st.student.student_id),
                  student_id: st.student.student_id,
                  name: `${st.student.first_name} ${st.student.last_name}`,
                  grade: st.student.grade_level || 'Grade 3',
                  avatar: getInitials(`${st.student.first_name} ${st.student.last_name}`)
                }] : []
              };
              const exists = uiStops.some(s => s.address && s.address.toLowerCase() === stopAddr.toLowerCase());
              if (!exists) {
                uiStops.push(stopObj);
              }
            }
          });
        }

        // Merge custom intermediate stops created by user that are not already present in uiStops
        let savedCustomStops = customStops;
        try {
          const stored = localStorage.getItem(`sbms_route_custom_stops_${routeId}`);
          if (stored) savedCustomStops = JSON.parse(stored);
        } catch (e) {}

        if (savedCustomStops && savedCustomStops.length > 0) {
          savedCustomStops.forEach(cs => {
            const exists = uiStops.some(s => 
              String(s.id) === String(cs.id) || 
              (s.address && cs.address && s.address.toLowerCase() === cs.address.toLowerCase() && s.name.toLowerCase() === cs.name.toLowerCase())
            );
            if (!exists) {
              uiStops.push(cs);
            }
          });
        }
        
        uiStops.push({ id: 'end', name: matched.end_location, address: matched.end_location, type: 'arrival', lat: 11.568321, lng: 104.890694, pinCategory: 'Destination School' });

        const resolveDriverName = (matchedRoute) => {
          const numericId = routeId ? parseInt(String(routeId).replace('route-', ''), 10) : null;
          let savedDriver = null;
          if (numericId) {
            savedDriver = localStorage.getItem(`sbms_route_driver_${numericId}`);
          }
          if (!savedDriver && routeId) {
            savedDriver = localStorage.getItem(`sbms_route_driver_${routeId}`);
          }
          if (savedDriver) return savedDriver;

          if (matchedRoute && matchedRoute.driver) {
            const d = matchedRoute.driver;
            const fn = `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.username;
            if (fn) return fn;
          }

          if (matchedRoute && matchedRoute.driver_id && rawUsers && rawUsers.length > 0) {
            const found = rawUsers.find(u => String(u.user_id) === String(matchedRoute.driver_id));
            if (found) {
              const fn = `${found.first_name || ''} ${found.last_name || ''}`.trim() || found.username;
              if (fn) return fn;
            }
          }

          return 'Unassigned';
        };

        const resolvedDriverName = resolveDriverName(matched);

        try {
          const fullSaved = localStorage.getItem(`sbms_route_stops_${routeId}`);
          if (fullSaved) {
            const parsedFull = JSON.parse(fullSaved);
            if (Array.isArray(parsedFull) && parsedFull.length > 0) {
              setStops(parsedFull);
              setSelectedStopId(parsedFull[0]?.id || 'start');
              setActiveDriver(resolvedDriverName);
              return;
            }
          }
        } catch (e) {}

        setStops(uiStops);
        setSelectedStopId(uiStops[0]?.id || 'start');
        setActiveDriver(resolvedDriverName);
        if (matched.buses && matched.buses.length > 0) {
          setActiveBus(`#${matched.buses[0].bus_number}`);
          if (matched.buses[0].capacity) setCapacityTotal(matched.buses[0].capacity);
        } else if (matched.bus_number || matched.bus_id) {
          setActiveBus(`#${matched.bus_number || matched.bus_id}`);
        } else if (currentRoute.busId) {
          setActiveBus(currentRoute.busId);
        } else {
          setActiveBus('#402-A');
        }
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
  }, [rawRoutes, isQueryLoading, routeId, currentRoute, rawUsers]);

  // Modals state
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [isAddingStop, setIsAddingStop] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [stopToDelete, setStopToDelete] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const [isRemoveStudentModalOpen, setIsRemoveStudentModalOpen] = useState(false);
  const [studentToRemoveData, setStudentToRemoveData] = useState(null);
  const [isRemovingStudent, setIsRemovingStudent] = useState(false);

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

  const syncStopsWithBackend = async (currentStops) => {
    const numericRouteId = routeId ? parseInt(String(routeId).replace('route-', ''), 10) : null;
    if (!numericRouteId || isNaN(numericRouteId)) return;

    const payloadStops = [];
    let orderCounter = 1;

    for (const stop of currentStops) {
      if (stop.students && Array.isArray(stop.students) && stop.students.length > 0) {
        for (const st of stop.students) {
          let numericStudentId = null;
          if (st.student_id && !isNaN(parseInt(st.student_id, 10))) {
            numericStudentId = parseInt(st.student_id, 10);
          } else if (st.id) {
            const parsed = parseInt(String(st.id).replace(/\D/g, ''), 10);
            if (!isNaN(parsed) && parsed > 0) {
              numericStudentId = parsed;
            }
          }

          payloadStops.push({
            student_id: numericStudentId,
            stop_address: stop.address || stop.name || 'Phnom Penh Location',
            stop_order: orderCounter++
          });
        }
      } else if (stop.type !== 'arrival' && stop.id !== 'start') {
        payloadStops.push({
          student_id: null,
          stop_address: stop.address || stop.name || 'Phnom Penh Location',
          stop_order: orderCounter++
        });
      }
    }

    const validPayloadStops = payloadStops.filter(s => s.stop_address && String(s.stop_address).trim().length > 0);

    if (validPayloadStops.length > 0) {
      try {
        await manageStopsMutation.mutateAsync({
          id: numericRouteId,
          stopData: { stops: validPayloadStops }
        });
      } catch (err) {
        console.warn('Backend student stop sync failed:', err);
      }
    }
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
    try {
      localStorage.setItem(`sbms_route_stops_${routeId}`, JSON.stringify(updatedStops));
      const updatedCustom = customStops.map(cs => {
        if (cs.id === editingStop.id) {
          return {
            ...cs,
            name: editStopName.trim(),
            address: editStopAddress.trim() || 'Phnom Penh Location',
            lat: editStopLat ? parseFloat(editStopLat) : cs.lat,
            lng: editStopLng ? parseFloat(editStopLng) : cs.lng
          };
        }
        return cs;
      });
      setCustomStops(updatedCustom);
      localStorage.setItem(`sbms_route_custom_stops_${routeId}`, JSON.stringify(updatedCustom));
    } catch (e) {}
    await syncStopsWithBackend(updatedStops);

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

  const handleAssignDriver = async (driverInput) => {
    if (assigningDriverId !== null) return; // Prevent double clicks

    let nameStr = '';
    let driverIdNum = null;
    let targetId = null;

    if (typeof driverInput === 'string') {
      nameStr = driverInput;
      targetId = driverInput;
    } else if (driverInput && typeof driverInput === 'object') {
      nameStr = driverInput.name || `${driverInput.first_name || ''} ${driverInput.last_name || ''}`.trim();
      driverIdNum = driverInput.user_id || driverInput.id;
      targetId = driverInput.id || driverInput.user_id;
    }

    setAssigningDriverId(targetId);

    if (nameStr) setActiveDriver(nameStr);

    const numericRouteId = routeId ? parseInt(String(routeId).replace('route-', ''), 10) : null;
    const matchedRoute = rawRoutes.find(r => `route-${r.route_id}` === routeId || String(r.route_id) === routeId || r.route_id === numericRouteId);
    const finalRouteId = matchedRoute?.route_id || numericRouteId;

    if (finalRouteId && driverIdNum) {
      try {
        await updateRouteMutation.mutateAsync({
          id: Number(finalRouteId),
          routeData: { driver_id: Number(driverIdNum) }
        });
      } catch (err) {
        console.warn('Backend driver assignment sync note:', err);
      }
    }

    // Save to local storage overrides for fallback
    if (nameStr) {
      if (numericRouteId) {
        localStorage.setItem(`sbms_route_driver_${numericRouteId}`, nameStr);
        localStorage.setItem(`sbms_route_driver_route-${numericRouteId}`, nameStr);
      }
      if (routeId) {
        localStorage.setItem(`sbms_route_driver_${routeId}`, nameStr);
      }

      const saved = localStorage.getItem('bus_override_#402-A');
      let parsed = {};
      if (saved) {
        try { parsed = JSON.parse(saved); } catch (e) {}
      }
      parsed.driver = nameStr;
      localStorage.setItem('bus_override_#402-A', JSON.stringify(parsed));

      if (fleet && Array.isArray(fleet)) {
        const updatedFleet = fleet.map(b => {
          if (b.id === '#402-A') {
            return { ...b, driver: nameStr };
          }
          return b;
        });
        if (typeof setFleet === 'function') setFleet(updatedFleet);
      }
    }

    setTimeout(() => {
      setAssigningDriverId(null);
      setIsDriverModalOpen(false);
    }, 450);
  };

  const handleRemoveDriver = async () => {
    if (assigningDriverId !== null) return;
    setAssigningDriverId('remove');

    setActiveDriver('Unassigned');

    const numericRouteId = routeId ? parseInt(String(routeId).replace('route-', ''), 10) : null;
    const matchedRoute = rawRoutes.find(r => `route-${r.route_id}` === routeId || String(r.route_id) === routeId || r.route_id === numericRouteId);
    const finalRouteId = matchedRoute?.route_id || numericRouteId;

    if (finalRouteId) {
      try {
        await updateRouteMutation.mutateAsync({
          id: Number(finalRouteId),
          routeData: { driver_id: null }
        });
      } catch (err) {
        console.warn('Backend driver unassign sync note:', err);
      }
    }

    try {
      if (finalRouteId) {
        localStorage.removeItem(`sbms_route_driver_${finalRouteId}`);
        localStorage.removeItem(`sbms_route_driver_route-${finalRouteId}`);
      }
      if (routeId) {
        localStorage.removeItem(`sbms_route_driver_${routeId}`);
      }

      const saved = localStorage.getItem('bus_override_#402-A');
      let parsed = {};
      if (saved) {
        try { parsed = JSON.parse(saved); } catch (e) {}
      }
      parsed.driver = 'Unassigned';
      localStorage.setItem('bus_override_#402-A', JSON.stringify(parsed));
    } catch (e) {}

    setTimeout(() => {
      setAssigningDriverId(null);
      setIsDriverModalOpen(false);
    }, 400);
  };

  const handleAddStop = async (e) => {
    e.preventDefault();
    if (!newStopName.trim() || isAddingStop) return;

    setIsAddingStop(true);
    try {
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
      const updatedCustom = [...customStops.filter(s => String(s.id) !== String(newStop.id)), newStop];
      setCustomStops(updatedCustom);
      try {
        localStorage.setItem(`sbms_route_custom_stops_${routeId}`, JSON.stringify(updatedCustom));
        localStorage.setItem(`sbms_route_stops_${routeId}`, JSON.stringify(updatedStops));
      } catch (e) {}
      await syncStopsWithBackend(updatedStops);

      setNewStopName('');
      setNewStopAddress('');
      setNewStopLat('');
      setNewStopLng('');
      setInsertIndex(null);
      setIsStopModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingStop(false);
    }
  };

  const handleRemoveStudentFromStop = async (stopId, studentToRemove) => {
    let totalPassengers = 0;
    const updatedStops = stops.map(s => {
      if (String(s.id) === String(stopId)) {
        const existingStudents = s.students || [];
        const updated = existingStudents.filter(st => 
          String(st.id || st.student_id) !== String(studentToRemove.id || studentToRemove.student_id) &&
          st.name !== studentToRemove.name
        );
        totalPassengers += updated.length;
        return { ...s, students: updated };
      }
      totalPassengers += (s.students ? s.students.length : 0);
      return s;
    });

    setStops(updatedStops);
    setCapacityUsed(totalPassengers);
    try {
      localStorage.setItem(`sbms_route_stops_${routeId}`, JSON.stringify(updatedStops));
    } catch (e) {}

    await syncStopsWithBackend(updatedStops);
  };

  const handleConfirmRemoveStudent = async () => {
    if (!studentToRemoveData || isRemovingStudent) return;
    setIsRemovingStudent(true);
    try {
      await handleRemoveStudentFromStop(studentToRemoveData.stopId, studentToRemoveData.student);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRemovingStudent(false);
      setIsRemoveStudentModalOpen(false);
      setStudentToRemoveData(null);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudentStopId || !selectedStudentObj) return;

    const studentToAssign = selectedStudentObj;

    let totalPassengers = 0;
    const updatedStops = stops.map(s => {
      if (String(s.id) === String(selectedStudentStopId)) {
        const existingStudents = s.students || [];
        const exists = existingStudents.some(st => 
          String(st.id || st.student_id) === String(studentToAssign.id || studentToAssign.student_id) || 
          st.name === studentToAssign.name
        );
        const updated = exists ? existingStudents : [...existingStudents, studentToAssign];
        totalPassengers += updated.length;
        return { ...s, students: updated };
      }
      totalPassengers += (s.students ? s.students.length : 0);
      return s;
    });

    setStops(updatedStops);
    setCapacityUsed(totalPassengers);
    try {
      localStorage.setItem(`sbms_route_stops_${routeId}`, JSON.stringify(updatedStops));
    } catch (e) {}

    await syncStopsWithBackend(updatedStops);

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
    const updatedCustom = customStops.filter(s => s.id !== stopId);
    setCustomStops(updatedCustom);
    try {
      localStorage.setItem(`sbms_route_stops_${routeId}`, JSON.stringify(updatedStops));
      localStorage.setItem(`sbms_route_custom_stops_${routeId}`, JSON.stringify(updatedCustom));
    } catch (e) {}

    if (selectedStopId === stopId) {
      if (updatedStops.length > 0) {
        setSelectedStopId(updatedStops[0].id);
      } else {
        setSelectedStopId(null);
      }
    }

    await syncStopsWithBackend(updatedStops);

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
    try {
      localStorage.setItem(`sbms_route_stops_${routeId}`, JSON.stringify(stops));
    } catch (e) {}
    syncStopsWithBackend(stops);
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

  const availableDrivers = useMemo(() => {
    const currentRouteTime = '07:00 AM - 08:30 AM';
    const currentNumericRouteId = routeId ? parseInt(String(routeId).replace('route-', ''), 10) : null;

    if (rawUsers && rawUsers.length > 0) {
      const drivers = rawUsers.filter(u => {
        const role = (u.role || '').toLowerCase();
        return role === 'driver' || role === 'admin';
      });

      const listToUse = drivers.length > 0 ? drivers : rawUsers;

      return listToUse.map(u => {
        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || `User #${u.user_id}`;
        const initials = getInitials(fullName);

        // Detect if driver is already assigned to a different route with an overlapping schedule
        const conflictingRoute = rawRoutes.find(r => {
          const rNumId = r.route_id;
          if (currentNumericRouteId && String(rNumId) === String(currentNumericRouteId)) return false;
          if (String(r.route_id) === String(routeId) || `route-${r.route_id}` === routeId) return false;

          const isAssignedToOtherRoute = 
            String(r.driver_id) === String(u.user_id) || 
            (r.driver && String(r.driver.user_id) === String(u.user_id));

          if (!isAssignedToOtherRoute) return false;

          const otherRouteTime = '07:00 AM - 08:30 AM';
          return isTimeOverlapping(currentRouteTime, otherRouteTime);
        });

        let status = u.status === false ? 'On Leave' : 'Available';
        let isOverlapping = false;
        let conflictInfo = null;

        if (conflictingRoute) {
          isOverlapping = true;
          status = 'Schedule Conflict';
          conflictInfo = `Assigned to ${conflictingRoute.route_name || 'Route #' + conflictingRoute.route_id}`;
        }

        return {
          id: String(u.user_id),
          user_id: u.user_id,
          name: fullName,
          number: `#${u.user_id}`,
          license: u.phone_number ? `Contact: ${u.phone_number}` : `Driver ID: ${u.user_id}`,
          expiry: u.email || 'N/A',
          status,
          isOverlapping,
          conflictInfo,
          avatar: initials,
          rawUserObj: u
        };
      });
    }
    return [];
  }, [rawUsers, rawRoutes, routeId]);

  const filteredDrivers = useMemo(() => {
    let list = availableDrivers;
    if (activeDriver && activeDriver !== 'Unassigned') {
      list = list.filter(d => d.name.toLowerCase() !== activeDriver.toLowerCase() && String(d.user_id) !== String(assigningDriverId));
    }
    if (!driverSearch.trim()) return list;
    const term = driverSearch.toLowerCase();
    return list.filter(d =>
      d.name.toLowerCase().includes(term) ||
      d.number.toLowerCase().includes(term) ||
      d.license.toLowerCase().includes(term)
    );
  }, [availableDrivers, driverSearch, activeDriver, assigningDriverId]);

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
                <button
                  type="button"
                  onClick={handleOpenDeleteRouteModal}
                  title="Delete Route"
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
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
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.18)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
              <p className="canvas-subtitle" style={{ fontSize: '14px', margin: '4px 0 8px 0' }}>
                Route Stop sequence and dynamic assignment planner for Phnom Penh District.
              </p>

              {/* Prominent Assigned Bus & Driver Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <div 
                  onClick={() => setIsBusModalOpen(true)}
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    backgroundColor: 'rgba(0, 35, 111, 0.08)', 
                    color: 'var(--primary-brand)', 
                    padding: '5px 14px', 
                    borderRadius: '20px', 
                    fontSize: '13px', 
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: '1px solid rgba(0, 35, 111, 0.15)'
                  }}
                  title="Click to Change Assigned Bus"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 35, 111, 0.14)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 35, 111, 0.08)'}
                >
                  <Bus size={15} />
                  Assigned Bus: {activeBus}
                  <span style={{ fontSize: '11px', fontWeight: 600, opacity: 0.8, textDecoration: 'underline', marginLeft: '4px' }}>Change</span>
                </div>

                <div 
                  onClick={() => setIsDriverModalOpen(true)}
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    backgroundColor: '#f1f5f9', 
                    color: '#334155', 
                    padding: '5px 14px', 
                    borderRadius: '20px', 
                    fontSize: '13px', 
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: '1px solid rgba(148, 163, 184, 0.2)'
                  }}
                  title="Click to Change Driver"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                >
                  <User size={15} style={{ color: 'var(--primary-brand)' }} />
                  Driver: {activeDriver}
                </div>
              </div>
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
                onClick={() => setIsBusModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Bus size={14} />
                Assign Bus
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
                    <div key={`stop_${stop.id}_${index}`} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
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
                          {!isArrival && stop.id !== 'start' && stop.pinCategory !== 'Start Depot' && (
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
                                  stop.students.map((st, stIdx) => (
                                    <span 
                                      key={`st_${st.id || st.student_id || st.name}_${stIdx}`}
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
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setStudentToRemoveData({ stopId: stop.id, student: st });
                                          setIsRemoveStudentModalOpen(true);
                                        }}
                                        title={`Remove ${st.name} from route stop`}
                                        style={{
                                          border: 'none',
                                          backgroundColor: '#fee2e2',
                                          color: '#ef4444',
                                          borderRadius: '50%',
                                          width: '20px',
                                          height: '20px',
                                          cursor: 'pointer',
                                          fontSize: '11px',
                                          fontWeight: 'bold',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          marginLeft: '4px',
                                          transition: 'all 0.15s ease',
                                          flexShrink: 0
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#ef4444';
                                          e.currentTarget.style.color = '#ffffff';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = '#fee2e2';
                                          e.currentTarget.style.color = '#ef4444';
                                        }}
                                      >
                                        ✕
                                      </button>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-brand)' }}>
                            Bus {activeBus}
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsBusModalOpen(true)}
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              color: 'var(--primary-brand)',
                              backgroundColor: 'rgba(0, 35, 111, 0.08)',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              cursor: 'pointer'
                            }}
                          >
                            Change
                          </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--icon-color)' }}>
                            Driver: {activeDriver}
                          </span>
                          {activeDriver && activeDriver !== 'Unassigned' && (
                            <button
                              type="button"
                              onClick={handleRemoveDriver}
                              title="Remove Driver"
                              disabled={assigningDriverId !== null}
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                color: '#dc2626',
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fca5a5',
                                borderRadius: '4px',
                                padding: '1px 6px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <UserX size={11} />
                              Unassign
                            </button>
                          )}
                        </div>
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
                <p style={{ fontSize: '12px', color: 'var(--icon-color)', margin: '4px 0 0 0' }}>{displayRouteName}</p>
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
                {activeDriver && activeDriver !== 'Unassigned' && (
                  <div
                    onClick={() => assigningDriverId === null && handleRemoveDriver()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      border: '1px dashed #ef4444',
                      borderRadius: '8px',
                      cursor: assigningDriverId !== null ? 'not-allowed' : 'pointer',
                      backgroundColor: '#fef2f2',
                      marginBottom: '4px',
                      transition: 'all 0.2s',
                      pointerEvents: assigningDriverId !== null ? 'none' : 'auto'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626' }}>
                      <UserX size={16} />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>Unassign Current Driver</span>
                        <span style={{ fontSize: '11px', opacity: 0.8 }}>Currently: {activeDriver}</span>
                      </div>
                    </div>
                    {assigningDriverId === 'remove' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#dc2626' }}>
                        <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                        Removing...
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626', backgroundColor: '#ffffff', padding: '3px 8px', borderRadius: '4px', border: '1px solid #fca5a5' }}>
                        Remove Driver
                      </span>
                    )}
                  </div>
                )}
                <span className="modal-section-title" style={{ margin: '0 0 4px 0' }}>AVAILABLE DRIVERS</span>
                {filteredDrivers.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--icon-color)', fontSize: '13px' }}>
                    {rawUsers.length === 0 ? 'No drivers registered in the system.' : 'No drivers matching search.'}
                  </div>
                ) : (
                  filteredDrivers.map(d => {
                    const isAssigning = String(assigningDriverId) === String(d.id) || String(assigningDriverId) === String(d.user_id);
                    const isDisabled = d.status === 'On Leave' || d.isOverlapping || assigningDriverId !== null;

                    const getStatusClass = (status) => {
                      switch(status.toLowerCase()) {
                        case 'available': return 'driver-badge-available';
                        case 'assigned': return 'driver-badge-assigned';
                        case 'on leave': return 'driver-badge-leave';
                        case 'schedule conflict': return 'driver-badge-leave';
                        default: return 'driver-badge-available';
                      }
                    };

                    return (
                      <div 
                        key={d.id}
                        onClick={() => !isDisabled && handleAssignDriver(d)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px',
                          border: isAssigning ? '1px solid var(--primary-brand)' : '1px solid rgba(197, 197, 211, 0.2)',
                          borderRadius: '8px',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          opacity: (d.status === 'On Leave' || d.isOverlapping || (assigningDriverId !== null && !isAssigning)) ? 0.5 : 1,
                          backgroundColor: isAssigning ? 'rgba(0, 35, 111, 0.04)' : '#ffffff',
                          transition: 'all 0.2s',
                          pointerEvents: isDisabled ? 'none' : 'auto'
                        }}
                        className="driver-row-hover"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(0, 35, 111, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--primary-brand)' }}>
                            {d.avatar}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>{d.name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--icon-color)' }}>ID: {d.number} • {d.license}</span>
                            {d.isOverlapping && d.conflictInfo && (
                              <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 600, marginTop: '2px' }}>
                                ⚠️ Schedule conflict: {d.conflictInfo}
                              </span>
                            )}
                          </div>
                        </div>

                        {isAssigning ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--primary-brand)' }}>
                            <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                            Assigning...
                          </span>
                        ) : (
                          <span 
                            className={`driver-status-badge ${getStatusClass(d.status)}`}
                            style={d.isOverlapping ? { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' } : {}}
                          >
                            {d.status}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
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
              <Button type="button" variant="secondary" onClick={() => setIsStopModalOpen(false)} disabled={isAddingStop}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isAddingStop} disabled={isAddingStop}>
                {isAddingStop ? 'Saving Stop...' : 'Save & Link Pinned Stop'}
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
                    {stops.filter(s => s.type !== 'arrival' && s.id !== 'start' && s.pinCategory !== 'Start Depot').length === 0 ? (
                      <option value="" disabled>No pick-up stops available (add a stop first)</option>
                    ) : (
                      stops.filter(s => s.type !== 'arrival' && s.id !== 'start' && s.pinCategory !== 'Start Depot').map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.address})</option>
                      ))
                    )}
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

              </div>
            </div>

            <div className="modal-footer">
              <Button 
                type="button" 
                variant="secondary" 
                disabled={manageStopsMutation.isPending}
                onClick={() => {
                  setIsStudentModalOpen(false);
                  setSelectedStudentObj(null);
                  setStudentSearchTerm('');
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!selectedStudentStopId || !selectedStudentObj || manageStopsMutation.isPending}
                isLoading={manageStopsMutation.isPending}
              >
                {manageStopsMutation.isPending ? 'Registering...' : 'Register Student'}
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

      {/* --- Remove Student Confirmation Modal --- */}
      {isRemoveStudentModalOpen && studentToRemoveData && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserX size={18} style={{ color: '#ef4444' }} />
                Remove Student from Stop
              </h2>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => {
                  if (!isRemovingStudent) {
                    setIsRemoveStudentModalOpen(false);
                    setStudentToRemoveData(null);
                  }
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px', textAlign: 'left' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-dark)', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to remove <strong>{studentToRemoveData.student?.name}</strong> from this pick-up stop?
              </p>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '8px 0 0 0', fontWeight: 500 }}>
                This will unassign the student from the stop and update the live route manifest for the driver.
              </p>
            </div>

            <div className="modal-footer" style={{ backgroundColor: '#fafbfc' }}>
              <Button 
                type="button" 
                variant="secondary" 
                disabled={isRemovingStudent}
                onClick={() => {
                  setIsRemoveStudentModalOpen(false);
                  setStudentToRemoveData(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                disabled={isRemovingStudent}
                isLoading={isRemovingStudent}
                onClick={handleConfirmRemoveStudent}
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
              >
                {isRemovingStudent ? 'Removing...' : 'Confirm Remove'}
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

      {/* --- Delete Route Confirmation Modal --- */}
      {isDeleteRouteModalOpen && (
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
                onClick={() => setIsDeleteRouteModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px', textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dark)' }}>
                Are you sure you want to delete <strong style={{ color: '#ef4444' }}>{displayRouteName}</strong>?
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
                onClick={() => setIsDeleteRouteModalOpen(false)}
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

      {/* --- Assign Bus Modal --- */}
      {isBusModalOpen && (
        <div className="modal-overlay">
          <form onSubmit={handleAssignBusSubmit} className="modal-card" style={{ maxWidth: '480px', width: '92%' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bus size={18} style={{ color: 'var(--primary-brand)' }} />
                  Assign Vehicle / Bus to Route
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--icon-color)', margin: '2px 0 0 0', textAlign: 'left' }}>
                  Select an active fleet bus from the system to assign to this route.
                </p>
              </div>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => {
                  setIsBusModalOpen(false);
                  setSelectedBusObj(null);
                  setBusSearchTerm('');
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                <Input 
                  type="text" 
                  icon={<Search size={14} />}
                  placeholder="Search bus number or capacity..."
                  value={busSearchTerm}
                  onChange={(e) => setBusSearchTerm(e.target.value)}
                />

                <div 
                  style={{
                    maxHeight: '220px',
                    overflowY: 'auto',
                    border: '1px solid rgba(197, 197, 211, 0.4)',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {filteredBuses.length > 0 ? (
                    filteredBuses.map((b) => {
                      const isSelected = selectedBusObj && selectedBusObj.id === b.id;
                      const isDisabled = b.isOverlapping && !isSelected;
                      return (
                        <div
                          key={b.id}
                          onClick={() => {
                            if (isDisabled) return;
                            setSelectedBusObj(b);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderBottom: '1px solid rgba(197, 197, 211, 0.15)',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            backgroundColor: isSelected ? 'rgba(0, 35, 111, 0.06)' : (isDisabled ? '#f8fafc' : 'transparent'),
                            opacity: isDisabled ? 0.6 : 1,
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: isDisabled ? '#e2e8f0' : 'rgba(0, 35, 111, 0.08)', color: isDisabled ? '#94a3b8' : 'var(--primary-brand)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Bus size={15} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: isDisabled ? '#94a3b8' : 'var(--text-dark)' }}>{b.busNumber}</span>
                                {isDisabled && (
                                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#dc2626', backgroundColor: '#fee2e2', padding: '1px 6px', borderRadius: '4px' }}>
                                    ⚠️ Schedule Overlap
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--icon-color)' }}>
                                {isDisabled ? `Conflicts with ${b.conflictInfo}` : `Capacity: ${b.capacity} seats • ${b.status}`}
                              </span>
                            </div>
                          </div>

                          {isSelected ? (
                            <Check size={16} style={{ color: 'var(--primary-brand)' }} />
                          ) : (
                            !isDisabled && <span style={{ fontSize: '11px', color: 'var(--primary-brand)', fontWeight: 600 }}>Select</span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                      No matching buses found
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <Button 
                type="button" 
                variant="secondary" 
                disabled={assignBusMutation.isPending}
                onClick={() => {
                  setIsBusModalOpen(false);
                  setSelectedBusObj(null);
                  setBusSearchTerm('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedBusObj || assignBusMutation.isPending}>
                {assignBusMutation.isPending ? 'Assigning...' : 'Assign Bus to Route'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RouteDetailPage;
