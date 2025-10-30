// const API_BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000/api' :'/api';
const API_BASE_URL = 'http://localhost:5000/api';

console.log('🔧 Using API URL:', API_BASE_URL);

const getApiBaseUrl = () => {
  // Use the environment variable, fallback for different scenarios
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Development fallback
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000/api';
  }
  
  // Production fallback - use relative URL
  return '/api';
};

// const API_BASE_URL = getApiBaseUrl();

// Helper function to handle API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log('🔄 API Request:', url);
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    ...options,
  };

  // Stringify body if it exists and is an object
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    
    console.log('📡 Response status:', response.status, response.statusText);
    
    // Get the response text first
    const responseText = await response.text();
    console.log('📄 Raw response:', responseText.substring(0, 500)); // Log first 500 chars
    
    // Check if response is OK (status 200-299)
    if (!response.ok) {
      console.error('❌ Server error response:', responseText);
      
      // Handle 401 specifically for auth
      if (response.status === 401) {
        console.log('🔐 Authentication required');
        throw new Error('Authentication required');
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Try to parse JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('❌ Response that failed to parse:', responseText);
      throw new Error('Invalid JSON response from server');
    }
    
    console.log('✅ API Response success:', data.success);
    console.log('✅ API Response data:', data);
    
    return { data, status: response.status };
    
  } catch (error) {
    console.error('❌ API Request failed:', error.message);
    throw error;
  }
};

const api = {
  get: (endpoint) => apiRequest(endpoint),
  
  post: (endpoint, data) => apiRequest(endpoint, {
    method: 'POST',
    body: data,
  }),
  
  put: (endpoint, data) => apiRequest(endpoint, {
    method: 'PUT',
    body: data,
  }),
  
  delete: (endpoint, data) => apiRequest(endpoint, {
    method: 'DELETE',
    body: data,
  }),
};

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),
  logout: () => api.post('/auth/logout'),
  // getMe: () => api.get('/auth/me'),
};

// User API calls  
export const userAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  getCurrentUser: () => api.get('/users/me'),
  updateCurrentUser: (userData) => api.put('/users/me', userData),
  updateProfile: (userId, userData) => api.put(`/users/${userId}`, userData),
  updateProfileSimple: (userId, userData) => api.put('/users/update-profile', { userId, updateData: userData }),
  getBulkUsers: (userIds) => api.get(`/users/bulk?ids=${userIds.join(',')}`),
  search: (query) => api.get(`/users/search?q=${encodeURIComponent(query)}`),
};

// Projects API calls
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getById: (projectId) => api.get(`/projects/${projectId}`),
  create: (projectData) => api.post('/projects', projectData),
  update: (projectId, projectData) => api.put(`/projects/${projectId}`, projectData),
  delete: (projectId) => api.delete(`/projects/${projectId}`),
  uploadImage: (projectId, imageData) => api.post(`/projects/${projectId}/image`, imageData),
  uploadFiles: (projectId, filesData) => api.post(`/projects/${projectId}/files`, filesData),
  getFile: (projectId, fileIndex) => api.get(`/projects/${projectId}/files/${fileIndex}`),
  checkOut: (projectId) => api.post(`/projects/${projectId}/checkout`),
  checkIn: (projectId, checkInData) => api.post(`/projects/${projectId}/checkin`, checkInData),
  getEnhancedFiles: (projectId) => api.get(`/projects/${projectId}/files-enhanced`),
  getFileContent: (projectId, fileIndex) => api.get(`/projects/${projectId}/files/${fileIndex}/content`),
  getFilePreview: (projectId, fileIndex) => api.get(`/projects/${projectId}/files/${fileIndex}/preview`),
  getMembers: (projectId) => api.get(`/projects/${projectId}/members`),
  addMember: (projectId, userId) => api.post(`/projects/${projectId}/members`, { userId }),
  removeMember: (projectId, memberId) => api.delete(`/projects/${projectId}/members/${memberId}`),
};

