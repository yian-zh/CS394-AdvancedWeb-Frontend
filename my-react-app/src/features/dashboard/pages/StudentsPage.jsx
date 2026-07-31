import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bus, Users, LogOut, Search, Plus, 
  SlidersHorizontal, Download, X, 
  GraduationCap, Trash2, Edit3, UserCheck, AlertTriangle, MapPin, CheckCircle2, DollarSign, Activity, Ban
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Pagination from '../../../components/ui/Pagination';
import AsyncSelect from '../../../components/ui/AsyncSelect';
import { useDebounce } from '../../../hooks/useDebounce';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, useToggleStudentStatus } from '../hooks/useStudents';
import { dashboardService } from '../services/dashboardService';
import { useRoutes } from '../hooks/useRoutes';
import '../styles/dashboard.css';

// Initial stats for Bento grid (static text as in Figma but dynamic total count)
const BASE_STATS = {
  currentlyEnrolled: { rate: '96.5% Enrollment rate' },
  suspendedAccounts: { value: 18, status: 'Requires immediate review' },
  transportUsers: { value: 912, status: 'Active bus assignments' }
};

const StudentsPage = ({ user, onSignOut }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Search state (must be before hooks that use debouncedSearch)
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [gradeFilter, setGradeFilter] = useState('All');
  const [routeFilter, setRouteFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const { data: studentsResponse, isLoading, error } = useStudents({ 
    page: currentPage, 
    perPage: itemsPerPage, 
    search: debouncedSearch,
    grade: gradeFilter,
    routeId: routeFilter,
    status: statusFilter
  });
  const rawStudents = studentsResponse?.data ?? [];
  const studentsMeta = studentsResponse?.meta ?? {
    total: studentsResponse?.total,
    last_page: studentsResponse?.last_page
  };
  const summaryStats = studentsResponse?.summary_stats;

  const { data: routesResponse } = useRoutes({ perPage: 200 });
  const rawRoutes = routesResponse?.data ?? [];
  const [guardianUserId, setGuardianUserId] = useState(null);
  const createStudentMutation = useCreateStudent();
  const updateStudentMutation = useUpdateStudent();
  const deleteStudentMutation = useDeleteStudent();
  const toggleStudentStatusMutation = useToggleStudentStatus();

  // Suspend Confirmation Modal State
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [studentToSuspend, setStudentToSuspend] = useState(null);
  
  const students = useMemo(() => {
    return rawStudents.map(s => {
      const primaryGuardian = s.guardians && s.guardians[0];
      const guardianUser = primaryGuardian && primaryGuardian.user;
      const guardianNameStr = guardianUser ? `${guardianUser.first_name} ${guardianUser.last_name}` : 'No Guardian';
      const guardianPhoneStr = guardianUser ? guardianUser.phone_number : 'N/A';
      
      // Route details: Pick the latest assigned route stop
      const latestStop = (s.stops && s.stops.length > 0)
        ? [...s.stops].sort((a, b) => (b.pivot?.student_stop_id || b.route_id || 0) - (a.pivot?.student_stop_id || a.route_id || 0))[0]
        : null;

      const assignedRouteStr = latestStop 
        ? (latestStop.route_name || latestStop.name || `Route #${latestStop.route_id || latestStop.id}`) 
        : 'Unassigned';

      return {
        id: String(s.student_id),
        name: `${s.first_name} ${s.last_name}`,
        guardianName: guardianNameStr,
        grade: s.grade_level || 'Grade 10',
        assignedRoute: assignedRouteStr,
        gender: s.gender ? (s.gender.charAt(0).toUpperCase() + s.gender.slice(1)) : 'Male',
        phone: guardianPhoneStr || 'N/A',
        status: s.enrollment_status || 'Enrolled',
        isSuspended: String(s.enrollment_status || '').toLowerCase() === 'suspended' || String(s.enrollment_status || '').toLowerCase() === 'inactive',
      };
    });
  }, [rawStudents]);

  const fetchGuardians = useCallback(async (search) => {
    const data = await dashboardService.getUsers({ search, perPage: 20 });
    return (data?.data ?? []).map(u => ({
      id: u.user_id || u.id,
      label: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
      sub: u.phone_number ? `Contact: ${u.phone_number}` : '',
      phone: u.phone_number || '',
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
    }));
  }, []);

  const handleGuardianSelect = (selectedGuardian) => {
    if (!selectedGuardian) {
      setGuardianName('');
      setPhone('');
      setGuardianUserId(null);
      return;
    }
    const name = typeof selectedGuardian === 'string' ? selectedGuardian : selectedGuardian.name || selectedGuardian.label;
    setGuardianName(name);
    setGuardianUserId(selectedGuardian?.user_id || selectedGuardian?.id || null);
    if (selectedGuardian?.phone && selectedGuardian.phone !== 'N/A') {
      setPhone(selectedGuardian.phone);
    }
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // Notification & Submit state
  const [notificationBanner, setNotificationBanner] = useState(null);
  const [initialFormState, setInitialFormState] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Calculate real system-wide stats from backend API aggregate summary or metadata
  const stats = useMemo(() => {
    const totalCount = summaryStats?.total_students ?? studentsMeta.total ?? rawStudents.length;
    const enrolledCount = summaryStats?.currently_enrolled ?? rawStudents.filter(s => 
      !s.enrollment_status || s.enrollment_status.toLowerCase() === 'active'
    ).length;
    const enrollmentRate = totalCount > 0 ? ((enrolledCount / totalCount) * 100).toFixed(1) : '100.0';

    const suspendedCount = summaryStats?.suspended_accounts ?? rawStudents.filter(s => 
      s.enrollment_status && (s.enrollment_status.toLowerCase() === 'suspended' || s.enrollment_status.toLowerCase() === 'inactive')
    ).length;

    const transportCount = summaryStats?.transport_users ?? rawStudents.filter(s => {
      const hasStops = s.stops && Array.isArray(s.stops) && s.stops.length > 0;
      return hasStops;
    }).length;

    return {
      totalStudents: { 
        value: totalCount.toLocaleString(), 
        change: totalCount > 0 ? `${totalCount} Total Student Records` : 'No Records'
      },
      currentlyEnrolled: { 
        value: enrolledCount.toLocaleString(), 
        rate: `${enrollmentRate}% Enrollment rate` 
      },
      suspendedAccounts: { 
        value: suspendedCount.toString(), 
        status: suspendedCount > 0 ? 'Requires administrative review' : 'No suspended accounts' 
      },
      transportUsers: { 
        value: transportCount.toLocaleString(), 
        status: `${transportCount} Active bus stop assignments` 
      }
    };
  }, [rawStudents, studentsMeta, summaryStats]);

  // Server-side filtered students
  const filteredStudents = students;

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
    setGuardianUserId(null);
    setFormErrors({});
    setInitialFormState(null);
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setGuardianUserId(null);
    setModalMode('edit');
    setSelectedStudentId(student.id);
    const names = student.name.split(' ');
    const fName = names[0] || '';
    const lName = names.slice(1).join(' ') || '';
    const gName = student.guardianName || '';
    const gr = student.grade || 'Grade 10';
    const route = student.assignedRoute || 'Unassigned';
    const gnd = student.gender || 'Male';
    const ph = student.phone || '';

    setFirstName(fName);
    setLastName(lName);
    setGuardianName(gName);
    setGrade(gr);
    setAssignedRoute(route);
    setGender(gnd);
    setPhone(ph);
    setFormErrors({});

    setInitialFormState({
      name: student.name,
      firstName: fName,
      lastName: lName,
      guardianName: gName,
      grade: gr,
      assignedRoute: route,
      gender: gnd,
      phone: ph,
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting || updateStudentMutation.isPending || createStudentMutation.isPending) return;
    setIsModalOpen(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || updateStudentMutation.isPending || createStudentMutation.isPending) return;

    const errors = {};
    if (!firstName.trim()) errors.firstName = 'First Name is required';
    if (!lastName.trim()) errors.lastName = 'Last Name is required';
    if (!guardianName.trim()) errors.guardianName = 'Guardian Name is required';
    if (!phone.trim()) errors.phone = 'Phone Number is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
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
        guardian_name: guardianName.trim(),
        guardian_user_id: guardianUserId,
      };

      if (modalMode === 'add') {
        await createStudentMutation.mutateAsync(studentData);
        setNotificationBanner({
          type: 'success',
          title: 'New Student Record Created',
          studentName: `${firstName.trim()} ${lastName.trim()}`,
          changesList: [
            { field: 'Student Name', oldVal: null, newVal: `${firstName.trim()} ${lastName.trim()}` },
            { field: 'Grade', oldVal: null, newVal: grade },
            { field: 'Guardian', oldVal: null, newVal: guardianName.trim() },
          ],
        });
      } else {
        await updateStudentMutation.mutateAsync({ id: selectedStudentId, studentData });

        // Calculate exact diffs between initial form state and submitted values
        const changesList = [];
        if (initialFormState) {
          if (initialFormState.firstName !== firstName.trim()) {
            changesList.push({ field: 'First Name', oldVal: initialFormState.firstName, newVal: firstName.trim() });
          }
          if (initialFormState.lastName !== lastName.trim()) {
            changesList.push({ field: 'Last Name', oldVal: initialFormState.lastName, newVal: lastName.trim() });
          }
          if (initialFormState.gender !== gender) {
            changesList.push({ field: 'Gender', oldVal: initialFormState.gender, newVal: gender });
          }
          if (initialFormState.grade !== grade) {
            changesList.push({ field: 'Grade', oldVal: initialFormState.grade, newVal: grade });
          }
          if (initialFormState.guardianName !== guardianName.trim()) {
            changesList.push({ field: 'Guardian Name', oldVal: initialFormState.guardianName, newVal: guardianName.trim() });
          }
          if (initialFormState.phone !== phone.trim()) {
            changesList.push({ field: 'Contact Phone', oldVal: initialFormState.phone, newVal: phone.trim() });
          }
          if (initialFormState.assignedRoute !== assignedRoute) {
            changesList.push({ field: 'Assigned Route', oldVal: initialFormState.assignedRoute, newVal: assignedRoute });
          }
        }

        const studentFullName = `${firstName.trim()} ${lastName.trim()}`;
        setNotificationBanner({
          type: 'success',
          title: `Information Updated for ${studentFullName}`,
          studentName: studentFullName,
          changesList: changesList.length > 0 ? changesList : [
            { field: 'Status', oldVal: 'Pending', newVal: 'Saved & Synchronized' }
          ],
        });
      }

      setIsModalOpen(false);
    } catch (err) {
      setFormErrors(prev => ({ ...prev, submit: err.message || 'Failed to save student details' }));
    } finally {
      setIsSubmitting(false);
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
          {/* Notification Banner displaying student info changes */}
          {notificationBanner && (
            <div className="changes-banner">
              <div className="changes-banner-header">
                <div className="changes-banner-title-group">
                  <div className="changes-banner-icon">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4 className="changes-banner-title">{notificationBanner.title}</h4>
                    <p className="changes-banner-sub">
                      {notificationBanner.changesList && notificationBanner.changesList.length > 0 
                        ? `The following ${notificationBanner.changesList.length} change(s) were successfully saved:`
                        : 'Student record updated successfully.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="changes-banner-close"
                  onClick={() => setNotificationBanner(null)}
                  title="Dismiss notification"
                >
                  <X size={16} />
                </button>
              </div>

              {notificationBanner.changesList && notificationBanner.changesList.length > 0 && (
                <div className="changes-banner-list">
                  {notificationBanner.changesList.map((c, index) => (
                    <div key={index} className="changes-banner-item">
                      <span className="change-field-label">{c.field}:</span>
                      {c.oldVal ? (
                        <>
                          <span className="change-old-val">{c.oldVal}</span>
                          <span className="change-arrow">&rarr;</span>
                        </>
                      ) : null}
                      <span className="change-new-val">{c.newVal}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                className={`filter-tab ${gradeFilter === 'Grade 1' ? 'is-active' : ''}`}
                onClick={() => { setGradeFilter('Grade 1'); setCurrentPage(1); }}
              >
                Grade 1
              </button>
              <button 
                type="button" 
                className={`filter-tab ${gradeFilter === 'Grade 5' ? 'is-active' : ''}`}
                onClick={() => { setGradeFilter('Grade 5'); setCurrentPage(1); }}
              >
                Grade 5
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
                className={`filter-tab ${gradeFilter === 'Grade 12' ? 'is-active' : ''}`}
                onClick={() => { setGradeFilter('Grade 12'); setCurrentPage(1); }}
              >
                Grade 12
              </button>
            </div>

            <div className="filters-actions">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* Grade filter selector covering Grades 1 to 12 */}
                <select 
                  className="select-input" 
                  style={{ padding: '6px 28px 6px 12px', fontSize: '13px', width: '140px', height: '36px', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%235c5f62\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundPosition: 'right 8px center', backgroundSize: '12px' }}
                  value={gradeFilter}
                  onChange={(e) => { setGradeFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="All">All Grades</option>
                  {Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`).map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>

                {/* Route filter selector */}
                <select 
                  className="select-input" 
                  style={{ padding: '6px 28px 6px 12px', fontSize: '13px', width: '160px', height: '36px', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%235c5f62\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundPosition: 'right 8px center', backgroundSize: '12px' }}
                  value={routeFilter}
                  onChange={(e) => { setRouteFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="All">All Routes</option>
                  <option value="Unassigned">Unassigned</option>
                  {rawRoutes.map((r) => {
                    const routeName = r.route_name || r.name || `Route #${r.route_id || r.id}`;
                    return (
                      <option key={r.route_id || r.id} value={routeName}>
                        {routeName}
                      </option>
                    );
                  })}
                </select>

                <select 
                  className="select-input" 
                  style={{ padding: '6px 28px 6px 12px', fontSize: '13px', width: '140px', height: '36px' }}
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Enrolled">Enrolled</option>
                  <option value="Suspended">Suspended</option>
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
                    <th>Status</th>
                    <th>Assigned Route</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                 <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--primary-brand)' }}>
                        <div className="ui-button-spinner" style={{ display: 'inline-block', borderTopColor: 'var(--primary-brand)', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }} />
                        <span style={{ marginLeft: '8px', verticalAlign: 'middle' }}>Loading students...</span>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#dc2626' }}>
                        Error loading students: {error.message || String(error)}
                      </td>
                    </tr>
                  ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((s) => (
                      <tr key={s.id} className={s.isSuspended ? 'is-inactive' : ''}>
                        <td style={{ fontWeight: '600', color: 'var(--primary-brand)', fontSize: '13px' }}>
                          {s.id}
                        </td>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar-circle" style={{ backgroundColor: s.isSuspended ? '#fee2e2' : '#dbeafe', color: s.isSuspended ? '#dc2626' : '#1e40af' }}>
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
                          {s.isSuspended ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              backgroundColor: '#fee2e2',
                              color: '#dc2626',
                              fontSize: '11px',
                              fontWeight: 600
                            }}>
                              <Ban size={12} /> Suspended
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              fontSize: '11px',
                              fontWeight: 600
                            }}>
                              <CheckCircle2 size={12} /> Enrolled
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`role-badge ${getRouteClass(s.assignedRoute)}`}>
                            {s.assignedRoute}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="action-btn"
                              style={{
                                padding: '4px 8px',
                                height: '32px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                fontWeight: 600,
                                borderColor: s.isSuspended ? '#bbf7d0' : '#fecdd3',
                                color: s.isSuspended ? '#16a34a' : '#e11d48',
                                backgroundColor: s.isSuspended ? '#f0fdf4' : '#fff1f2'
                              }}
                              onClick={() => { setStudentToSuspend(s); setIsSuspendModalOpen(true); }}
                              title={s.isSuspended ? "Reinstate Student" : "Suspend Student"}
                            >
                              {s.isSuspended ? <CheckCircle2 size={13} /> : <Ban size={13} />}
                              {s.isSuspended ? 'Reinstate' : 'Suspend'}
                            </button>

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
                      <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--icon-color)' }}>
                        No students found matching filters or search queries.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              lastPage={studentsMeta.last_page || 1}
              total={studentsMeta.total || 0}
              perPage={itemsPerPage}
              onChange={setCurrentPage}
              label="students"
            />
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
                    <label htmlFor="studentGrade" className="ui-input-label">Grade Level</label>
                    <select
                      id="studentGrade"
                      className="select-input"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                    >
                      {Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`).map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modal-section-title">Guardian & Contact</div>
                <AsyncSelect
                  label="Search & Select Registered Guardian"
                  placeholder="Type guardian name..."
                  fetchOptions={fetchGuardians}
                  value={guardianName}
                  onChange={(opt) => handleGuardianSelect(opt)}
                  getOptionLabel={(opt) => opt.label}
                  getOptionValue={(opt) => opt.id}
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
                    <label htmlFor="assignedRoute" className="ui-input-label">Assigned Route (Read Only)</label>
                    <input
                      id="assignedRoute"
                      type="text"
                      className="select-input"
                      style={{ backgroundColor: '#f8fafc', color: '#475569', cursor: 'not-allowed' }}
                      value={assignedRoute}
                      disabled
                      readOnly
                    />
                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      Route assignments are managed automatically via Route Stop Logistics.
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={closeModal}
                  disabled={isSubmitting || createStudentMutation.isPending || updateStudentMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={isSubmitting || createStudentMutation.isPending || updateStudentMutation.isPending}
                  isLoading={isSubmitting || createStudentMutation.isPending || updateStudentMutation.isPending}
                >
                  {isSubmitting || createStudentMutation.isPending || updateStudentMutation.isPending
                    ? (modalMode === 'add' ? 'Adding Student...' : 'Saving Changes...')
                    : (modalMode === 'add' ? 'Add Student' : 'Save Changes')}
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

      {/* Student Suspend / Reinstate Confirmation Modal */}
      {isSuspendModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-container" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: studentToSuspend?.isSuspended ? '#16a34a' : '#e11d48', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {studentToSuspend?.isSuspended ? <CheckCircle2 size={20} /> : <Ban size={20} />}
                {studentToSuspend?.isSuspended ? 'Reinstate Student' : 'Suspend Student'}
              </h2>
            </div>
            <div style={{ padding: '20px 0', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
              Are you sure you want to {studentToSuspend?.isSuspended ? 'reinstate' : 'suspend'}{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {studentToSuspend?.name || 'this student'}
              </strong>
              ?
              {!studentToSuspend?.isSuspended && (
                <div style={{ marginTop: '10px', fontSize: '13px', color: '#dc2626', backgroundColor: '#fee2e2', padding: '10px 12px', borderRadius: '6px' }}>
                  <strong>Notice:</strong> Suspending this student will flag them as Suspended on driver attendance rosters, pause live telemetry tracking, and reflect across guardian apps.
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setIsSuspendModalOpen(false); setStudentToSuspend(null); }}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={async () => {
                  if (!studentToSuspend) return;
                  try {
                    await toggleStudentStatusMutation.mutateAsync(studentToSuspend.id);
                  } catch (err) {
                    console.warn('Toggle student status error:', err);
                  } finally {
                    setStudentToSuspend(null);
                    setIsSuspendModalOpen(false);
                  }
                }}
                disabled={toggleStudentStatusMutation.isPending}
                style={{
                  padding: '8px 20px',
                  background: studentToSuspend?.isSuspended ? '#16a34a' : '#e11d48',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: toggleStudentStatusMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: toggleStudentStatusMutation.isPending ? 0.7 : 1,
                }}
              >
                {toggleStudentStatusMutation.isPending 
                  ? 'Updating...' 
                  : (studentToSuspend?.isSuspended ? 'Reinstate Student' : 'Suspend Student')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
