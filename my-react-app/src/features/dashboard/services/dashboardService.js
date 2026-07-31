const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Helper to construct headers with optional Sanctum Bearer Token
 */
const getHeaders = (options = {}) => {
  const headers = {
    'Accept': 'application/json',
    ...options,
  };

  // Only add JSON Content-Type if we are not handling multipart uploads
  if (!options['Content-Type'] && options['Content-Type'] !== null) {
    headers['Content-Type'] = 'application/json';
  } else if (options['Content-Type'] === null) {
    delete headers['Content-Type'];
  }

  const token = localStorage.getItem('sbms_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Helper to handle fetch responses and parse JSON / capture errors
 */
const handleResponse = async (response) => {
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('sbms_token');
      localStorage.removeItem('sbms_user');
    }
    const errorMsg = data?.message || (response.status === 401 ? 'Unauthenticated. Please log in again.' : `HTTP error! status: ${response.status}`);
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const dashboardService = {
  // ==========================================
  // 👥 User Management
  // ==========================================
  // ==========================================
  // 👥 User Management
  // ==========================================
  async getUsers({ page = 1, perPage = 10, search = '', role = '', status = '' } = {}) {
    const params = new URLSearchParams({ page, per_page: perPage });
    if (search) params.set('search', search);
    if (role && role !== 'All Users' && role !== 'All') params.set('role', role);
    if (status && status !== 'All') params.set('status', status);
    const response = await fetch(`${API_URL}/users?${params}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createUser(userData) {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  async updateUser(id, userData) {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  async toggleUserStatus(id) {
    const response = await fetch(`${API_URL}/users/${id}/toggle-status`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async deleteUser(id) {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // ==========================================
  // 🗃️ Student Directory
  // ==========================================
  async getStudents({ page = 1, perPage = 10, search = '', grade = '', routeId = '', status = '' } = {}) {
    const params = new URLSearchParams({ page, per_page: perPage });
    if (search) params.set('search', search);
    if (grade && grade !== 'All') params.set('grade', grade);
    if (routeId && routeId !== 'All') params.set('route_id', routeId);
    if (status && status !== 'All') params.set('status', status);
    const response = await fetch(`${API_URL}/students?${params}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createStudent(studentData) {
    const response = await fetch(`${API_URL}/students`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(studentData),
    });
    return handleResponse(response);
  },

  async updateStudent(id, studentData) {
    const response = await fetch(`${API_URL}/students/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(studentData),
    });
    return handleResponse(response);
  },

  async toggleStudentStatus(id) {
    const response = await fetch(`${API_URL}/students/${id}/toggle-status`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async deleteStudent(id) {
    const response = await fetch(`${API_URL}/students/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async assignGuardian(assignmentData) {
    const response = await fetch(`${API_URL}/students/assign-guardian`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(assignmentData),
    });
    return handleResponse(response);
  },

  // ==========================================
  // 🚌 Fleet Infrastructure (PostgreSQL)
  // ==========================================
  async getBuses({ page = 1, perPage = 10, search = '', status = '' } = {}) {
    const params = new URLSearchParams({ page, per_page: perPage });
    if (search) params.set('search', search);
    if (status && status !== 'All') params.set('status', status);
    const response = await fetch(`${API_URL}/buses?${params}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createBus(busData) {
    const response = await fetch(`${API_URL}/buses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(busData),
    });
    return handleResponse(response);
  },

  async updateBus(id, busData) {
    const response = await fetch(`${API_URL}/buses/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(busData),
    });
    return handleResponse(response);
  },

  async uploadBusDocument(id, docData) {
    const response = await fetch(`${API_URL}/buses/${id}/documents`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(docData),
    });
    return handleResponse(response);
  },

  // ==========================================
  // 🔧 Maintenance Operations (MongoDB + Hybrid)
  // ==========================================
  async getPendingMaintenance({ page = 1, perPage = 10, search = '' } = {}) {
    const params = new URLSearchParams({ page, per_page: perPage });
    if (search) params.set('search', search);
    const response = await fetch(`${API_URL}/maintenance/pending?${params}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createMaintenanceRequest(requestData) {
    const response = await fetch(`${API_URL}/maintenance/requests`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(requestData),
    });
    return handleResponse(response);
  },

  async resolveMaintenanceRequest(mongoId, repairData) {
    const response = await fetch(`${API_URL}/maintenance/requests/${mongoId}/resolve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(repairData),
    });
    return handleResponse(response);
  },

  // ==========================================
  // 🗺️ Route Logistics & Deployment
  // ==========================================
  async getRoutes({ page = 1, perPage = 10, search = '', driverId = '' } = {}) {
    const params = new URLSearchParams({ page, per_page: perPage });
    if (search) params.set('search', search);
    if (driverId) params.set('driver_id', driverId);
    const response = await fetch(`${API_URL}/routes?${params}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createRoute(routeData) {
    const response = await fetch(`${API_URL}/routes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(routeData),
    });
    return handleResponse(response);
  },

  async updateRoute(id, routeData) {
    const response = await fetch(`${API_URL}/routes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(routeData),
    });
    return handleResponse(response);
  },

  async deleteRoute(id) {
    const response = await fetch(`${API_URL}/routes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async manageStops(id, stopData) {
    const response = await fetch(`${API_URL}/routes/${id}/stops`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(stopData),
    });
    return handleResponse(response);
  },

  async assignBusToRoute(assignmentData) {
    const response = await fetch(`${API_URL}/assignments/bus-route`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(assignmentData),
    });
    return handleResponse(response);
  },

  async assignDriverToBus(assignmentData) {
    const response = await fetch(`${API_URL}/assignments/driver-bus`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(assignmentData),
    });
    return handleResponse(response);
  },

  // ==========================================
  // 💰 Billing & Finance Operations
  // ==========================================
  async getFeeStructures({ page = 1, perPage = 10, search = '' } = {}) {
    const params = new URLSearchParams({ page, per_page: perPage });
    if (search) params.set('search', search);
    const response = await fetch(`${API_URL}/billing/fee-structures?${params}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createFeeStructure(feeData) {
    const response = await fetch(`${API_URL}/billing/fee-structures`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(feeData),
    });
    return handleResponse(response);
  },

  async updateFeeStructure(id, feeData) {
    const response = await fetch(`${API_URL}/billing/fee-structures/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(feeData),
    });
    return handleResponse(response);
  },

  async assignFeeStructure(assignmentData) {
    const response = await fetch(`${API_URL}/billing/assign-fee`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(assignmentData),
    });
    return handleResponse(response);
  },

  async unassignFeeStructure(studentId) {
    const response = await fetch(`${API_URL}/billing/unassign-fee/${studentId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getInvoices({ page = 1, perPage = 10, search = '', status = '' } = {}) {
    const params = new URLSearchParams({ page, per_page: perPage });
    if (search) params.set('search', search);
    if (status && status !== 'All') params.set('status', status);
    const response = await fetch(`${API_URL}/billing/invoices?${params}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async generateInvoices() {
    const response = await fetch(`${API_URL}/billing/invoices/generate`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async recordPayment(paymentData) {
    const response = await fetch(`${API_URL}/billing/payments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(paymentData),
    });
    return handleResponse(response);
  },

  async updateInvoiceStatus(id, status) {
    const response = await fetch(`${API_URL}/billing/invoices/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  // ==========================================
  // 📊 Telemetry & System Monitoring
  // ==========================================
  async getDatabaseTelemetry() {
    const response = await fetch(`${API_URL}/telemetry/database`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  }
};
