// Mock data and specifications for the fleet management system

export const INITIAL_FLEET = [
  { id: '#402-A', capacity: 65, status: 'Active' },
  { id: '#315-B', capacity: 92, status: 'Active' },
  { id: '#108-C', capacity: 0, status: 'Maintenance' }
];

export const INITIAL_REPAIRS = [
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

// Complete specs template matching the Figma design for active fleet
export const BUS_DETAILS_STATIC = {
  '#402-A': {
    model: '2019 Thomas Saf-T-Liner C2',
    route: 'Route 14A',
    fullRoute: 'Northside 14A',
    driver: 'Sarah Jenkins',
    fuelType: 'Diesel',
    capacityUsed: 54,
    capacityTotal: 72,
    licensePlate: 'S-84729',
    mileage: '84,291 mi',
    makeModel: 'Thomas Saf-T-Liner C2',
    year: '2019',
    documents: [
      { name: 'State Registration', status: 'Expires: Dec 2024' },
      { name: 'Commercial Insurance', status: 'Expires: Dec 2027' },
      { name: 'Annual Inspection Cert.', status: 'Valid until Aug 2024' }
    ],
    maintenanceLogs: [
      { date: 'Oct 12, 2023', type: 'Standard PM (Level B)', mileage: '82,100', status: 'Completed' },
      { date: 'Aug 05, 2023', type: 'Tire Replacement (Rear)', mileage: '78,450', status: 'Completed' },
      { date: 'May 20, 2023', type: 'Brake Inspection & Pad Swap', mileage: '75,200', status: 'Completed' }
    ]
  },
  '#315-B': {
    model: '2021 Blue Bird All American',
    route: 'Route 22 - West',
    fullRoute: 'Westside Express 22',
    driver: 'Marcus Johnson',
    fuelType: 'Electric',
    capacityUsed: 83,
    capacityTotal: 90,
    licensePlate: 'E-91024',
    mileage: '32,150 mi',
    makeModel: 'Blue Bird All American',
    year: '2021',
    documents: [
      { name: 'State Registration', status: 'Expires: Jun 2025' },
      { name: 'Commercial Insurance', status: 'Expires: Dec 2027' },
      { name: 'Annual Inspection Cert.', status: 'Valid until Mar 2025' }
    ],
    maintenanceLogs: [
      { date: 'Jun 10, 2025', type: 'Battery Health Diagnostics', mileage: '31,800', status: 'Completed' },
      { date: 'Jan 15, 2025', type: 'Cabin Filter & Alignment', mileage: '28,400', status: 'Completed' }
    ]
  },
  '#108-C': {
    model: '2017 IC Bus CE Series',
    route: 'Unassigned',
    fullRoute: 'None (Out of Service)',
    driver: 'Unassigned',
    fuelType: 'Propane',
    capacityUsed: 0,
    capacityTotal: 65,
    licensePlate: 'P-11208',
    mileage: '112,480 mi',
    makeModel: 'IC Bus CE Series',
    year: '2017',
    documents: [
      { name: 'State Registration', status: 'Expires: Oct 2024' },
      { name: 'Commercial Insurance', status: 'Expires: Dec 2027' },
      { name: 'Annual Inspection Cert.', status: 'Expired (Oct 2023)' }
    ],
    maintenanceLogs: [
      { date: 'Jul 18, 2023', type: 'AC Compressor Replacement', mileage: '109,200', status: 'Completed' }
    ]
  }
};

// Returns dynamic specifications for a bus ID, synthesizing current state data
export const getBusDetails = (busId, fleetList = [], repairsList = []) => {
  // Find current bus in state list
  const busState = fleetList.find(b => b.id === busId);
  const staticDetails = BUS_DETAILS_STATIC[busId];

  // Synthesize matching details if not defined
  if (!staticDetails) {
    const isMaintenance = busState ? busState.status === 'Maintenance' : false;
    const capacityVal = busState ? busState.capacity : 60;
    
    // Fallback generation for any custom registered/logged buses
    return {
      model: 'General Transport Bus',
      route: isMaintenance ? 'Unassigned' : 'General District Route',
      fullRoute: isMaintenance ? 'None (Out of Service)' : 'District Central Loop',
      driver: isMaintenance ? 'Unassigned' : 'Substitute Driver',
      fuelType: 'Diesel',
      capacityUsed: isMaintenance ? 0 : Math.round(capacityVal * 0.8),
      capacityTotal: 80,
      licensePlate: `TX-${busId.replace(/[^0-9a-zA-Z]/g, '') || '9999'}`,
      mileage: '45,000 mi',
      makeModel: 'General School Bus',
      year: '2020',
      documents: [
        { name: 'State Registration', status: 'Expires: Dec 2026' },
        { name: 'Commercial Insurance', status: 'Expires: Dec 2027' },
        { name: 'Annual Inspection Cert.', status: isMaintenance ? 'Pending' : 'Valid until Nov 2026' }
      ],
      maintenanceLogs: repairsList
        .filter(r => r.id === busId)
        .map(r => ({
          date: r.date,
          type: r.issue,
          mileage: '45,000',
          status: 'In Progress'
        }))
    };
  }

  // If staticDetails exists, merge it with dynamic maintenance records
  const dynamicLogs = repairsList
    .filter(r => r.id === busId)
    .map(r => ({
      date: r.date,
      type: r.issue,
      mileage: staticDetails.mileage.replace(' mi', ''),
      status: 'In Progress'
    }));

  return {
    ...staticDetails,
    status: busState ? busState.status : staticDetails.status,
    maintenanceLogs: [...dynamicLogs, ...staticDetails.maintenanceLogs]
  };
};
