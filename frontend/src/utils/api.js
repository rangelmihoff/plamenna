class APIClient {
  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://shopify-ai-seo-20-production.up.railway.app'
      : 'http://localhost:3000';
    
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  async request(endpoint, method = 'GET', data = null, options = {}) {
    let url = `${this.baseURL}${endpoint}`;
    
    const config = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      },
      credentials: 'include', // Important for Shopify sessions
      ...options
    };

    // Add body for POST/PUT requests
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      config.body = JSON.stringify(data);
    }

    // Add query params for GET requests
    if (data && method === 'GET') {
      const params = new URLSearchParams(data);
      url += `?${params}`;
    }

    try {
      const response = await fetch(url, config);
      
      // Handle authentication errors
      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request
          return this.request(endpoint, method, data, options);
        } else {
          // Redirect to auth
          window.location.href = '/api/auth/shopify';
          throw new Error('Authentication required');
        }
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }

    } catch (error) {
      // Network or parsing errors
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async refreshToken() {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      });
      
      return response.ok;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // Convenience methods
  async get(endpoint, params = null, options = {}) {
    return this.request(endpoint, 'GET', params, options);
  }

  async post(endpoint, data = null, options = {}) {
    return this.request(endpoint, 'POST', data, options);
  }

  async put(endpoint, data = null, options = {}) {
    return this.request(endpoint, 'PUT', data, options);
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, 'DELETE', null, options);
  }

  // File upload method
  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    return this.request(endpoint, 'POST', null, {
      headers: {}, // Don't set Content-Type for FormData
      body: formData
    });
  }
}

export const api = new APIClient();