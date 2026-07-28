import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bus, Users, LogOut, Search, Plus, 
  SlidersHorizontal, Download, ChevronLeft, ChevronRight, X, 
  GraduationCap, MapPin, DollarSign, Filter, Edit3, AlertCircle, CheckCircle2, UserCheck, Send
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import { useFeeStructures, useCreateFeeStructure, useUpdateFeeStructure, useAssignFeeStructure, useInvoices, useGenerateInvoices, useUpdateInvoiceStatus, useSendInvoice, useSendAllInvoices, useSendStudentInvoice } from '../hooks/useFinance';
import { useUsers } from '../hooks/useUsers';
import { useStudents } from '../hooks/useStudents';
import '../styles/dashboard.css';

// Fallback fee structure matching the reference mockup if backend has no records yet
const INITIAL_FEE_STRUCTURES = [
  { fee_structure_id: 1, fee_name: 'Standard Route (Monthly)', base_amount: '150.00', color: '#1e40af' },
  { fee_structure_id: 2, fee_name: 'Special Ed (Monthly)', base_amount: '220.00', color: '#475569' },
  { fee_structure_id: 3, fee_name: 'Field Trip (Hourly)', base_amount: '45.00', color: '#9a3412' },
  { fee_structure_id: 4, fee_name: 'Late Fee Penalty', base_amount: '25.00', color: '#dc2626' }
];

// Fallback payments ledger matching the reference mockup
const INITIAL_LEDGER = [
  { invoice_id: '#INV-2023-089', payer: 'Sarah Smith', date: 'Oct 24, 2023', amount: '$12,450.00', status: 'Paid' },
  { invoice_id: '#INV-2023-090', payer: 'Sarah Smith', date: 'Oct 23, 2023', amount: '$8,200.00', status: 'Overdue' },
  { invoice_id: '#INV-2023-091', payer: 'Sarah Smith', date: 'Oct 22, 2023', amount: '$15,600.00', status: 'Paid' },
  { invoice_id: '#INV-2023-092', payer: 'Sarah Smith', date: 'Oct 21, 2023', amount: '$4,500.00', status: 'Pending' },
  { invoice_id: '#INV-2023-093', payer: 'Sarah Smith', date: 'Oct 20, 2023', amount: '$9,100.00', status: 'Paid' }
];

