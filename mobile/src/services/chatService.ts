import api from './api';

export const getMessages = (bookingId: string) =>
  api.get(`/chats/${bookingId}/messages`);

export const sendMessage = (bookingId: string, text: string) =>
  api.post(`/chats/${bookingId}/messages`, { text });
