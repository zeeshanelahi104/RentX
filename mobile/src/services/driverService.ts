import api from './api';

export const onboardDriver = (data: {
  cnicNumber: string;
  licenseNumber?: string;
  city: string;
  bio?: string;
}) => api.post('/drivers/onboard', data);

export const uploadDriverDocs = (formData: FormData) =>
  api.post('/drivers/upload-docs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getMyDriverProfile = () => api.get('/drivers/me');

export const toggleOnline = () => api.patch('/drivers/toggle-online');

export const updateLocation = (lat: number, lng: number) =>
  api.patch('/drivers/location', { lat, lng });

export const getEarnings = () => api.get('/drivers/earnings/summary');
