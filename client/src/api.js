// API client for handling backend requests
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const api = {
  async request(url, options = {}) {
    const response = await fetch(`${API_BASE}${url}`, options);
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  async get(url) {
    return this.request(url);
  },

  async post(url, data) {
    return this.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async delete(url) {
    return this.request(url, { method: 'DELETE' });
  },
};