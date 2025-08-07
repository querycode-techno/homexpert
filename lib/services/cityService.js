/**
 * City Service - Handles all city-related API calls
 */

const API_BASE_URL = '/api/admin/cities';

class CityService {
  /**
   * Fetch all cities with pagination and filtering
   */
  async getCities(params = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        search = '',
        state = ''
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(state && { state })
      });

      const response = await fetch(`${API_BASE_URL}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          `HTTP ${response.status}: Failed to fetch cities`
        );
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch cities: ${error.message}`);
    }
  }

  /**
   * Add a new city
   */
  async addCity(state, city) {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ state, city })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          `HTTP ${response.status}: Failed to add city`
        );
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to add city: ${error.message}`);
    }
  }

  /**
   * Update a city name
   */
  async updateCity(state, city, newCityName) {
    try {
      const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(state)}/${encodeURIComponent(city)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ newCityName })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          `HTTP ${response.status}: Failed to update city`
        );
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to update city: ${error.message}`);
    }
  }

  /**
   * Delete a city
   */
  async deleteCity(state, city) {
    try {
      const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(state)}/${encodeURIComponent(city)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          `HTTP ${response.status}: Failed to delete city`
        );
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to delete city: ${error.message}`);
    }
  }

  /**
   * Get all states (for dropdowns)
   */
  async getStates() {
    try {
      const response = await fetch(`${API_BASE_URL}/states`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          `HTTP ${response.status}: Failed to fetch states`
        );
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch states: ${error.message}`);
    }
  }
}

export default new CityService();
