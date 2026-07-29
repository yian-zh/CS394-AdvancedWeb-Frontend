import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bus, Users, LogOut, Search, Plus, 
  SlidersHorizontal, Download, X, 
  GraduationCap, MapPin, DollarSign, Edit3, AlertCircle, CheckCircle2, UserCheck
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Pagination from '../../../components/ui/Pagination';
import AsyncSelect from '../../../components/ui/AsyncSelect';
import { useDebounce } from '../../../hooks/useDebounce';
import { dashboardService } from '../services/dashboardService';
import { useFeeStructures, useCreateFeeStructure, useUpdateFeeStructure, useAssignFeeStructure, useInvoices, useGenerateInvoices, useUpdateInvoiceStatus, useRecordPayment } from '../hooks/useFinance';
import { useStudents } from '../hooks/useStudents';
import '../styles/dashboard.css';

// Fallback fee structure matching the reference mockup if backend has no records yet
const PAYMENT_METHODS = ['Cash', 'Check', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Online'];

const FinancePage = ({ user, onSignOut }) => {
  const [feePage, setFeePage] = useState(1);
  const [invoicePage, setInvoicePage] = useState(1);
  const feesPerPage = 10;
  const invoicesPerPage = 5;

  // Search state (must be before hooks that use debouncedSearch)
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: feeResponse, isLoading: isFeesLoading } = useFeeStructures({ page: feePage, perPage: feesPerPage });
  const rawFeeStructures = feeResponse?.data ?? [];
  const feeMeta = feeResponse?.meta ?? {};
  const { data: invoiceResponse, isLoading: isInvoicesLoading } = useInvoices({ page: invoicePage, perPage: invoicesPerPage, search: debouncedSearch });
  const rawInvoices = invoiceResponse?.data ?? [];
  const invoiceMeta = invoiceResponse?.meta ?? {};
  const [studentFeePage, setStudentFeePage] = useState(1);
  const studentsPerPage = 10;
  const { data: studentsResponse } = useStudents({ page: studentFeePage, perPage: studentsPerPage });
  const rawStudents = studentsResponse?.data ?? [];
  const studentsMeta = studentsResponse?.meta ?? {};

  const createFeeMutation = useCreateFeeStructure();
  const updateFeeMutation = useUpdateFeeStructure();
  const assignFeeMutation = useAssignFeeStructure();
  const generateInvoicesMutation = useGenerateInvoices();
  const updateInvoiceStatusMutation = useUpdateInvoiceStatus();
  const recordPaymentMutation = useRecordPayment();

  const fetchStudents = useCallback(async (search) => {
    const data = await dashboardService.getStudents({ search, perPage: 20 });
    return (data?.data ?? []).map(s => ({
      id: s.student_id || s.id,
      label: `${s.first_name || ''} ${s.last_name || ''}`.trim() || `Student #${s.student_id || s.id}`,
      sub: s.grade_level || '',
      student_id: s.student_id || s.id,
    }));
  }, []);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [paymentFormErrors, setPaymentFormErrors] = useState({});

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
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedFeeId, setSelectedFeeId] = useState('');
  const [assignFormErrors, setAssignFormErrors] = useState({});

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
    return [];
  }, [rawFeeStructures]);

  // Computed Assigned Student Fees List
  const assignedStudentFees = useMemo(() => {
    if (!rawStudents || rawStudents.length === 0) {
      return [];
    }

    return rawStudents.map((s, idx) => {
      const gUser = s.guardians && s.guardians[0] && s.guardians[0].user;
      const guardianStr = gUser ? `${gUser.first_name} ${gUser.last_name}` : (s.guardianName || 'No Guardian Linked');
      const studentName = s.first_name ? `${s.first_name} ${s.last_name}` : (s.name || `Student #${s.student_id || s.id}`);
      
      const sFee = (s.fee_structures && s.fee_structures.length > 0) ? s.fee_structures[0] : s.fee_structure;
      const assignedTier = sFee 
        ? sFee 
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

  // Computed Invoices / Payments Ledger
  const ledger = useMemo(() => {
    if (rawInvoices && rawInvoices.length > 0) {
      return rawInvoices.map((inv) => {
        const guardianUser = inv.guardian && inv.guardian.user;
        const payerName = guardianUser ? `${guardianUser.first_name} ${guardianUser.last_name}` : 'District Guardian';
        const formattedAmount = `$${parseFloat(inv.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        const rawId = inv.invoice_id ?? inv.id;

        const guardianId = inv.guardian?.guardian_id || inv.guardian_id || inv.guardian?.id;
        let feeTier = '';
        if (guardianId && rawStudents?.length > 0) {
          const names = rawStudents
            .filter((s) => s.guardians?.some((g) => String(g.guardian_id || g.id) === String(guardianId)))
            .map((s) => {
              const matchedAssigned = assignedStudentFees.find((as) => String(as.student_id) === String(s.student_id || s.id));
              if (matchedAssigned) return matchedAssigned.fee_name;

              const sFee = (s.fee_structures && s.fee_structures.length > 0) ? s.fee_structures[0] : s.fee_structure;
              const tier = sFee || feeStructures.find((f) => String(f.fee_structure_id) === String(s.fee_structure_id));
              return tier?.fee_name || tier?.name || '';
            })
            .filter(Boolean);
          feeTier = [...new Set(names)].join(', ');
        }

        if (!feeTier && feeStructures.length > 0) {
          feeTier = feeStructures[0]?.fee_name || 'Standard Route (Monthly)';
        }

        return {
          raw_id: rawId,
          invoice_id: `#INV-${rawId}`,
          payer: payerName,
          fee_tier: feeTier,
          date: inv.invoice_date ? String(inv.invoice_date).split('T')[0] : 'Oct 24, 2023',
          amount: formattedAmount,
          status: inv.status || 'Paid'
        };
      });
    }
    return [];
  }, [rawInvoices, rawStudents, feeStructures, assignedStudentFees]);

  // Filtered Ledger (by status only; search is handled server-side)
  const filteredLedger = useMemo(() => {
    return ledger.filter((item) => {
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesStatus;
    });
  }, [ledger, statusFilter]);

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
      const selectedStudentIdVal = typeof selectedStudentId === 'object' ? selectedStudentId.student_id || selectedStudentId.id : selectedStudentId;
      const studentName = typeof selectedStudentId === 'object' ? selectedStudentId.label : 'Student';
      const guardianStr = '';

      const selectedFee = feeStructures.find(f => String(f.fee_structure_id) === String(selectedFeeId));
      const feeNameStr = selectedFee ? `${selectedFee.fee_name} ($${selectedFee.base_amount})` : 'Fee Structure';

      await assignFeeMutation.mutateAsync({
        student_id: parseInt(selectedStudentIdVal, 10),
        fee_structure_id: parseInt(selectedFeeId, 10)
      });

      setNotification({
        type: 'success',
        message: `Assigned "${feeNameStr}" to student "${studentName}"${guardianStr ? ` (Guardian: ${guardianStr})` : ''} successfully!`
      });
      setIsAssignModalOpen(false);
      setSelectedStudentId('');
      setSelectedFeeId('');
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

  const openRecordPaymentModal = (invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setPaymentAmount('');
    setPaymentMethod('');
    setTransactionReference('');
    setPaymentFormErrors({});
    setIsPaymentModalOpen(true);
  };

  const closeRecordPaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedInvoiceForPayment(null);
    setPaymentAmount('');
    setPaymentMethod('');
    setTransactionReference('');
    setPaymentFormErrors({});
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!paymentAmount || isNaN(paymentAmount) || parseFloat(paymentAmount) <= 0) {
      errors.amount_paid = 'Valid payment amount is required';
    }
    if (!paymentMethod) {
      errors.payment_method = 'Payment method is required';
    }
    if (Object.keys(errors).length > 0) {
      setPaymentFormErrors(errors);
      return;
    }
    try {
      await recordPaymentMutation.mutateAsync({
        invoice_id: selectedInvoiceForPayment.raw_id,
        amount_paid: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        transaction_reference: transactionReference.trim() || null,
      });
      setNotification({
        type: 'success',
        message: `Payment of $${parseFloat(paymentAmount).toFixed(2)} recorded for ${selectedInvoiceForPayment.invoice_id}!`
      });
      closeRecordPaymentModal();
    } catch (err) {
      setPaymentFormErrors({ submit: err.message || 'Failed to record payment' });
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
            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', backgroundColor: '#fafafa', flexWrap: 'wrap', gap: '12px' }}>
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
                            className="action-btn"
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => {
                              setSelectedStudentId({ id: row.student_id, label: row.student_name, sub: row.grade });
                              setSelectedFeeId(String(row.fee_structure_id));
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
            <Pagination
              currentPage={studentFeePage}
              lastPage={studentsMeta.last_page || 1}
              total={studentsMeta.total || 0}
              perPage={studentsPerPage}
              onChange={setStudentFeePage}
              label="students"
            />
          </Card>

          {/* Financial Dashboard Grid (2 Columns matching mockup) */}
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
            
            {/* LEFT CARD: Fee Structure */}
            <Card style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
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
                      <th style={{ padding: '14px 16px', fontSize: '11px' }}>Service Type</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', textAlign: 'right' }}>Rate</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', textAlign: 'center', width: '50px' }}>Edit</th>
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
                        <td style={{ padding: '14px 16px', fontWeight: '500' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                          ${fee.base_amount}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
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
              <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
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
                <table className="directory-table" style={{ width: '100%', minWidth: '650px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '14px 16px', fontSize: '11px', whiteSpace: 'nowrap' }}>Invoice ID</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', whiteSpace: 'nowrap' }}>Payer</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', whiteSpace: 'nowrap' }}>Fee Tier</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', whiteSpace: 'nowrap' }}>Date</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', whiteSpace: 'nowrap' }}>Amount</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
                      <th style={{ padding: '14px 16px', fontSize: '11px', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isInvoicesLoading ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--primary-brand)' }}>
                          Loading payments ledger...
                        </td>
                      </tr>
                    ) : filteredLedger.length > 0 ? (
                      filteredLedger.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--primary-brand)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                            {row.invoice_id}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: '500', fontSize: '13px', color: '#334155', whiteSpace: 'nowrap' }}>
                            {row.payer}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '12px', color: '#1e293b', whiteSpace: 'nowrap' }}>
                            {row.fee_tier ? (
                              <span 
                                style={{
                                  display: 'inline-block',
                                  maxWidth: '180px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  verticalAlign: 'middle',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: '#f1f5f9',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  color: '#334155',
                                  border: '1px solid #e2e8f0'
                                }} 
                                title={row.fee_tier}
                              >
                                {row.fee_tier}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {row.date}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: '700', fontSize: '13px', color: '#0f172a', whiteSpace: 'nowrap' }}>
                            {row.amount}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
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
                          <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                            {row.status !== 'Paid' ? (
                              <button
                                type="button"
                                onClick={() => openRecordPaymentModal(row)}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  backgroundColor: '#16a34a',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                Record Payment
                              </button>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--icon-color)' }}>
                          No invoice records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={invoicePage}
                lastPage={invoiceMeta.last_page || 1}
                total={invoiceMeta.total || 0}
                perPage={invoicesPerPage}
                onChange={setInvoicePage}
                label="invoices"
              />
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

                <AsyncSelect
                  label="Search & Select Student"
                  placeholder="Type student name..."
                  fetchOptions={fetchStudents}
                  value={selectedStudentId}
                  onChange={(opt) => setSelectedStudentId(opt?.student_id || opt?.id || '')}
                  getOptionLabel={(opt) => opt.label}
                  getOptionValue={(opt) => opt.id}
                  error={assignFormErrors.studentId}
                />

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

      {/* RECORD PAYMENT MODAL */}
      {isPaymentModalOpen && selectedInvoiceForPayment && (
        <div className="modal-overlay">
          <div className="modal-card">
            <header className="modal-header">
              <h2>Record Payment for {selectedInvoiceForPayment.invoice_id}</h2>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={closeRecordPaymentModal}
                disabled={recordPaymentMutation.isPending}
              >
                <X size={18} />
              </button>
            </header>
            <form onSubmit={handleRecordPaymentSubmit}>
              <div className="modal-body">
                {paymentFormErrors.submit && (
                  <div style={{ color: '#ef4444', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                    {paymentFormErrors.submit}
                  </div>
                )}
                <div className="modal-section-title">Invoice Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '13px', color: '#334155' }}>
                  <div><strong>Invoice:</strong> {selectedInvoiceForPayment.invoice_id}</div>
                  <div><strong>Payer:</strong> {selectedInvoiceForPayment.payer}</div>
                  <div><strong>Total:</strong> {selectedInvoiceForPayment.amount}</div>
                  <div><strong>Status:</strong> {selectedInvoiceForPayment.status}</div>
                </div>
                <div className="modal-section-title">Payment Information</div>
                <Input
                  label="Amount Paid ($)"
                  id="paymentAmountInput"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  error={paymentFormErrors.amount_paid}
                />
                <div className="select-input-wrapper">
                  <label htmlFor="paymentMethodSelect" className="ui-input-label">Payment Method</label>
                  <select
                    id="paymentMethodSelect"
                    className={`select-input ${paymentFormErrors.payment_method ? 'is-invalid' : ''}`}
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="">-- Select Payment Method --</option>
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                  {paymentFormErrors.payment_method && (
                    <span className="ui-input-error">{paymentFormErrors.payment_method}</span>
                  )}
                </div>
                <Input
                  label="Transaction Reference (optional)"
                  id="transactionRefInput"
                  placeholder="e.g. REF-001"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={closeRecordPaymentModal}
                  disabled={recordPaymentMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={recordPaymentMutation.isPending}
                  isLoading={recordPaymentMutation.isPending}
                >
                  {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
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