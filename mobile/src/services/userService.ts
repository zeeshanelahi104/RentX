import api from './api';

export const getProfile = () => api.get('/users/profile');

export const updateProfile = (data: { name?: string; city?: string }) =>
  api.patch('/users/profile', data);

export const uploadProfilePhoto = (formData: FormData) =>
  api.post('/users/profile-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
