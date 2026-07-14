// Mock data for the Student Management Hub

export const INITIAL_STUDENTS = [
  {
    id: '#STU-202401',
    name: 'Alex Johnson',
    guardianName: 'Sarah Johnson',
    grade: 'Grade 10',
    assignedRoute: 'Route 1',
    gender: 'Male',
    phone: '555-0201',
    isActive: true
  },
  {
    id: '#STU-202402',
    name: 'Marcus Brown',
    guardianName: 'James Brown',
    grade: 'Grade 10',
    assignedRoute: 'Route 2',
    gender: 'Male',
    phone: '555-0202',
    isActive: true
  },
  {
    id: '#STU-202403',
    name: 'Emily Davis',
    guardianName: 'Michael Davis',
    grade: 'Grade 11',
    assignedRoute: 'Route 4',
    gender: 'Female',
    phone: '555-0203',
    isActive: true
  },
  {
    id: '#STU-202404',
    name: 'Sophia Wilson',
    guardianName: 'Robert Wilson',
    grade: 'Grade 9',
    assignedRoute: 'Route 1',
    gender: 'Female',
    phone: '555-0204',
    isActive: true
  },
  {
    id: '#STU-202405',
    name: 'Liam Martinez',
    guardianName: 'Linda Martinez',
    grade: 'Grade 12',
    assignedRoute: 'Route 4',
    gender: 'Male',
    phone: '555-0205',
    isActive: true
  },
  {
    id: '#STU-202406',
    name: 'Olivia Taylor',
    guardianName: 'David Taylor',
    grade: 'Grade 10',
    assignedRoute: 'Route 2',
    gender: 'Female',
    phone: '555-0206',
    isActive: true
  },
  {
    id: '#STU-202407',
    name: 'Lucas Anderson',
    guardianName: 'Karen Anderson',
    grade: 'Grade 11',
    assignedRoute: 'Unassigned',
    gender: 'Male',
    phone: '555-0207',
    isActive: true
  },
  {
    id: '#STU-202408',
    name: 'Emma Thomas',
    guardianName: 'Joseph Thomas',
    grade: 'Grade 9',
    assignedRoute: 'Route 1',
    gender: 'Female',
    phone: '555-0208',
    isActive: true
  }
];

export const STUDENT_STATS = {
  totalStudents: { value: '1,284', change: '+12% from last term' },
  currentlyEnrolled: { value: '1,240', rate: '96.5% Enrollment rate' },
  suspendedAccounts: { value: '18', status: 'Requires immediate review' },
  transportUsers: { value: '912', status: 'Active bus assignments' }
};
