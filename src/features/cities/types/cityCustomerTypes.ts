export type CityCustomerStatus = "open" | "completed" | "no-open-order";

export type CityCustomerItem = {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  currentOpenOrderId: string | null;
  currentOpenOrderLabel: string | null;
  status: CityCustomerStatus;
};