// Friends API calls
export const friendsAPI = {
  sendRequest: (friendId) => api.post('/friends/request', { friendId }),
  acceptRequest: (requesterId) => api.post('/friends/accept', { requesterId }),
  declineRequest: (requesterId) => api.post('/friends/decline', { requesterId }),
  cancelRequest: (friendId) => api.post('/friends/cancel', { friendId }),
  getRequests: () => api.get('/friends/requests'),
  getSentRequests: () => api.get('/friends/sent-requests'),
  removeFriend: (friendId) => api.delete('/friends/remove', { friendId }),
};

// Users API calls
export const usersAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (userData) => api.put('/users/profile', userData),
  search: (query) => api.get(`/users/search?q=${encodeURIComponent(query)}`),
  getFriends: (userId) => api.get(`/users/${userId}/friends`),
  sendFriendRequest: (friendId) => friendsAPI.sendRequest(friendId),
  removeFriend: (friendId) => friendsAPI.removeFriend(friendId),
};

// Activity API calls
export const activityAPI = {
  getGlobalFeed: () => api.get('/activity/global'),
  getLocalFeed: () => api.get('/activity/local'),
  getUserActivity: (userId) => api.get(`/users/${userId}/activity`),
  getProjectActivity: (projectId) => api.get(`/projects/${projectId}/activity`),
  create: (activityData) => api.post('/activity', activityData),
  like: (activityId) => api.post(`/activity/${activityId}/like`),
};

// Admin API calls
export const adminAPI = {
  getUsers: (params = {}) => {const queryString = new URLSearchParams(params).toString();return api.get(`/admin/users?${queryString}`);},
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  updateUser: (userId, userData) => api.put(`/admin/users/${userId}`, userData),
  makeAdmin: (userId) => api.post(`/admin/users/${userId}/make-admin`),
  removeAdmin: (userId) => api.post(`/admin/users/${userId}/remove-admin`),
  
  // Projects
  getProjects: (params = {}) => {const queryString = new URLSearchParams(params).toString();return api.get(`/admin/projects?${queryString}`);},
  deleteProject: (projectId) => api.delete(`/admin/projects/${projectId}`),
  updateProject: (projectId, projectData) => api.put(`/admin/projects/${projectId}`, projectData),
  getProjectTypes: () => api.get('/admin/project-types'),
  createProjectType: (typeData) => api.post('/admin/project-types', typeData),
  updateProjectType: (typeId, typeData) => api.put(`/admin/project-types/${typeId}`, typeData),
  deleteProjectType: (typeId) => api.delete(`/admin/project-types/${typeId}`),
  getProjectTypeStats: () => api.get('/admin/project-types/stats'),

  // Activities
  getActivities: (params = {}) => {const queryString = new URLSearchParams(params).toString();return api.get(`/admin/activities?${queryString}`);},
  deleteActivity: (activityId) => api.delete(`/admin/activities/${activityId}`),
  
  // Stats
  getStats: () => api.get('/admin/stats')
};

// Search API calls
export const searchAPI = {
  searchAll: (query) => api.get(`/search/all?q=${encodeURIComponent(query)}`),
  searchUsers: (query) => api.get(`/search/users?q=${encodeURIComponent(query)}`),
  searchProjects: (query) => api.get(`/search/projects?q=${encodeURIComponent(query)}`),
  searchByTag: (tag) => api.get(`/search/tags?tag=${encodeURIComponent(tag)}`),
  
  advancedSearch: (params = {}) => {const queryString = new URLSearchParams(params).toString();return api.get(`/search/advanced?${queryString}`);},
  getSuggestions: (query, type = 'all') => api.get(`/search/suggestions?q=${encodeURIComponent(query)}&type=${type}`),
  getSearchFilters: () => api.get('/search/filters'),
};

export const debugAPI = {
  testSearchEndpoint: async () => {
    try {
      console.log('🔍 Testing search endpoints...');
      

      const response = await searchAPI.advancedSearch({ q: 'test' });
      console.log('✅ Advanced search endpoint working:', response.status);
      
      // Test suggestions
      const suggestions = await searchAPI.getSuggestions('test');
      console.log('✅ Suggestions endpoint working:', suggestions.status);
      
      // Test filters
      const filters = await searchAPI.getSearchFilters();
      console.log('✅ Filters endpoint working:', filters.status);
      
    } catch (error) {
      console.error('❌ Search endpoint test failed:', error);
    }
  }
};

export default api;