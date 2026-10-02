import type { DeliveryType, Order, OrderStatus, PaymentMethod, StaffRole } from '../api/types';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  New: 'Yangi',
  Preparing: 'Tayyorlanmoqda',
  Ready: 'Tayyor',
  OnTheWay: "Yo'lda",
  Completed: 'Yakunlandi',
  Cancelled: 'Bekor qilindi',
};

export const STATUS_STYLE: Record<OrderStatus, string> = {
  New: 'bg-sky-50 text-sky-700 ring-sky-200',
  Preparing: 'bg-amber-50 text-amber-700 ring-amber-200',
  Ready: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  OnTheWay: 'bg-violet-50 text-violet-700 ring-violet-200',
  Completed: 'bg-stone-100 text-stone-600 ring-stone-200',
  Cancelled: 'bg-red-50 text-red-700 ring-red-200',
};

export const DELIVERY_LABEL: Record<DeliveryType, string> = {
  Delivery: 'Yetkazib berish',
  Pickup: 'Olib ketish',
  DineIn: 'Restoranda',
};

export const DELIVERY_ICON: Record<DeliveryType, string> = {
  Delivery: '🛵',
  Pickup: '🛍️',
  DineIn: '🍽️',
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  Cash: 'Naqd pul',
  Card: 'Karta (terminal)',
};

export const ROLE_LABEL: Record<StaffRole, string> = {
  Admin: 'Administrator',
  Manager: 'Menejer',
  Cook: 'Oshpaz',
  Courier: 'Kuryer',
};

const KITCHEN: StaffRole[] = ['Admin', 'Manager', 'Cook'];
const COURIERS: StaffRole[] = ['Admin', 'Manager', 'Courier'];
const MANAGEMENT: StaffRole[] = ['Admin', 'Manager'];

/** Mirrors OrderWorkflow on the server so buttons only appear for moves that will succeed. */
function nextSteps(status: OrderStatus, type: DeliveryType): { to: OrderStatus; roles: StaffRole[] }[] {
  switch (status) {
    case 'New':
      return [{ to: 'Preparing', roles: KITCHEN }, { to: 'Cancelled', roles: MANAGEMENT }];
    case 'Preparing':
      return [{ to: 'Ready', roles: KITCHEN }, { to: 'Cancelled', roles: MANAGEMENT }];
    case 'Ready':
      return type === 'Delivery'
        ? [{ to: 'OnTheWay', roles: COURIERS }, { to: 'Cancelled', roles: MANAGEMENT }]
        : [{ to: 'Completed', roles: MANAGEMENT }, { to: 'Cancelled', roles: MANAGEMENT }];
    case 'OnTheWay':
      return [{ to: 'Completed', roles: COURIERS }, { to: 'Cancelled', roles: MANAGEMENT }];
    default:
      return [];
  }
}

export function allowedActions(order: Pick<Order, 'status' | 'deliveryType'>, role: StaffRole): OrderStatus[] {
  return nextSteps(order.status, order.deliveryType)
    .filter((step) => step.roles.includes(role))
    .map((step) => step.to);
}

export function actionLabel(to: OrderStatus, type: DeliveryType): string {
  switch (to) {
    case 'Preparing':
      return 'Tayyorlashni boshlash';
    case 'Ready':
      return 'Tayyor';
    case 'OnTheWay':
      return "Yo'lga chiqdi";
    case 'Completed':
      return type === 'Delivery' ? 'Yetkazildi' : 'Mijozga berildi';
    case 'Cancelled':
      return 'Bekor qilish';
    default:
      return STATUS_LABEL[to];
  }
}

/** Steps a customer sees on the tracking page. */
export function trackingSteps(type: DeliveryType): { status: OrderStatus; title: string; hint: string }[] {
  const steps: { status: OrderStatus; title: string; hint: string }[] = [
    { status: 'New', title: 'Qabul qilindi', hint: 'Buyurtmangiz restoranga yetib keldi' },
    { status: 'Preparing', title: 'Tayyorlanmoqda', hint: 'Oshpazlarimiz taomingizni tayyorlashmoqda' },
    {
      status: 'Ready',
      title: 'Tayyor',
      hint: type === 'Delivery' ? 'Kuryerga topshirilmoqda' : 'Buyurtmangizni olib ketishingiz mumkin',
    },
  ];
  if (type === 'Delivery') {
    steps.push({ status: 'OnTheWay', title: "Yo'lda", hint: 'Kuryer siz tomon kelmoqda' });
  }
  steps.push({
    status: 'Completed',
    title: type === 'Delivery' ? 'Yetkazildi' : 'Berildi',
    hint: 'Yoqimli ishtaha!',
  });
  return steps;
}

const ORDER_OF: OrderStatus[] = ['New', 'Preparing', 'Ready', 'OnTheWay', 'Completed'];

export function statusIndex(status: OrderStatus): number {
  return ORDER_OF.indexOf(status);
}
