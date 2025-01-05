import { OrderStatus } from "@/types";

type OrderStatusInfo = {
  label: string;
  value: OrderStatus;
  progressValue: number;
};

export const ORDER_STATUS: OrderStatusInfo[] = [
  { label: "Cancelled", value: "placed", progressValue: 0 },
  {
    label: "Awaiting Store Confirmation",
    value: "paid",
    progressValue: 25,
  },
  { label: "In Progress", value: "inProgress", progressValue: 50 },
  { label: "Ready for Pickup", value: "outForDelivery", progressValue: 75 },
  { label: "Picked Up", value: "delivered", progressValue: 100 },
];