const FinancePage = ({ user, onSignOut }) => {
  const [feePage, setFeePage] = useState(1);
  const [invoicePage, setInvoicePage] = useState(1);
  const feesPerPage = 10;
  const invoicesPerPage = 5;
  const { data: feeResponse, isLoading: isFeesLoading } = useFeeStructures({ page: feePage, perPage: feesPerPage });
  const rawFeeStructures = feeResponse?.data ?? [];
  const feeMeta = feeResponse?.meta ?? {};
  const { data: invoiceResponse, isLoading: isInvoicesLoading } = useInvoices({ page: invoicePage, perPage: invoicesPerPage });
  const rawInvoices = invoiceResponse?.data ?? [];
  const invoiceMeta = invoiceResponse?.meta ?? {};
  const { data: usersResponse } = useUsers({ perPage: 1000 });
  const rawUsers = usersResponse?.data ?? [];
  const { data: studentsResponse } = useStudents({ perPage: 1000 });
  const rawStudents = studentsResponse?.data ?? [];

  const createFeeMutation = useCreateFeeStructure();
  const updateFeeMutation = useUpdateFeeStructure();
  const assignFeeMutation = useAssignFeeStructure();
  const generateInvoicesMutation = useGenerateInvoices();
  const updateInvoiceStatusMutation = useUpdateInvoiceStatus();
  const sendInvoiceMutation = useSendInvoice();
  const sendStudentInvoiceMutation = useSendStudentInvoice();
  const sendAllInvoicesMutation = useSendAllInvoices();

  const handleStatusChange = async (rawId, newStatus) => {
    if (!rawId) return;
    try {
      await updateInvoiceStatusMutation.mutateAsync({ id: rawId, status: newStatus });
      setNotification({
        type: 'success',
        message: `Invoice #${rawId} status updated to "${newStatus}"!`
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to update invoice status'
      });
    }
  };

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [feeModalMode, setFeeModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedFeeIdToEdit, setSelectedFeeIdToEdit] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Fee Structure Form State
  const [feeName, setFeeName] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [feeFormErrors, setFeeFormErrors] = useState({});

  const openAddFeeModal = () => {
    setFeeModalMode('add');
    setSelectedFeeIdToEdit(null);
    setFeeName('');
    setBaseAmount('');
    setDiscountPercent('0');
    setFeeFormErrors({});
    setIsFeeModalOpen(true);
  };

  const openEditFeeModal = (fee) => {
    setFeeModalMode('edit');
    setSelectedFeeIdToEdit(fee.fee_structure_id);
    setFeeName(fee.fee_name);
    setBaseAmount(fee.base_amount);
    setDiscountPercent(fee.discount_percentage ? fee.discount_percentage.toString() : '0');
    setFeeFormErrors({});
    setIsFeeModalOpen(true);
  };

  // Fee Assignment Form State
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedFeeId, setSelectedFeeId] = useState('');
  const [assignFormErrors, setAssignFormErrors] = useState({});

  // Filtered Students for Assign Modal
  const filteredAssignStudents = useMemo(() => {
    if (!assignSearchQuery.trim()) return rawStudents;
    const q = assignSearchQuery.toLowerCase();
    return rawStudents.filter((s) => {
      const gUser = s.guardians && s.guardians[0] && s.guardians[0].user;
      const guardianStr = gUser ? `${gUser.first_name} ${gUser.last_name}` : (s.guardianName || '');
      const studentName = s.first_name ? `${s.first_name} ${s.last_name}` : (s.name || '');
      const gradeStr = s.grade_level || '';
      return (
        studentName.toLowerCase().includes(q) ||
        guardianStr.toLowerCase().includes(q) ||
        gradeStr.toLowerCase().includes(q)
      );
    });
  }, [rawStudents, assignSearchQuery]);

  // Computed Fee Structures (API data or Fallback)
  const feeStructures = useMemo(() => {
    if (rawFeeStructures && rawFeeStructures.length > 0) {
      return rawFeeStructures.map((f, idx) => ({
        fee_structure_id: f.fee_structure_id || f.id,
        fee_name: f.fee_name,
        base_amount: typeof f.base_amount === 'number' ? f.base_amount.toFixed(2) : f.base_amount,
        color: idx % 4 === 0 ? '#1e40af' : (idx % 4 === 1 ? '#475569' : (idx % 4 === 2 ? '#9a3412' : '#dc2626'))
      }));
    }
    return INITIAL_FEE_STRUCTURES;
  }, [rawFeeStructures]);

  // Computed Assigned Student Fees List
  const assignedStudentFees = useMemo(() => {
    if (!rawStudents || rawStudents.length === 0) {
      return [
        {
          student_id: 1,
          student_name: 'Alex Johnson',
          grade: 'Grade 10',
          guardian_name: 'Sarah Smith',
          fee_name: 'Standard Route (Monthly)',
          base_amount: '150.00',
          color: '#1e40af',
          fee_structure_id: 1
        },
        {
          student_id: 2,
          student_name: 'Emily Davis',
          grade: 'Grade 8',
          guardian_name: 'Sarah Johnson',
          fee_name: 'Special Ed (Monthly)',
          base_amount: '220.00',
          color: '#475569',
          fee_structure_id: 2
        },
        {
          student_id: 3,
          student_name: 'Michael Brown',
          grade: 'Grade 6',
          guardian_name: 'James Brown',
          fee_name: 'Field Trip (Hourly)',
          base_amount: '45.00',
          color: '#9a3412',
          fee_structure_id: 3
        }
      ];
    }

    return rawStudents.map((s, idx) => {
      const gUser = s.guardians && s.guardians[0] && s.guardians[0].user;
      const guardianStr = gUser ? `${gUser.first_name} ${gUser.last_name}` : (s.guardianName || 'No Guardian Linked');
      const studentName = s.first_name ? `${s.first_name} ${s.last_name}` : (s.name || `Student #${s.student_id || s.id}`);
      
      const assignedTier = s.fee_structure 
        ? s.fee_structure 
        : (feeStructures[idx % feeStructures.length] || feeStructures[0]);

      return {
        student_id: s.student_id || s.id,
        student_name: studentName,
        grade: s.grade_level || 'Student',
        guardian_name: guardianStr,
        fee_name: assignedTier ? (assignedTier.fee_name || assignedTier.name) : 'Standard Route (Monthly)',
        base_amount: assignedTier ? (assignedTier.base_amount || '150.00') : '150.00',
        color: assignedTier ? (assignedTier.color || 'var(--primary-brand)') : 'var(--primary-brand)',
        fee_structure_id: assignedTier ? (assignedTier.fee_structure_id || assignedTier.id) : 1
      };
    });
  }, [rawStudents, feeStructures]);

  // Computed Registered Guardians
  const registeredGuardians = useMemo(() => {
    const list = [];
    const nameSet = new Set();

    rawUsers.forEach((u) => {
      const roleStr = (u.role || '').toLowerCase();
      if (!roleStr || roleStr === 'guardian' || roleStr === 'parent') {
        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
        if (fullName && !nameSet.has(fullName)) {
          nameSet.add(fullName);
          list.push({ id: u.user_id || u.id, name: fullName, email: u.email });
        }
      }
    });

    if (list.length === 0) {
      return [
        { id: 1, name: 'Sarah Smith', email: 'sarah.smith@example.com' },
        { id: 2, name: 'Sarah Johnson', email: 'sarah.j@example.com' },
        { id: 3, name: 'James Brown', email: 'jbrown@example.com' }
      ];
    }
    return list;
  }, [rawUsers]);

  // Computed Invoices / Payments Ledger
  const ledger = useMemo(() => {
    if (rawInvoices && rawInvoices.length > 0) {
      return rawInvoices.map((inv) => {
        const guardianUser = inv.guardian && inv.guardian.user;
        const payerName = guardianUser ? `${guardianUser.first_name} ${guardianUser.last_name}` : 'District Guardian';
        const formattedAmount = `$${parseFloat(inv.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        return {
          raw_id: inv.invoice_id,
          invoice_id: `#INV-${inv.invoice_id}`,
          payer: payerName,
          date: inv.invoice_date || 'Oct 24, 2023',
          amount: formattedAmount,
          status: inv.status || 'Paid'
        };
      });
    }
    return INITIAL_LEDGER;
  }, [rawInvoices]);

  // Filtered Ledger
  const filteredLedger = useMemo(() => {
    return ledger.filter((item) => {
      const matchesSearch = 
        item.invoice_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.payer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [ledger, searchQuery, statusFilter]);

  // Handlers
  const handleCreateFeeSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!feeName.trim()) errors.feeName = 'Service type name is required';
    if (!baseAmount || isNaN(baseAmount) || parseFloat(baseAmount) <= 0) {
      errors.baseAmount = 'Valid base rate amount is required';
    }

    if (Object.keys(errors).length > 0) {
      setFeeFormErrors(errors);
      return;
    }

    try {
      const feePayload = {
        fee_name: feeName.trim(),
        base_amount: parseFloat(baseAmount),
        discount_percentage: parseFloat(discountPercent) || 0
      };

      if (feeModalMode === 'add') {
        await createFeeMutation.mutateAsync(feePayload);
        setNotification({
          type: 'success',
          message: `New fee structure tier "${feeName.trim()}" created successfully!`
        });
      } else {
        await updateFeeMutation.mutateAsync({
          id: selectedFeeIdToEdit,
          feeData: feePayload
        });
        setNotification({
          type: 'success',
          message: `Fee structure tier "${feeName.trim()}" updated successfully!`
        });
      }

      setIsFeeModalOpen(false);
      setFeeName('');
      setBaseAmount('');
      setDiscountPercent('0');
      setFeeFormErrors({});
    } catch (err) {
      setFeeFormErrors({ submit: err.message || 'Failed to save fee structure' });
    }
  };

  const handleAssignFeeSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!selectedStudentId) errors.studentId = 'Please select a student';
    if (!selectedFeeId) errors.feeId = 'Please select a fee structure tier';

    if (Object.keys(errors).length > 0) {
      setAssignFormErrors(errors);
      return;
    }

    try {
      const selectedStudent = rawStudents.find(s => String(s.student_id || s.id) === String(selectedStudentId));
      const studentName = selectedStudent ? (selectedStudent.first_name ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : selectedStudent.name) : 'Student';
      const gUser = selectedStudent && selectedStudent.guardians && selectedStudent.guardians[0] && selectedStudent.guardians[0].user;
      const guardianStr = gUser ? `${gUser.first_name} ${gUser.last_name}` : (selectedStudent ? selectedStudent.guardianName : '');

      const selectedFee = feeStructures.find(f => String(f.fee_structure_id) === String(selectedFeeId));
      const feeNameStr = selectedFee ? `${selectedFee.fee_name} ($${selectedFee.base_amount})` : 'Fee Structure';

      await assignFeeMutation.mutateAsync({
        student_id: parseInt(selectedStudentId, 10),
        fee_structure_id: parseInt(selectedFeeId, 10)
      });

      setNotification({
        type: 'success',
        message: `Assigned "${feeNameStr}" to student "${studentName}"${guardianStr ? ` (Guardian: ${guardianStr})` : ''} successfully!`
      });
      setIsAssignModalOpen(false);
      setSelectedStudentId('');
      setSelectedFeeId('');
      setAssignSearchQuery('');
      setAssignFormErrors({});
    } catch (err) {
      setAssignFormErrors({ submit: err.message || 'Failed to assign fee structure' });
    }
  };

  const handleGenerateInvoices = async () => {
    try {
      await generateInvoicesMutation.mutateAsync();
      setNotification({
        type: 'success',
        message: 'Monthly invoices generated for active guardian assignments!'
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to generate monthly invoices'
      });
    }
  };

  const handleSendInvoice = async (invoiceId) => {
    try {
      await sendInvoiceMutation.mutateAsync(invoiceId);
      setNotification({
        type: 'success',
        message: `Invoice #${invoiceId} sent to the guardian successfully!`
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to send invoice'
      });
    }
  };

  const handleSendStudentInvoice = async (studentId, studentName) => {
    try {
      await sendStudentInvoiceMutation.mutateAsync(studentId);
      setNotification({
        type: 'success',
        message: `Invoice for ${studentName} sent to their guardian!`
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to send student invoice'
      });
    }
  };

  const handleSendAllInvoices = async () => {
    try {
      await sendAllInvoicesMutation.mutateAsync();
      setNotification({
        type: 'success',
        message: 'All invoices sent to their respective guardians!'
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to send all invoices'
      });
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return { backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' };
      case 'overdue':
        return { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' };
      case 'pending':
      case 'unpaid':
        return { backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' };
      default:
        return { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' };
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
          <Link to="/logistics" className="sidebar-link">
            <MapPin size={18} />
            Route Logistics
          </Link>
          <Link to="/finance" className="sidebar-link is-active">
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

      {/* Main Workspace Frame */}
      <main className="dashboard-main">
        {/* Top Navbar */}
        <header className="top-navbar">
          <h2 className="top-navbar-title">SBMS Dashboard</h2>

          <div className="top-navbar-actions">
            <div className="top-navbar-search">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search ledger or invoice ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setInvoicePage(1);
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
          {/* Notification Banner */}
          {notification && (
            <div 
              style={{
                backgroundColor: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${notification.type === 'success' ? '#bbf7d0' : '#fca5a5'}`,
                borderLeft: `4px solid ${notification.type === 'success' ? '#16a34a' : '#ef4444'}`,
                borderRadius: '8px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: notification.type === 'success' ? '#14532d' : '#991b1b',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {notification.type === 'success' ? (
                  <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
                ) : (
                  <AlertCircle size={18} style={{ color: '#ef4444' }} />
                )}
                <span>{notification.message}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setNotification(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Page Header */}
          <div className="canvas-header">
            <div className="header-text-container">
              <h2 className="canvas-title">Financial Overview</h2>
              <p className="canvas-subtitle">Manage district billing, monitor revenue, and review recent transactions.</p>
            </div>
          </div>

          {/* CARD: Assigned Student Fees with Generate Invoices Button */}
          <Card style={{ padding: '0', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(197, 197, 211, 0.3)', backgroundColor: '#fafafa', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary-brand)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={18} />
                  Assigned Student Fees
                  <span style={{ fontSize: '11px', fontWeight: '600', backgroundColor: '#eff6ff', color: 'var(--primary-brand)', padding: '2px 8px', borderRadius: '12px' }}>
                    {assignedStudentFees.length} Students Assigned
                  </span>
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                  Active fee structures linked to registered district students and guardians.
                </p>
              </div>

              {/* BUTTONS ON TOP OF ASSIGNED FEES TABLE */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  type="button" 
                  className="add-user-btn"
                  onClick={handleGenerateInvoices}
                  disabled={generateInvoicesMutation.isPending}
                  style={{ height: '36px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <DollarSign size={16} />
                  {generateInvoicesMutation.isPending ? 'Generating Invoices...' : 'Generate Invoices'}
                </button>
                <button 
                  type="button" 
                  className="add-user-btn"
                  onClick={handleSendAllInvoices}
                  disabled={sendAllInvoicesMutation.isPending}
                  style={{ height: '36px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#2563eb' }}
                >
                  <Send size={16} />
                  {sendAllInvoicesMutation.isPending ? 'Sending All...' : 'Send All'}
                </button>
                <button 
                  type="button" 
                  className="action-btn"
                  onClick={() => setIsAssignModalOpen(true)}
                  style={{ height: '36px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#ffffff' }}
                >
                  <Plus size={16} />
                  Assign Fee to Student
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="directory-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '14px 20px', fontSize: '11px' }}>Student Name</th>
                    <th style={{ padding: '14px 20px', fontSize: '11px' }}>Linked Guardian</th>
                    <th style={{ padding: '14px 20px', fontSize: '11px' }}>Assigned Fee Tier</th>
                    <th style={{ padding: '14px 20px', fontSize: '11px', textAlign: 'right' }}>Monthly Rate</th>
                    <th style={{ padding: '14px 20px', fontSize: '11px', textAlign: 'center', width: '160px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedStudentFees.map((row) => (
                    <tr key={row.student_id}>
                      <td style={{ padding: '14px 20px', fontWeight: '600', color: '#0f172a', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <GraduationCap size={16} style={{ color: 'var(--primary-brand)', flexShrink: 0 }} />
                          <div>
                            <div>{row.student_name}</div>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>{row.grade}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: '500', fontSize: '13px', color: '#334155' }}>
                        {row.guardian_name}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13px' }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: '#f1f5f9',
                          color: '#1e293b'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: row.color }} />
                          {row.fee_name}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                        ${row.base_amount}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleSendStudentInvoice(row.student_id, row.student_name)}
                            disabled={sendStudentInvoiceMutation.isPending}
                            title={`Send invoice for ${row.student_name} to guardian`}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: sendStudentInvoiceMutation.isPending ? 'not-allowed' : 'pointer',
                              opacity: sendStudentInvoiceMutation.isPending ? 0.6 : 1,
                            }}
                          >
                            <Send size={12} />
                            Send
                          </button>
                          <button
                            type="button"
                            className="action-btn"
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => {
                              setSelectedStudentId(String(row.student_id));
                              setSelectedFeeId(String(row.fee_structure_id));
                              setAssignSearchQuery(row.student_name);
                              setIsAssignModalOpen(true);
                            }}
                            title="Change or Edit Fee Structure for this Student"
                          >
                            <Edit3 size={11} /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Financial Dashboard Grid (2 Columns matching mockup) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '24px', alignItems: 'start' }}>
            
            {/* LEFT CARD: Fee Structure */}
            <Card style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(197, 197, 211, 0.3)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary-brand)', margin: 0 }}>Fee Structure</h3>
                <button 
                  type="button" 
                  className="action-btn" 
                  style={{ padding: '6px', minWidth: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={openAddFeeModal}
                  title="Create New Fee Structure"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="directory-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '14px 20px', fontSize: '11px' }}>Service Type</th>
                      <th style={{ padding: '14px 20px', fontSize: '11px', textAlign: 'right' }}>Rate</th>
                      <th style={{ padding: '14px 20px', fontSize: '11px', textAlign: 'center', width: '50px' }}>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isFeesLoading ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--primary-brand)' }}>
                          Loading fee structures...
                        </td>
                      </tr>
                    ) : feeStructures.map((fee) => (
                      <tr key={fee.fee_structure_id}>
                        <td style={{ padding: '16px 20px', fontWeight: '500' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span 
                              style={{ 
                                width: '8px', 
                                height: '8px', 
                                borderRadius: '50%', 
                                backgroundColor: fee.color,
                                flexShrink: 0 
                              }} 
                            />
                            <span style={{ fontSize: '13px', color: '#1e293b' }}>{fee.fee_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                          ${fee.base_amount}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <button
                            type="button"
                            className="action-btn"
                            style={{ padding: '4px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => openEditFeeModal(fee)}
                            title="Edit Fee Structure Details"
                          >
                            <Edit3 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* RIGHT CARD: Recent Payments Ledger */}
            <Card style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(197, 197, 211, 0.3)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary-brand)', margin: 0 }}>Recent Payments Ledger</h3>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    className="select-input"
                    style={{ padding: '6px 24px 6px 10px', fontSize: '12px', height: '32px', width: '120px' }}
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setInvoicePage(1); }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Pending">Pending</option>
                  </select>
                  
                  <button 
                    type="button" 
                    className="action-btn"
                    style={{ padding: '6px 12px', fontSize: '12px', height: '32px', backgroundColor: 'var(--primary-brand)', color: '#ffffff', borderColor: 'var(--primary-brand)' }}
                    onClick={() => alert('Exporting Financial Ledger CSV...')}
                  >
                    <Download size={13} />
                    Export
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="directory-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '14px 20px', fontSize: '11px' }}>Invoice ID</th>
                      <th style={{ padding: '14px 20px', fontSize: '11px' }}>Payer</th>
                      <th style={{ padding: '14px 20px', fontSize: '11px' }}>Date</th>
                      <th style={{ padding: '14px 20px', fontSize: '11px' }}>Amount</th>
                      <th style={{ padding: '14px 20px', fontSize: '11px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isInvoicesLoading ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--primary-brand)' }}>
                          Loading payments ledger...
                        </td>
                      </tr>
                    ) : filteredLedger.length > 0 ? (
                      filteredLedger.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '14px 20px', fontWeight: '600', color: 'var(--primary-brand)', fontSize: '13px' }}>
                            {row.invoice_id}
                          </td>
                          <td style={{ padding: '14px 20px', fontWeight: '500', fontSize: '13px', color: '#334155' }}>
                            {row.payer}
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: '13px', color: '#64748b' }}>
                            {row.date}
                          </td>
                          <td style={{ padding: '14px 20px', fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                            {row.amount}
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                            <select
                              value={row.status}
                              onChange={(e) => handleStatusChange(row.raw_id, e.target.value)}
                              disabled={updateInvoiceStatusMutation.isPending}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '99px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                outline: 'none',
                                appearance: 'auto',
                                ...getStatusBadgeStyle(row.status)
                              }}
                              title="Click to change payment status"
                            >
                              <option value="Paid">Paid</option>
                              <option value="Overdue">Overdue</option>
                              <option value="Pending">Pending</option>
                              <option value="Unpaid">Unpaid</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--icon-color)' }}>
                          No invoice records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="pagination-footer" style={{ padding: '12px 20px' }}>
                <span className="pagination-info" style={{ fontSize: '12px' }}>
                  {invoiceMeta.total
                    ? `Showing ${((invoicePage - 1) * invoicesPerPage) + 1} to ${Math.min(invoicePage * invoicesPerPage, invoiceMeta.total)} of ${invoiceMeta.total} entries`
                    : `Showing ${filteredLedger.length} entries`}
                </span>

                <div className="pagination-controls">
                  <button 
                    type="button" 
                    className="pagination-btn"
                    disabled={invoicePage === 1}
                    onClick={() => setInvoicePage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: invoiceMeta.last_page || 1 }).map((_, idx) => (
                    <button 
                      key={idx + 1}
                      type="button"
                      className={`pagination-btn ${invoicePage === idx + 1 ? 'is-active' : ''}`}
                      onClick={() => setInvoicePage(idx + 1)}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button 
                    type="button" 
                    className="pagination-btn"
                    disabled={invoicePage === (invoiceMeta.last_page || 1)}
                    onClick={() => setInvoicePage(p => Math.min(invoiceMeta.last_page || 1, p + 1))}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </main>

      {/* CREATE FEE STRUCTURE MODAL */}
      {isFeeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <header className="modal-header">
              <h2>{feeModalMode === 'add' ? 'Create New Fee Structure Tier' : 'Edit Fee Structure Tier'}</h2>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setIsFeeModalOpen(false)}
                disabled={createFeeMutation.isPending || updateFeeMutation.isPending}
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleCreateFeeSubmit}>
              <div className="modal-body">
                {feeFormErrors.submit && (
                  <div style={{ color: '#ef4444', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                    {feeFormErrors.submit}
                  </div>
                )}
                
                <div className="modal-section-title">Fee Tier Information</div>
                <Input
                  label="Service Type / Fee Name"
                  id="feeNameInput"
                  placeholder="e.g. Standard Route (Monthly)"
                  value={feeName}
                  onChange={(e) => setFeeName(e.target.value)}
                  error={feeFormErrors.feeName}
                />

                <div className="modal-row-2col">
                  <Input
                    label="Base Amount ($)"
                    id="baseAmountInput"
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={baseAmount}
                    onChange={(e) => setBaseAmount(e.target.value)}
                    error={feeFormErrors.baseAmount}
                  />

                  <Input
                    label="Discount Percentage (%)"
                    id="discountInput"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsFeeModalOpen(false)}
                  disabled={createFeeMutation.isPending || updateFeeMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={createFeeMutation.isPending || updateFeeMutation.isPending}
                  isLoading={createFeeMutation.isPending || updateFeeMutation.isPending}
                >
                  {(createFeeMutation.isPending || updateFeeMutation.isPending) ? 'Saving...' : 'Save Fee Structure'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN FEE TO GUARDIAN/STUDENT MODAL */}
      {isAssignModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <header className="modal-header">
              <h2>Assign Fee Structure to Guardian / Student</h2>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setIsAssignModalOpen(false)}
                disabled={assignFeeMutation.isPending}
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleAssignFeeSubmit}>
              <div className="modal-body">
                {assignFormErrors.submit && (
                  <div style={{ color: '#ef4444', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                    {assignFormErrors.submit}
                  </div>
                )}

                <div className="modal-section-title">Assignment Target</div>

                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <Input
                    label="Search Student or Guardian Name"
                    id="assignSearchInput"
                    placeholder="Type student or guardian name to filter list..."
                    value={assignSearchQuery}
                    onChange={(e) => {
                      const newQuery = e.target.value;
                      setAssignSearchQuery(newQuery);
                      
                      const queryLower = newQuery.toLowerCase().trim();
                      if (queryLower) {
                        const matches = rawStudents.filter(s => {
                          const gUser = s.guardians && s.guardians[0] && s.guardians[0].user;
                          const guardianStr = gUser ? `${gUser.first_name} ${gUser.last_name}` : (s.guardianName || '');
                          const studentName = s.first_name ? `${s.first_name} ${s.last_name}` : (s.name || '');
                          return studentName.toLowerCase().includes(queryLower) || guardianStr.toLowerCase().includes(queryLower);
                        });
                        if (matches.length === 1) {
                          setSelectedStudentId(String(matches[0].student_id || matches[0].id));
                        }
                      }
                    }}
                    iconLeft={<Search size={16} />}
                    iconRight={
                      assignSearchQuery ? (
                        <button
                          type="button"
                          className="ui-input-toggle-btn"
                          onClick={() => {
                            setAssignSearchQuery('');
                            setSelectedStudentId('');
                          }}
                          title="Clear search and selection"
                        >
                          <X size={16} />
                        </button>
                      ) : null
                    }
                  />
                </div>
                
                <div className="select-input-wrapper">
                  <label htmlFor="studentSelect" className="ui-input-label">
                    Select Target Student ({filteredAssignStudents.length} matches)
                  </label>
                  <select
                    id="studentSelect"
                    className={`select-input ${assignFormErrors.studentId ? 'is-invalid' : ''}`}
                    value={selectedStudentId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedStudentId(val);
                      if (val) {
                        const found = rawStudents.find(s => String(s.student_id || s.id) === String(val));
                        if (found) {
                          const name = found.first_name ? `${found.first_name} ${found.last_name}` : (found.name || '');
                          setAssignSearchQuery(name);
                        }
                      }
                    }}
                  >
                    <option value="">-- Select Target Student --</option>
                    {filteredAssignStudents.map((s) => {
                      const gUser = s.guardians && s.guardians[0] && s.guardians[0].user;
                      const guardianStr = gUser ? `${gUser.first_name} ${gUser.last_name}` : (s.guardianName || 'No Guardian Linked');
                      const studentName = s.first_name ? `${s.first_name} ${s.last_name}` : (s.name || `Student #${s.student_id || s.id}`);
                      return (
                        <option key={s.student_id || s.id} value={s.student_id || s.id}>
                          {studentName} ({s.grade_level || 'Student'}) — Guardian: {guardianStr}
                        </option>
                      );
                    })}
                  </select>
                  {assignFormErrors.studentId && (
                    <span className="ui-input-error">{assignFormErrors.studentId}</span>
                  )}
                </div>

                <div className="select-input-wrapper">
                  <label htmlFor="feeStructureSelect" className="ui-input-label">Select Fee Structure Tier</label>
                  <select
                    id="feeStructureSelect"
                    className={`select-input ${assignFormErrors.feeId ? 'is-invalid' : ''}`}
                    value={selectedFeeId}
                    onChange={(e) => setSelectedFeeId(e.target.value)}
                  >
                    <option value="">-- Select Fee Tier --</option>
                    {feeStructures.map((f) => (
                      <option key={f.fee_structure_id} value={f.fee_structure_id}>
                        {f.fee_name} (${f.base_amount})
                      </option>
                    ))}
                  </select>
                  {assignFormErrors.feeId && (
                    <span className="ui-input-error">{assignFormErrors.feeId}</span>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAssignModalOpen(false)}
                  disabled={assignFeeMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={assignFeeMutation.isPending}
                  isLoading={assignFeeMutation.isPending}
                >
                  {assignFeeMutation.isPending ? 'Assigning...' : 'Assign Fee Tier'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
