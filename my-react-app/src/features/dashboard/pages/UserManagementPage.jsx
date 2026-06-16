import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bus, Users, LogOut, Search, Plus, 
  SlidersHorizontal, Download, ChevronLeft, ChevronRight, X, MapPin, CloudUpload
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import '../styles/dashboard.css';

// Initial Mock User Data from Figma design
const INITIAL_USERS = [
  {
    id: 'D-4921',
    name: 'Marcus Johnson',
    role: 'Driver',
    email: 'mjohnson@sbms.edu',
    phone: '555-0192',
    assignment: 'Route 42 - North',
    isActive: true,
  },
  {
    id: 'G-8832',
    name: 'Sarah Williams',
    role: 'Guardian',
    email: 's.williams@email.com',
    phone: '555-0144',
    assignment: '2 Students',
    isActive: true,
  },
  {
    id: 'D-3391',
    name: 'David Rodriguez',
    role: 'Driver',
    email: 'drod@sbms.edu',
    phone: '555-0882',
    assignment: 'Unassigned',
    isActive: false,
  }
];

// Counter for generating unique IDs
let nextUserId = 5000;

const UserManagementPage = ({ user, onSignOut }) => {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All Users'); // 'All Users' | 'Drivers' | 'Guardians' | 'Administrators'
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    if (!newUserPassword) {
      errors.password = 'Password is required';
    } else if (newUserPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (newUserPassword !== newUserConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Generate prefix based on role
    const prefix = newUserRole === 'Driver' ? 'D' : newUserRole === 'Guardian' ? 'G' : 'A';
    const newId = `${prefix}-${nextUserId++}`;

    const newUser = {
      id: newId,
      name: `${newUserFirstName.trim()} ${newUserLastName.trim()}`,
      role: newUserRole,
      email: newUserEmail,
      phone: newUserPhone,
      assignment: newUserAssignment.trim() || 'Unassigned',
      isActive: true,
    };

    setUsers([newUser, ...users]);
    closeModal();
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
          <button type="button" className="sidebar-link">
            <Users size={18} />
            Students
          </button>
          <Link to="/users" className="sidebar-link is-active">
            <Users size={18} />
            User Management
          </Link>
          <Link to="/fleet" className="sidebar-link">
            <Bus size={18} />
            Fleet & Maintenance
          </Link>
          <button type="button" className="sidebar-link">
            <MapPin size={18} />
            Route Logistics
          </button>
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
              onClick={() => setIsModalOpen(true)}
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
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--icon-color)' }}>
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
                Showing 1 to {filteredUsers.length} of {filteredUsers.length} entries
              </span>

              <div className="pagination-controls">
                <button type="button" className="pagination-btn" disabled>
                  <ChevronLeft size={16} />
                </button>
                <button type="button" className="pagination-btn is-active">1</button>
                <button type="button" className="pagination-btn">2</button>
                <button type="button" className="pagination-btn">3</button>
                <button type="button" className="pagination-btn" disabled>
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
              <h2>Add New System User</h2>
              <button type="button" className="modal-close-btn" onClick={closeModal}>
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleAddUser}>
              <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
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

                <div className="modal-row-2col" style={{ marginTop: '12px' }}>
                  <Input
                    label="Password"
                    id="modalPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    error={formErrors.password}
                  />
                  <Input
                    label="Confirm Password"
                    id="modalConfirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newUserConfirmPassword}
                    onChange={(e) => setNewUserConfirmPassword(e.target.value)}
                    error={formErrors.confirmPassword}
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
                  Create User
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
