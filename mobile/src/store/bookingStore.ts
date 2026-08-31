import { create } from 'zustand';

interface BookingDraft {
  vehicleId: string;
  vehicleLabel: string;
  tripType: string;
  pickupLocation: string;
  dropLocation: string;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  paymentMethod: string;
}

interface BookingStore {
  draft: Partial<BookingDraft>;
  setDraft: (data: Partial<BookingDraft>) => void;
  clearDraft: () => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
  draft: {},
  setDraft: (data) => set((s) => ({ draft: { ...s.draft, ...data } })),
  clearDraft: () => set({ draft: {} }),
}));
