import api from './api';

const settingsService = {
  // Global Settings
  getSettings: async () => {
    const response = await api.get('/settings/');
    return response.data;
  },

  updateSettings: async (settingsData) => {
    const response = await api.put('/settings/', settingsData);
    return response.data;
  },

  // Password Management
  changePassword: async (passwordData) => {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  },

  // Team Management
  getTeamMembers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  addTeamMember: async (memberData) => {
    const response = await api.post('/admin/users', memberData);
    return response.data;
  },

  updateTeamMember: async (id, memberData) => {
    const response = await api.put(`/admin/users/${id}`, memberData);
    return response.data;
  },

  deactivateTeamMember: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  }
};

export default settingsService;
