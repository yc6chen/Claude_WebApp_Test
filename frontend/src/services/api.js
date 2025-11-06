import { getAccessToken, getRefreshToken, setAuthTokens, clearAuthTokens, shouldRefreshToken } from '../utils/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

/**
 * API service with automatic token refresh and authentication handling
 */
class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  /**
   * Process the failed request queue after token refresh
   */
  processQueue(error, token = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  /**
   * Refresh the access token
   */
  async refreshAccessToken() {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      setAuthTokens(data.access, data.refresh || refreshToken, null);
      return data.access;
    } catch (error) {
      clearAuthTokens();
      window.location.href = '/login';
      throw error;
    }
  }

  /**
   * Make an authenticated request with automatic token refresh
   */
  async request(endpoint, options = {}) {
    let accessToken = getAccessToken();

    // Check if token needs refresh before making the request
    if (accessToken && shouldRefreshToken(accessToken) && !this.isRefreshing) {
      try {
        this.isRefreshing = true;
        accessToken = await this.refreshAccessToken();
        this.processQueue(null, accessToken);
      } catch (error) {
        this.processQueue(error, null);
        throw error;
      } finally {
        this.isRefreshing = false;
      }
    }

    // Set up headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Make the request
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && accessToken && !this.isRefreshing) {
        this.isRefreshing = true;

        try {
          const newAccessToken = await this.refreshAccessToken();
          this.processQueue(null, newAccessToken);
          this.isRefreshing = false;

          // Retry the original request with new token
          headers['Authorization'] = `Bearer ${newAccessToken}`;
          return await fetch(url, { ...config, headers });
        } catch (refreshError) {
          this.processQueue(refreshError, null);
          this.isRefreshing = false;
          throw refreshError;
        }
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Authentication endpoints
  async login(username, password) {
    const response = await fetch(`${this.baseUrl}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    setAuthTokens(data.access, data.refresh, null);

    // Fetch user info
    const userResponse = await this.get('/auth/user/');
    const user = await userResponse.json();
    setAuthTokens(data.access, data.refresh, user);

    return { tokens: data, user };
  }

  async register(userData) {
    const response = await fetch(`${this.baseUrl}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    const data = await response.json();
    setAuthTokens(data.tokens.access, data.tokens.refresh, data.user);

    return data;
  }

  async logout() {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await this.post('/auth/logout/', { refresh: refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    clearAuthTokens();
  }

  async getCurrentUser() {
    const response = await this.get('/auth/user/');
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  }

  // Recipe endpoints
  async getRecipes(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/recipes/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.get(endpoint);
    return response.json();
  }

  async getRecipe(id) {
    const response = await this.get(`/recipes/${id}/`);
    return response.json();
  }

  async createRecipe(data) {
    const response = await this.post('/recipes/', data);
    return response.json();
  }

  async updateRecipe(id, data) {
    const response = await this.put(`/recipes/${id}/`, data);
    return response.json();
  }

  async deleteRecipe(id) {
    return this.delete(`/recipes/${id}/`);
  }

  async getMyRecipes() {
    const response = await this.get('/recipes/my_recipes/');
    return response.json();
  }

  async getFavoriteRecipes() {
    const response = await this.get('/recipes/favorites/');
    return response.json();
  }

  async favoriteRecipe(id) {
    const response = await this.post(`/recipes/${id}/favorite/`);
    return response.json();
  }

  async unfavoriteRecipe(id) {
    return this.delete(`/recipes/${id}/unfavorite/`);
  }

  // Meal Plan endpoints
  async getMealPlans(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/meal-plans/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.get(endpoint);
    return response.json();
  }

  async getMealPlanWeek(startDate) {
    const endpoint = `/meal-plans/week/${startDate ? `?start_date=${startDate}` : ''}`;
    const response = await this.get(endpoint);
    return response.json();
  }

  async getMealPlan(id) {
    const response = await this.get(`/meal-plans/${id}/`);
    return response.json();
  }

  async createMealPlan(data) {
    const response = await this.post('/meal-plans/', data);
    return response.json();
  }

  async updateMealPlan(id, data) {
    const response = await this.put(`/meal-plans/${id}/`, data);
    return response.json();
  }

  async deleteMealPlan(id) {
    return this.delete(`/meal-plans/${id}/`);
  }

  async bulkMealPlanOperation(data) {
    const response = await this.post('/meal-plans/bulk_operation/', data);
    return response.json();
  }

  async clearMealPlans(startDate, endDate) {
    return this.bulkMealPlanOperation({
      action: 'clear',
      start_date: startDate,
      end_date: endDate
    });
  }

  async copyMealPlans(startDate, endDate, targetStartDate) {
    return this.bulkMealPlanOperation({
      action: 'copy',
      start_date: startDate,
      end_date: endDate,
      target_start_date: targetStartDate
    });
  }

  async repeatMealPlans(startDate, endDate, targetStartDate) {
    return this.bulkMealPlanOperation({
      action: 'repeat',
      start_date: startDate,
      end_date: endDate,
      target_start_date: targetStartDate
    });
  }

  // Shopping List endpoints
  async getShoppingLists(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/shopping-lists/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.get(endpoint);
    return response.json();
  }

  async getShoppingList(id) {
    const response = await this.get(`/shopping-lists/${id}/`);
    return response.json();
  }

  async createShoppingList(data) {
    const response = await this.post('/shopping-lists/', data);
    return response.json();
  }

  async updateShoppingList(id, data) {
    const response = await this.patch(`/shopping-lists/${id}/`, data);
    return response.json();
  }

  async deleteShoppingList(id) {
    return this.delete(`/shopping-lists/${id}/`);
  }

  async generateShoppingList(data) {
    const response = await this.post('/shopping-lists/generate/', data);
    return response.json();
  }

  async addItemToShoppingList(shoppingListId, itemData) {
    const response = await this.post(`/shopping-lists/${shoppingListId}/add_item/`, itemData);
    return response.json();
  }

  async clearCheckedItems(shoppingListId) {
    const response = await this.post(`/shopping-lists/${shoppingListId}/clear_checked/`);
    return response.json();
  }

  // Shopping List Item endpoints
  async getShoppingListItems(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/shopping-list-items/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.get(endpoint);
    return response.json();
  }

  async getShoppingListItem(id) {
    const response = await this.get(`/shopping-list-items/${id}/`);
    return response.json();
  }

  async updateShoppingListItem(id, data) {
    const response = await this.patch(`/shopping-list-items/${id}/`, data);
    return response.json();
  }

  async deleteShoppingListItem(id) {
    return this.delete(`/shopping-list-items/${id}/`);
  }

  async toggleShoppingListItemCheck(id) {
    const response = await this.post(`/shopping-list-items/${id}/toggle_check/`);
    return response.json();
  }
}

// Export a singleton instance
const apiService = new ApiService();
export default apiService;
