const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Helper to construct headers with optional Sanctum Bearer Token
 */
const getHeaders = (options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options,
  };

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

export const authService = {
  /**
   * Log in user
   * @param {string} email 
   * @param {string} password 
   */
  async login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password, portal: 'admin' }),
    });

    const data = await handleResponse(response);
    
    if (data.user && data.user.role !== 'admin') {
      throw new Error('Access denied. Only administrators can log in to the admin portal.');
    }

    if (data.token && data.user) {
      localStorage.setItem('sbms_token', data.token);
      localStorage.setItem('sbms_user', JSON.stringify(data.user));
    }
    
    return data;
  },

  /**
   * Log out user
   */
  async logout() {
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
      });
      await handleResponse(response);
    } catch (err) {
      console.warn('Backend logout warning (clearing local session):', err);
    } finally {
      localStorage.removeItem('sbms_token');
      localStorage.removeItem('sbms_user');
    }
  },

  /**
   * Request password reset token
   * @param {string} email 
   */
  async sendResetLink(email) {
    const response = await fetch(`${API_URL}/auth/password/email`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email }),
    });

    return handleResponse(response);
  },

  /**
   * Reset password with token
   */
  async resetPassword({ email, token, password, passwordConfirmation }) {
    const response = await fetch(`${API_URL}/auth/password/reset`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        email,
        reset_token: token,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });

    return handleResponse(response);
  },

  /**
   * Get current active user from local storage
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('sbms_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Check if user session exists
   */
  isAuthenticated() {
    return !!localStorage.getItem('sbms_token');
  }
};
