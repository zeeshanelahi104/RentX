import api from './api';

export const createBooking = (data: {
  vehicleId: string;
  tripType: string;
  pickupLocation: string;
  dropLocation?: string;
  startDate: string;
  endDate: string;
  paymentMethod: string;
  notes?: string;
}) => api.post('/bookings', data);

export const getMyBookings = (status?: string) =>
  api.get('/bookings/my-bookings', { params: status ? { status } : {} });

export const getDriverBookings = (status?: string) =>
  api.get('/bookings/driver-bookings', { params: status ? { status } : {} });

export const getBookingById = (id: string) => api.get(`/bookings/${id}`);

export const acceptBooking = (id: string) => api.patch(`/bookings/${id}/accept`);

export const startTrip = (id: string) => api.patch(`/bookings/${id}/start`);

export const completeTrip = (id: string) => api.patch(`/bookings/${id}/complete`);

export const cancelBooking = (id: string, reason?: string) =>
  api.patch(`/bookings/${id}/cancel`, { reason });

export const rateBooking = (id: string, score: number, comment: string) =>
  api.post(`/bookings/${id}/rate`, { score, comment });
