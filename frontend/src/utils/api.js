// frontend/src/utils/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getAuthToken() {
    return localStorage.getItem('token');
  }

  getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: 'GET',                 // default method
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const res = await fetch(url, config);
      const ctype = res.headers.get('content-type') || '';
      const isJson = ctype.includes('application/json');

      let data = null;
      if (isJson) {
        try { data = await res.json(); } catch (_) { data = null; }
      } else {
        try { data = await res.text(); } catch (_) { data = null; }
      }

      if (!res.ok) {
        const msg =
          (data && data.message) ||
          (typeof data === 'string' ? data : `HTTP ${res.status}`);
        throw new Error(msg);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ========= Auth =========
  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (response?.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // ======== Dashboard ========
  async getDashboardOverview() {
    return await this.request('/dashboard/overview');
  }

  // ========= Products =========
  async getProducts() {
    return await this.request('/products');
  }

  async searchProducts(query) {
    return await this.request(`/products/search?q=${encodeURIComponent(query)}`);
  }

  async createProduct(productData) {
    return await this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id, productData) {
    return await this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id) {
    return await this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // ========= Categories (full CRUD) =========
  async getCategories() {
    return await this.request('/categories');
  }

  async createCategory(categoryData) {
    return await this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(id, categoryData) {
    return await this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(id) {
    return await this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // ========= Customers =========
  async getCustomers() {
    return await this.request('/customers');
  }

  async searchCustomers(query) {
    return await this.request(`/customers/search?q=${encodeURIComponent(query)}`);
  }

  async createCustomer(customerData) {
    return await this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  async updateCustomer(id, customerData) {
    return await this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  }

  async deleteCustomer(id) {
    return await this.request(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // ========= Sales =========
  async getSales() {
    return await this.request('/sales');
  }

  async createSale(saleData) {
    return await this.request('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  }

  // NOTE: Only keep this if your backend has /sales/:id implemented
  async getSaleDetails(id) {
    return await this.request(`/sales/${id}`);
  }

  // ========= Health =========
  async checkHealth() {
    return await this.request('/health');
  }

  // Reports
  async getSalesReport(range = '7d') {
    return await this.request(`/reports/sales?range=${encodeURIComponent(range)}`);
  }

  async exportSalesReport(range = '7d', format = 'csv') {
    // CSV download (blob)
    const url = `${this.baseURL}/reports/sales/export?range=${encodeURIComponent(range)}&format=${format}`;
    const res = await fetch(url, { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error(`Export failed (${res.status})`);
    const blob = await res.blob();
    return blob; // caller will trigger download
  }

}

// singleton export
const apiClient = new APIClient();
export default apiClient;
