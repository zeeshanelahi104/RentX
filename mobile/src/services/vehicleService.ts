import api from './api';

export const getVehicles = (params: {
  city?: string;
  type?: string;
  tripType?: string;
  seats?: number;
}) => api.get('/vehicles', { params });

export const getVehicleById = (id: string) => api.get(`/vehicles/${id}`);

export const getMyVehicles = () => api.get('/vehicles/my-vehicles');

export const addVehicle = (data: any) => api.post('/vehicles', data);

export const updateVehicle = (id: string, data: any) => api.patch(`/vehicles/${id}`, data);

export const uploadVehiclePhotos = (id: string, formData: FormData) =>
  api.post(`/vehicles/${id}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
