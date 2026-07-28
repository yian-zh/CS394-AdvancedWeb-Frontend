import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bus, Users, LogOut, Search, Plus, 
  SlidersHorizontal, Download, ChevronLeft, ChevronRight, X, MapPin, CloudUpload,
  GraduationCap, AlertTriangle, DollarSign
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useUsers';
import { Edit3 } from 'lucide-react';
import '../styles/dashboard.css';

const UserManagementPage = ({ user, onSignOut }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { data: usersResponse, isLoading, error } = useUsers({ page: currentPage, perPage: itemsPerPage });
  const rawUsers = usersResponse?.data ?? [];
  const paginationMeta = usersResponse?.meta ?? {};
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All Users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedUserIdToEdit, setSelectedUserIdToEdit] = useState(null);

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
    return rawUsers.map(u => ({
      id: u.user_id,
      name: `${u.first_name} ${u.last_name}`,
      role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
      email: u.email,
      phone: u.phone_number || 'N/A',
      assignment: u.role === 'driver' ? 'Driver Profile' : (u.role === 'guardian' ? 'Guardian Profile' : 'System Admin'),
      isActive: !!u.status,
    }));
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
      case 'administrator': return 'badge-admin';
      default: return '';
    }
  };

  // Helper to get initials avatar style class
  const getAvatarClass = (role) => {
    switch (role.toLowerCase()) {
      case 'driver': return 'avatar-driver';
      case 'guardian': return 'avatar-guardian';
      case 'administrator': return 'avatar-admin';
      default: return '';
    }
  };

  // Search & Filter Logic
  const filteredUsers = users.filter((u) => {
    // 1. Role Filter
    if (activeTab === 'Drivers' && u.role !== 'Driver') return false;
    if (activeTab === 'Guardians' && u.role !== 'Guardian') return false;
    if (activeTab === 'Administrators' && u.role !== 'Administrator') return false;

    // 2. Text Search
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      u.id.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.phone.includes(query) ||
      u.assignment.toLowerCase().includes(query)
    );
  });

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
                  }}
                >
                  {tab}
                </button>
              ))}
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

          {/* Directory table card */}
          <Card className="directory-card">
            <div className="directory-table-container">
              <table className="directory-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Contact</th>
                    <th>Assignment</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--primary-brand)' }}>
                        <div className="ui-button-spinner" style={{ display: 'inline-block', borderTopColor: 'var(--primary-brand)', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }} />
                        <span style={{ marginLeft: '8px', verticalAlign: 'middle' }}>Loading users...</span>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#dc2626' }}>
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
                          <div className="assignment-cell">
                            {u.assignment.toLowerCase() !== 'unassigned' ? (
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
                      <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--icon-color)' }}>
                        No users found matching the search query or filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table pagination footer */}
            <div className="pagination-footer">
              <span className="pagination-info">
                {paginationMeta.total
                  ? `Showing ${((currentPage - 1) * itemsPerPage) + 1} to ${Math.min(currentPage * itemsPerPage, paginationMeta.total)} of ${paginationMeta.total} entries`
                  : `Showing ${filteredUsers.length} entries`}
              </span>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: paginationMeta.last_page || 1 }).map((_, idx) => (
                  <button
                    key={idx + 1}
                    type="button"
                    className={`pagination-btn ${currentPage === idx + 1 ? 'is-active' : ''}`}
                    onClick={() => setCurrentPage(idx + 1)}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={currentPage === (paginationMeta.last_page || 1)}
                  onClick={() => setCurrentPage(p => Math.min(paginationMeta.last_page || 1, p + 1))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
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
    </div>
  );
};

export default UserManagementPage;
