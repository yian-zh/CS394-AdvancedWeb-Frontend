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
    const errorMsg = data?.message || `HTTP error! status: ${response.status}`;
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
  async getUsers() {
    const response = await fetch(`${API_URL}/users`, {
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

  // ==========================================
  // 🗃️ Student Directory
  // ==========================================
  async getStudents() {
    const response = await fetch(`${API_URL}/students`, {
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
  async getBuses() {
    const response = await fetch(`${API_URL}/buses`, {
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
  async getPendingMaintenance() {
    const response = await fetch(`${API_URL}/maintenance/pending`, {
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
  async getRoutes() {
    const response = await fetch(`${API_URL}/routes`, {
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
  }
};
