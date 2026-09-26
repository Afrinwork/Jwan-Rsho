import { doc, onSnapshot, setDoc } from "firebase/firestore";

import { requireCurrentUserId, requireDb } from "@/src/repositories/repositoryContext.firebase";
import { ActiveTrip, RouteOrder } from "@/src/types/routeOrder";

// Merge-writes only the given fields, so saving the list never wipes the
// trip and vice versa (see firestore.rules /routeOrders).
async function mergeFields(userId: string, fields: Partial<RouteOrder>) {
  await setDoc(
    doc(requireDb(), "routeOrders", userId),
    { userId, updatedBy: requireCurrentUserId(), updatedAt: new Date().toISOString(), ...fields },
    { merge: true },
  );
}

// Doc id == the list owner's uid (see firestore.rules /routeOrders).
export const routeOrderRepository = {
  subscribeToRouteOrder(userId: string, onChange: (order: RouteOrder | null) => void, onError: (error: unknown) => void) {
    return onSnapshot(
      doc(requireDb(), "routeOrders", userId),
      (snapshot) => {
        if (!snapshot.exists()) return onChange(null);
        const data = snapshot.data() as RouteOrder;
        onChange({ ...data, customerIds: data.customerIds ?? [], trip: data.trip?.customerIds?.length ? data.trip : null });
      },
      onError,
    );
  },

  async saveRouteOrder(userId: string, customerIds: string[]) {
    await mergeFields(userId, { customerIds });
  },

  async clearRouteOrder(userId: string) {
    await mergeFields(userId, { customerIds: [] });
  },

  async saveActiveTrip(userId: string, trip: Omit<ActiveTrip, "updatedAt"> | null) {
    await mergeFields(userId, { trip: trip ? { ...trip, updatedAt: new Date().toISOString() } : null });
  },
};
