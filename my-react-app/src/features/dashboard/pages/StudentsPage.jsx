import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bus, Users, LogOut, Search, Plus, 
  SlidersHorizontal, Download, ChevronLeft, ChevronRight, X, 
  GraduationCap, Trash2, Edit3, UserCheck, AlertTriangle, Filter, MapPin
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from '../hooks/useStudents';
import '../styles/dashboard.css';

// Initial stats for Bento grid (static text as in Figma but dynamic total count)
const BASE_STATS = {
  currentlyEnrolled: { rate: '96.5% Enrollment rate' },
  suspendedAccounts: { value: 18, status: 'Requires immediate review' },
  transportUsers: { value: 912, status: 'Active bus assignments' }
};

const StudentsPage = ({ user, onSignOut }) => {
  const { data: rawStudents = [], isLoading, error } = useStudents();
  const createStudentMutation = useCreateStudent();
  const updateStudentMutation = useUpdateStudent();
  const deleteStudentMutation = useDeleteStudent();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [routeFilter, setRouteFilter] = useState('All');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const students = useMemo(() => {
    return rawStudents.map(s => {
      const primaryGuardian = s.guardians && s.guardians[0];
      const guardianUser = primaryGuardian && primaryGuardian.user;
      const guardianNameStr = guardianUser ? `${guardianUser.first_name} ${guardianUser.last_name}` : 'No Guardian';
      const guardianPhoneStr = guardianUser ? guardianUser.phone_number : 'N/A';
      
      // Route details
      const stopObj = s.stops && s.stops.length > 0 ? s.stops[0] : null;
      const assignedRouteStr = stopObj ? (stopObj.route_name || stopObj.name || `Route #${stopObj.route_id || stopObj.id}`) : 'Unassigned';

      return {
        id: String(s.student_id),
        name: `${s.first_name} ${s.last_name}`,
        guardianName: guardianNameStr,
        grade: s.grade_level || 'Grade 10',
        assignedRoute: assignedRouteStr,
        gender: s.gender ? (s.gender.charAt(0).toUpperCase() + s.gender.slice(1)) : 'Male',
        phone: guardianPhoneStr || 'N/A',
        isActive: true,
      };
    });
  }, [rawStudents]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // Form Fields State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [grade, setGrade] = useState('Grade 10');
  const [assignedRoute, setAssignedRoute] = useState('Unassigned');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Delete Confirmation State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Helper to extract initials
  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Helper to assign a route class
  const getRouteClass = (route) => {
    if (!route || route === 'Unassigned') return 'badge-route-unassigned';
    if (route.includes('1')) return 'badge-route-1';
    if (route.includes('2')) return 'badge-route-2';
    if (route.includes('4')) return 'badge-route-4';
    return 'badge-route-unassigned';
  };

  // Calculate dynamic stats
  const stats = useMemo(() => {
    // Total is mock (1284) plus/minus any change in student length relative to original
    const delta = students.length - 8;
    const total = 1284 + delta;
    const enrolled = 1240 + delta;
    const transport = 912 + students.filter(s => s.assignedRoute !== 'Unassigned').length - students.filter(s => s.assignedRoute !== 'Unassigned').length; // simple scale
    
    return {
      totalStudents: { value: total.toLocaleString(), change: '+12% from last term' },
      currentlyEnrolled: { value: enrolled.toLocaleString(), rate: BASE_STATS.currentlyEnrolled.rate },
      suspendedAccounts: { value: BASE_STATS.suspendedAccounts.value, status: BASE_STATS.suspendedAccounts.status },
      transportUsers: { value: (912 + delta).toLocaleString(), status: BASE_STATS.transportUsers.status }
    };
  }, [students]);

  // Search & Filter logic
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.guardianName.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesGrade = gradeFilter === 'All' || s.grade === gradeFilter;
      const matchesRoute = routeFilter === 'All' || s.assignedRoute === routeFilter;

      return matchesSearch && matchesGrade && matchesRoute;
    });
  }, [students, searchQuery, gradeFilter, routeFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Modal Openers
  const openAddModal = () => {
    setModalMode('add');
    setSelectedStudentId(null);
    setFirstName('');
    setLastName('');
    setGuardianName('');
    setGrade('Grade 10');
    setAssignedRoute('Unassigned');
    setGender('Male');
    setPhone('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setModalMode('edit');
    setSelectedStudentId(student.id);
    const names = student.name.split(' ');
    setFirstName(names[0] || '');
    setLastName(names.slice(1).join(' ') || '');
    setGuardianName(student.guardianName || '');
    setGrade(student.grade || 'Grade 10');
    setAssignedRoute(student.assignedRoute || 'Unassigned');
    setGender(student.gender || 'Male');
    setPhone(student.phone || '');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!firstName.trim()) errors.firstName = 'First Name is required';
    if (!lastName.trim()) errors.lastName = 'Last Name is required';
    if (!guardianName.trim()) errors.guardianName = 'Guardian Name is required';
    if (!phone.trim()) errors.phone = 'Phone Number is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const studentData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        gender: gender.toLowerCase(),
        student_code: modalMode === 'add' ? `STU-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
        date_of_birth: '2015-06-15',
        grade_level: grade,
        pickup_add: 'Pickup Address',
        dropoff_add: 'Dropoff Address',
      };

      if (modalMode === 'add') {
        await createStudentMutation.mutateAsync(studentData);
      } else {
        await updateStudentMutation.mutateAsync({ id: selectedStudentId, studentData });
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormErrors(prev => ({ ...prev, submit: err.message || 'Failed to save student details' }));
    }
  };

  // Delete student handler
  const handleDeleteStudent = (id) => {
    const student = students.find(s => s.id === id);
    setStudentToDelete(student || { id });
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      await deleteStudentMutation.mutateAsync(studentToDelete.id);
    } catch (err) {
      console.warn('Delete student error:', err);
    } finally {
      setStudentToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
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
          <Link to="/students" className="sidebar-link is-active">
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
          <Link to="/logistics" className="sidebar-link">
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

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Top Navbar */}
        <header className="top-navbar">
          <h2 className="top-navbar-title">SBMS Dashboard</h2>

          <div className="top-navbar-actions">
            <div className="top-navbar-search">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset page to 1 on search
                }}
              />
            </div>

            <div className="top-navbar-profile">
              <div className="profile-avatar">AM</div>
              <span>Alex Mercer</span>
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="content-canvas">
          {/* Page Header */}
          <div className="canvas-header">
            <div className="header-text-container">
              <h2 className="canvas-title">Student Management</h2>
              <p className="canvas-subtitle">Manage enrollments, transport records, and student profiles.</p>
            </div>
            <button 
              type="button" 
              className="add-user-btn" 
              onClick={openAddModal}
            >
              <Plus size={16} />
              Add Student
            </button>
          </div>

          {/* Bento Grid Stats */}
          <div className="bento-grid">
            <div className="bento-card">
              <span className="bento-card-title">TOTAL STUDENTS</span>
              <span className="bento-card-value">{stats.totalStudents.value}</span>
              <span className="bento-card-subtext" style={{ color: '#16a34a', fontWeight: '600' }}>
                {stats.totalStudents.change}
              </span>
            </div>

            <div className="bento-card">
              <span className="bento-card-title">CURRENTLY ENROLLED</span>
              <span className="bento-card-value">{stats.currentlyEnrolled.value}</span>
              <span className="bento-card-subtext">{stats.currentlyEnrolled.rate}</span>
            </div>

            <div className="bento-card">
              <span className="bento-card-title">SUSPENDED ACCOUNTS</span>
              <span className="bento-card-value" style={{ color: '#dc2626' }}>
                {stats.suspendedAccounts.value}
              </span>
              <span className="bento-card-subtext" style={{ color: '#dc2626', fontWeight: '500' }}>
                <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
                {stats.suspendedAccounts.status}
              </span>
            </div>

            <div className="bento-card">
              <span className="bento-card-title">TRANSPORT USERS</span>
              <span className="bento-card-value">{stats.transportUsers.value}</span>
              <span className="bento-card-subtext" style={{ color: 'var(--primary-brand)', fontWeight: '500' }}>
                {stats.transportUsers.status}
              </span>
            </div>
          </div>

          {/* Filters and Actions Row */}
          <div className="filters-row">
            <div className="filter-tabs">
              <button 
                type="button" 
                className={`filter-tab ${gradeFilter === 'All' ? 'is-active' : ''}`}
                onClick={() => { setGradeFilter('All'); setCurrentPage(1); }}
              >
                All Grades
              </button>
              <button 
                type="button" 
                className={`filter-tab ${gradeFilter === 'Grade 9' ? 'is-active' : ''}`}
                onClick={() => { setGradeFilter('Grade 9'); setCurrentPage(1); }}
              >
                Grade 9
              </button>
              <button 
                type="button" 
                className={`filter-tab ${gradeFilter === 'Grade 10' ? 'is-active' : ''}`}
                onClick={() => { setGradeFilter('Grade 10'); setCurrentPage(1); }}
              >
                Grade 10
              </button>
              <button 
                type="button" 
                className={`filter-tab ${gradeFilter === 'Grade 11' ? 'is-active' : ''}`}
                onClick={() => { setGradeFilter('Grade 11'); setCurrentPage(1); }}
              >
                Grade 11
              </button>
              <button 
                type="button" 
                className={`filter-tab ${gradeFilter === 'Grade 12' ? 'is-active' : ''}`}
                onClick={() => { setGradeFilter('Grade 12'); setCurrentPage(1); }}
              >
                Grade 12
              </button>
            </div>

            <div className="filters-actions">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* Route filter selector */}
                <select 
                  className="select-input" 
                  style={{ padding: '6px 28px 6px 12px', fontSize: '13px', width: '160px', height: '36px', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%235c5f62\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundPosition: 'right 8px center', backgroundSize: '12px' }}
                  value={routeFilter}
                  onChange={(e) => { setRouteFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="All">All Routes</option>
                  <option value="Route 1">Route 1</option>
                  <option value="Route 2">Route 2</option>
                  <option value="Route 4">Route 4</option>
                  <option value="Unassigned">Unassigned</option>
                </select>

                <button type="button" className="action-btn" onClick={() => alert('Exporting student directory CSV...')}>
                  <Download size={14} />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Directory card */}
          <Card className="directory-card">
            <div className="directory-table-container">
              <table className="directory-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Guardian Name</th>
                    <th>Grade</th>
                    <th>Assigned Route</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                 <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--primary-brand)' }}>
                        <div className="ui-button-spinner" style={{ display: 'inline-block', borderTopColor: 'var(--primary-brand)', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }} />
                        <span style={{ marginLeft: '8px', verticalAlign: 'middle' }}>Loading students...</span>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#dc2626' }}>
                        Error loading students: {error}
                      </td>
                    </tr>
                  ) : paginatedStudents.length > 0 ? (
                    paginatedStudents.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: '600', color: 'var(--primary-brand)', fontSize: '13px' }}>
                          {s.id}
                        </td>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar-circle" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                              {getInitials(s.name)}
                            </div>
                            <div className="user-info">
                              <span className="user-name">{s.name}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: '500' }}>{s.guardianName}</span>
                        </td>
                        <td>
                          <span className="role-badge badge-grade">
                            {s.grade}
                          </span>
                        </td>
                        <td>
                          <span className={`role-badge ${getRouteClass(s.assignedRoute)}`}>
                            {s.assignedRoute}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="action-btn"
                              style={{ padding: '6px', minWidth: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => openEditModal(s)}
                              title="Edit Student"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              className="action-btn"
                              style={{ padding: '6px', minWidth: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: '#fecaca', color: '#dc2626' }}
                              onClick={() => handleDeleteStudent(s.id)}
                              title="Delete Student"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--icon-color)' }}>
                        No students found matching filters or search queries.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination-footer">
              <span className="pagination-info">
                Showing {filteredStudents.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
              </span>

              <div className="pagination-controls">
                <button 
                  type="button" 
                  className="pagination-btn" 
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button 
                    key={idx + 1}
                    type="button" 
                    className={`pagination-btn ${currentPage === idx + 1 ? 'is-active' : ''}`}
                    onClick={() => handlePageChange(idx + 1)}
                  >
                    {idx + 1}
                  </button>
                ))}
                
                <button 
                  type="button" 
                  className="pagination-btn" 
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Add / Edit Student Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <header className="modal-header">
              <h2>{modalMode === 'add' ? 'Add New Student Record' : 'Edit Student Record'}</h2>
              <button type="button" className="modal-close-btn" onClick={closeModal}>
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {formErrors.submit && (
                  <div style={{ color: '#ef4444', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
                    {formErrors.submit}
                  </div>
                )}
                {/* Personal Info Title */}
                <div className="modal-section-title">Student Information</div>
                <div className="modal-row-2col">
                  <Input
                    label="First Name"
                    id="studentFirstName"
                    placeholder="e.g. Alex"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    error={formErrors.firstName}
                  />
                  <Input
                    label="Last Name"
                    id="studentLastName"
                    placeholder="e.g. Johnson"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    error={formErrors.lastName}
                  />
                </div>

                <div className="modal-row-2col">
                  <div className="select-input-wrapper">
                    <label htmlFor="studentGender" className="ui-input-label">Gender</label>
                    <select
                      id="studentGender"
                      className="select-input"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="select-input-wrapper">
                    <label htmlFor="studentGrade" className="ui-input-label">Grade</label>
                    <select
                      id="studentGrade"
                      className="select-input"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                    >
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                    </select>
                  </div>
                </div>

                <div className="modal-section-title">Guardian & Contact</div>
                <Input
                  label="Guardian Full Name"
                  id="guardianFullName"
                  placeholder="e.g. Sarah Johnson"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  error={formErrors.guardianName}
                />

                <div className="modal-row-2col">
                  <Input
                    label="Contact Phone"
                    id="contactPhone"
                    placeholder="e.g. 555-0100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    error={formErrors.phone}
                  />

                  <div className="select-input-wrapper">
                    <label htmlFor="assignedRoute" className="ui-input-label">Assigned Route</label>
                    <select
                      id="assignedRoute"
                      className="select-input"
                      value={assignedRoute}
                      onChange={(e) => setAssignedRoute(e.target.value)}
                    >
                      <option value="Unassigned">Unassigned</option>
                      <option value="Route 1">Route 1</option>
                      <option value="Route 2">Route 2</option>
                      <option value="Route 4">Route 4</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                >
                  {modalMode === 'add' ? 'Add Student' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-container" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: '#ef4444' }}>⚠️ Delete Student</h2>
            </div>
            <div style={{ padding: '20px 0', color: 'var(--text-secondary)' }}>
              Are you sure you want to permanently delete{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {studentToDelete?.name || 'this student'}
              </strong>
              ? This will also remove all their stop and guardian assignments. This action cannot be undone.
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setIsDeleteConfirmOpen(false); setStudentToDelete(null); }}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={confirmDeleteStudent}
                disabled={deleteStudentMutation.isPending}
                style={{
                  padding: '8px 20px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: deleteStudentMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: deleteStudentMutation.isPending ? 0.7 : 1,
                }}
              >
                {deleteStudentMutation.isPending ? 'Deleting...' : 'Delete Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
