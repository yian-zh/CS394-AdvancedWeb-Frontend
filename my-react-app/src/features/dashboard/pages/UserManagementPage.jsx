import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bus, Users, LogOut, Search, Plus, 
  SlidersHorizontal, Download, X, MapPin, CloudUpload,
  GraduationCap, AlertTriangle, DollarSign, Activity,
  CheckCircle2, Ban, Loader2
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Pagination from '../../../components/ui/Pagination';
import { useDebounce } from '../../../hooks/useDebounce';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useToggleUserStatus } from '../hooks/useUsers';
import { Edit3 } from 'lucide-react';
import '../styles/dashboard.css';

const UserManagementPage = ({ user, onSignOut }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [activeTab, setActiveTab] = useState('All Users');
  const [statusFilter, setStatusFilter] = useState('All');

  const targetRole = useMemo(() => {
    if (activeTab === 'Guardians') return 'guardian';
    if (activeTab === 'Administrators') return 'admin';
    if (activeTab === 'Drivers') return 'driver';
    return '';
  }, [activeTab]);

  const { data: usersResponse, isLoading, isFetching, error } = useUsers({ 
    page: currentPage, 
    perPage: itemsPerPage, 
    search: debouncedSearch,
    role: targetRole,
    status: statusFilter
  });
  const rawUsers = usersResponse?.data ?? [];
  const paginationMeta = usersResponse?.meta ?? usersResponse ?? {};
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const toggleUserStatusMutation = useToggleUserStatus();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedUserIdToEdit, setSelectedUserIdToEdit] = useState(null);

  // Suspend Confirmation State
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState(null);

  // Delete Confirmation State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // New User Form State
  const [newUserRole, setNewUserRole] = useState('Driver'); // Driver | Guardian | Administrator
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserGender, setNewUserGender] = useState('Male');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserConfirmPassword, setNewUserConfirmPassword] = useState('');
  const [newUserAssignment, setNewUserAssignment] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const users = useMemo(() => {
    return rawUsers.map(u => {
      let assignedStudents = [];
      if (u.guardian && u.guardian.students && Array.isArray(u.guardian.students)) {
        assignedStudents = u.guardian.students;
      }

      let defaultAssignment = 'System Admin';
      if (u.role === 'driver') {
        defaultAssignment = 'Driver Profile';
      } else if (u.role === 'guardian') {
        if (assignedStudents.length > 0) {
          defaultAssignment = assignedStudents.map(s => `${s.first_name} ${s.last_name}`).join(', ');
        } else {
          defaultAssignment = 'Unassigned';
        }
      }

      return {
        id: u.user_id,
        name: `${u.first_name} ${u.last_name}`,
        role: u.role ? (u.role.charAt(0).toUpperCase() + u.role.slice(1)) : 'User',
        email: u.email,
        phone: u.phone_number || 'N/A',
        assignment: defaultAssignment,
        students: assignedStudents,
        isActive: !!u.status,
      };
    });
  }, [rawUsers]);

  // Helper to extract initials
  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Helper to get role badge style class
  const getRoleClass = (role) => {
    switch (role.toLowerCase()) {
      case 'driver': return 'badge-driver';
      case 'guardian': return 'badge-guardian';
      case 'administrator':
      case 'admin': return 'badge-admin';
      default: return '';
    }
  };

  // Helper to get initials avatar style class
  const getAvatarClass = (role) => {
    switch (role.toLowerCase()) {
      case 'driver': return 'avatar-driver';
      case 'guardian': return 'avatar-guardian';
      case 'administrator':
      case 'admin': return 'avatar-admin';
      default: return '';
    }
  };

  // Server-side filtered users
  const filteredUsers = users;

  const openAddModal = () => {
    setModalMode('add');
    setSelectedUserIdToEdit(null);
    setNewUserRole('Driver');
    setNewUserFirstName('');
    setNewUserLastName('');
    setNewUserGender('Male');
    setNewUserPhone('');
    setNewUserUsername('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserConfirmPassword('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (usr) => {
    setModalMode('edit');
    setSelectedUserIdToEdit(usr.id);
    const names = (usr.name || '').split(' ');
    setNewUserRole(usr.role === 'Admin' ? 'Administrator' : usr.role);
    setNewUserFirstName(names[0] || '');
    setNewUserLastName(names.slice(1).join(' ') || '');
    setNewUserGender('Male');
    setNewUserPhone(usr.phone && usr.phone !== 'N/A' ? usr.phone : '');
    setNewUserUsername(usr.email ? usr.email.split('@')[0] : '');
    setNewUserEmail(usr.email || '');
    setNewUserPassword('');
    setNewUserConfirmPassword('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle Form Submission
  const validateForm = () => {
    const errors = {};
    if (!newUserFirstName.trim()) errors.firstName = 'First name is required';
    if (!newUserLastName.trim()) errors.lastName = 'Last name is required';
    if (!newUserPhone.trim()) errors.phone = 'Phone number is required';
    if (!newUserUsername.trim()) errors.username = 'Username is required';
    if (!newUserEmail.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(newUserEmail)) {
      errors.email = 'Email is invalid';
    }
    if (modalMode === 'add') {
      if (!newUserPassword) {
        errors.password = 'Password is required';
      } else if (newUserPassword.length < 8) {
        errors.password = 'Password must be at least 8 characters long.';
      }
    } else if (newUserPassword) {
      if (newUserPassword.length < 8) {
        errors.password = 'Password must be at least 8 characters long.';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const apiRole = newUserRole.toLowerCase() === 'administrator' ? 'admin' : newUserRole.toLowerCase();
      const userData = {
        role: apiRole,
        username: newUserUsername.trim(),
        first_name: newUserFirstName.trim(),
        last_name: newUserLastName.trim(),
        gender: newUserGender.toLowerCase(),
        email: newUserEmail.trim(),
        phone_number: newUserPhone.trim()
      };

      if (newUserPassword) {
        userData.password = newUserPassword;
      }

      if (modalMode === 'add') {
        await createUserMutation.mutateAsync(userData);
      } else {
        await updateUserMutation.mutateAsync({ id: selectedUserIdToEdit, userData });
      }

      closeModal();
    } catch (err) {
      const passwordErrMsg = err.data?.errors?.password ? err.data.errors.password[0] : null;
      const errMsg = passwordErrMsg || err.message || 'Failed to save user account';
      
      if (passwordErrMsg || errMsg.toLowerCase().includes('password')) {
        setFormErrors(prev => ({ ...prev, password: errMsg, submit: null }));
      } else {
        setFormErrors(prev => ({ ...prev, submit: errMsg }));
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewUserRole('Driver');
    setNewUserFirstName('');
    setNewUserLastName('');
    setNewUserGender('Male');
    setNewUserPhone('');
    setNewUserUsername('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserConfirmPassword('');
    setNewUserAssignment('');
    setFormErrors({});
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar navigation */}
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
          <Link to="/users" className="sidebar-link is-active">
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
                placeholder="Search directory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isFetching && <Loader2 size={16} className="search-spinner" />}
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
              <h1 className="canvas-title">User Directory</h1>
              <p className="canvas-subtitle">Manage all system users, drivers, and associated guardians.</p>
            </div>
            <button 
              type="button" 
              className="add-user-btn"
              onClick={openAddModal}
            >
              <Plus size={16} />
              Add User
            </button>
          </div>

          {/* Filtering row */}
          <div className="filters-row">
            <div className="filter-tabs" role="tablist">
              {['All Users', 'Drivers', 'Guardians', 'Administrators'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  className={`filter-tab ${activeTab === tab ? 'is-active' : ''}`}
                  onClick={() => {
                    setActiveTab(tab);
                    setCurrentPage(1);
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="filters-actions">
              <select
                className="select-input"
                style={{ padding: '6px 28px 6px 12px', fontSize: '13px', width: '140px', height: '36px' }}
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>

              <button type="button" className="action-btn" onClick={() => alert('Exporting users directory CSV...')}>
                <Download size={14} />
                Export
              </button>
            </div>
          </div>

          {/* Directory table card */}
          <Card className="directory-card">
            <div className="directory-table-container">
              <table className="directory-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Assignment</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--primary-brand)' }}>
                        <div className="ui-button-spinner" style={{ display: 'inline-block', borderTopColor: 'var(--primary-brand)', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }} />
                        <span style={{ marginLeft: '8px', verticalAlign: 'middle' }}>Loading users...</span>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#dc2626' }}>
                        Error loading users: {error.message || String(error)}
                      </td>
                    </tr>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className={u.isActive ? '' : 'is-inactive'}>
                        <td>
                          <div className="user-cell">
                            <div className={`user-avatar-circle ${getAvatarClass(u.role)}`}>
                              {getInitials(u.name)}
                            </div>
                            <div className="user-info">
                              <span className="user-name">{u.name}</span>
                              <span className="user-id">ID: {u.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`role-badge ${getRoleClass(u.role)}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <div className="contact-cell">
                            <span className="contact-email">{u.email}</span>
                            <span className="contact-phone">{u.phone}</span>
                          </div>
                        </td>
                        <td>
                          {u.isActive ? (
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
                              <CheckCircle2 size={12} /> Active
                            </span>
                          ) : (
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
                          )}
                        </td>
                        <td>
                          <div className="assignment-cell">
                            {u.role.toLowerCase() === 'guardian' ? (
                              u.students && u.students.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {u.students.map((student) => (
                                    <div key={student.student_id} className="assignment-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                      <GraduationCap size={13} style={{ color: 'var(--primary-brand, #3b82f6)' }} />
                                      <span style={{ fontWeight: 500 }}>{student.first_name} {student.last_name}</span>
                                      {student.grade_level && (
                                        <span style={{ fontSize: '11px', opacity: 0.75 }}>
                                          ({student.grade_level})
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="assignment-unassigned">No Student Assigned</span>
                              )
                            ) : u.assignment.toLowerCase() !== 'unassigned' ? (
                              <div className="assignment-tag">
                                <span className="assignment-bullet"></span>
                                {u.assignment}
                              </div>
                            ) : (
                              <span className="assignment-unassigned">Unassigned</span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => { setUserToSuspend(u); setIsSuspendModalOpen(true); }}
                              disabled={toggleUserStatusMutation.isPending}
                              style={{
                                background: u.isActive ? '#fff1f2' : '#f0fdf4',
                                border: `1px solid ${u.isActive ? '#fecdd3' : '#bbf7d0'}`,
                                borderRadius: '6px',
                                color: u.isActive ? '#e11d48' : '#16a34a',
                                cursor: 'pointer',
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s'
                              }}
                              title={u.isActive ? "Suspend User Account" : "Activate User Account"}
                            >
                              {u.isActive ? <Ban size={13} /> : <CheckCircle2 size={13} />}
                              {u.isActive ? 'Suspend' : 'Activate'}
                            </button>

                            <button
                              type="button"
                              className="action-btn"
                              onClick={() => openEditModal(u)}
                              style={{ padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Edit User Details"
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              title="Delete User"
                              onClick={() => { setUserToDelete(u); setIsDeleteConfirmOpen(true); }}
                              style={{
                                background: 'none',
                                border: '1px solid #fca5a5',
                                borderRadius: '6px',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: 600,
                                transition: 'all 0.15s',
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--icon-color)' }}>
                        No users found matching the search query or filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              lastPage={paginationMeta.last_page || 1}
              total={paginationMeta.total || 0}
              perPage={itemsPerPage}
              onChange={setCurrentPage}
              label="users"
            />
          </Card>
        </div>
      </main>

      {/* Add User Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <header className="modal-header">
              <h2>{modalMode === 'add' ? 'Add New System User' : 'Edit System User'}</h2>
              <button type="button" className="modal-close-btn" onClick={closeModal}>
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleAddUser}>
              <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                {formErrors.submit && (
                  <div style={{ color: '#ef4444', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
                    {formErrors.submit}
                  </div>
                )}
                {/* ROLE ASSIGNMENT */}
                <div className="modal-section-title">Role Assignment</div>
                <div className="select-input-wrapper" style={{ marginBottom: '16px' }}>
                  <label htmlFor="modalRole" className="ui-input-label">Select Role</label>
                  <select
                    id="modalRole"
                    className="select-input"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                  >
                    <option value="Driver">Driver</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>

                {/* PERSONAL INFORMATION */}
                <div className="modal-section-title">Personal Information</div>
                <div className="modal-row-2col">
                  <Input
                    label="First Name"
                    id="modalFirstName"
                    placeholder="e.g. John"
                    value={newUserFirstName}
                    onChange={(e) => setNewUserFirstName(e.target.value)}
                    error={formErrors.firstName}
                  />
                  <Input
                    label="Last Name"
                    id="modalLastName"
                    placeholder="e.g. Doe"
                    value={newUserLastName}
                    onChange={(e) => setNewUserLastName(e.target.value)}
                    error={formErrors.lastName}
                  />
                </div>

                <div className="modal-row-2col" style={{ marginTop: '12px' }}>
                  <div className="select-input-wrapper">
                    <label htmlFor="modalGender" className="ui-input-label">Gender</label>
                    <select
                      id="modalGender"
                      className="select-input"
                      value={newUserGender}
                      onChange={(e) => setNewUserGender(e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <Input
                    label="Phone Number"
                    id="modalPhone"
                    placeholder="555-0123"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    error={formErrors.phone}
                  />
                </div>

                {/* ACCOUNT CREDENTIALS */}
                <div className="modal-section-title">Account Credentials</div>
                <div className="modal-row-2col">
                  <Input
                    label="Username"
                    id="modalUsername"
                    placeholder="jdoe_sbms"
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    error={formErrors.username}
                  />
                  <Input
                    label="Email Address"
                    id="modalEmail"
                    placeholder="john.doe@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    error={formErrors.email}
                  />
                </div>

                <div style={{ marginTop: '12px' }}>
                  <Input
                    label={modalMode === 'add' ? 'Password' : 'New Password (leave empty to keep current)'}
                    id="modalPassword"
                    type="password"
                    placeholder={modalMode === 'add' ? 'Enter initial user password' : 'Enter new password to update user'}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    error={formErrors.password}
                  />
                </div>

                {/* PROFILE & STATUS */}
                <div className="modal-section-title">Profile & Status</div>
                <div className="select-input-wrapper">
                  <label className="ui-input-label">Profile Picture</label>
                  <div className="drag-drop-zone">
                     <span className="drag-drop-icon">
                       <CloudUpload size={28} />
                     </span>
                    <p className="drag-drop-text">Drag and drop or <span>browse</span></p>
                    <p className="drag-drop-subtext">PNG, JPG up to 5MB</p>
                  </div>
                </div>
              </div>

              <footer className="modal-footer">
                <button 
                  type="button" 
                  className="action-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <Button type="submit">
                  {modalMode === 'add' ? 'Create User' : 'Save Changes'}
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-container" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: '#ef4444' }}>⚠️ Delete User</h2>
            </div>
            <div style={{ padding: '20px 0', color: 'var(--text-secondary)' }}>
              Are you sure you want to permanently delete{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {userToDelete?.name || 'this user'}
              </strong>
              ? This action cannot be undone.
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setIsDeleteConfirmOpen(false); setUserToDelete(null); }}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={async () => {
                  if (!userToDelete) return;
                  try {
                    await deleteUserMutation.mutateAsync(userToDelete.id);
                  } catch (err) {
                    console.warn('Delete user error:', err);
                  } finally {
                    setUserToDelete(null);
                    setIsDeleteConfirmOpen(false);
                  }
                }}
                disabled={deleteUserMutation.isPending}
                style={{
                  padding: '8px 20px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: deleteUserMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: deleteUserMutation.isPending ? 0.7 : 1,
                }}
              >
                {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend / Activate Confirmation Modal */}
      {isSuspendModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-container" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: userToSuspend?.isActive ? '#e11d48' : '#16a34a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {userToSuspend?.isActive ? <Ban size={20} /> : <CheckCircle2 size={20} />}
                {userToSuspend?.isActive ? 'Suspend User Account' : 'Activate User Account'}
              </h2>
            </div>
            <div style={{ padding: '20px 0', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
              Are you sure you want to {userToSuspend?.isActive ? 'suspend' : 'activate'}{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {userToSuspend?.name || 'this user'}
              </strong>
              ?
              {userToSuspend?.isActive && (
                <div style={{ marginTop: '10px', fontSize: '13px', color: '#dc2626', backgroundColor: '#fee2e2', padding: '10px 12px', borderRadius: '6px' }}>
                  <strong>Notice:</strong> Suspending this account will immediately revoke all active login sessions and block API access across Redis.
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setIsSuspendModalOpen(false); setUserToSuspend(null); }}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={async () => {
                  if (!userToSuspend) return;
                  try {
                    await toggleUserStatusMutation.mutateAsync(userToSuspend.id);
                  } catch (err) {
                    console.warn('Toggle user status error:', err);
                  } finally {
                    setUserToSuspend(null);
                    setIsSuspendModalOpen(false);
                  }
                }}
                disabled={toggleUserStatusMutation.isPending}
                style={{
                  padding: '8px 20px',
                  background: userToSuspend?.isActive ? '#e11d48' : '#16a34a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: toggleUserStatusMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: toggleUserStatusMutation.isPending ? 0.7 : 1,
                }}
              >
                {toggleUserStatusMutation.isPending 
                  ? 'Updating...' 
                  : (userToSuspend?.isActive ? 'Suspend Account' : 'Activate Account')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
