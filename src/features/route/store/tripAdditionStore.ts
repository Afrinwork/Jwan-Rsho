import { create } from "zustand";

// Connects the add-order form with the trip running on the map screen:
// the form offers "add to trip" only while a trip is started, and the trip
// takes the customers saved that way in as soon as they show up on the map.
type TripAdditionStore = {
  tripStarted: boolean;
  pendingCustomerIds: string[];
  setTripStarted: (value: boolean) => void;
  requestAddition: (customerId: string) => void;
  clearPending: (customerIds: string[]) => void;
};

export const useTripAdditionStore = create<TripAdditionStore>((set) => ({
  tripStarted: false,
  pendingCustomerIds: [],
  setTripStarted: (tripStarted) => set({ tripStarted }),
  requestAddition: (customerId) =>
    set((state) => ({
      pendingCustomerIds: state.pendingCustomerIds.includes(customerId)
        ? state.pendingCustomerIds
        : [...state.pendingCustomerIds, customerId],
    })),
  clearPending: (customerIds) =>
    set((state) => ({ pendingCustomerIds: state.pendingCustomerIds.filter((id) => !customerIds.includes(id)) })),
}));
