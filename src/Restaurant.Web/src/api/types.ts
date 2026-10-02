export type StaffRole = 'Admin' | 'Manager' | 'Cook' | 'Courier';
export type DeliveryType = 'Delivery' | 'Pickup' | 'DineIn';
export type OrderStatus = 'New' | 'Preparing' | 'Ready' | 'OnTheWay' | 'Completed' | 'Cancelled';
export type PaymentMethod = 'Cash' | 'Card';

export interface Product {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string | null;
  portion: string | null;
  badge: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  sortOrder: number;
}

export interface MenuCategory {
  id: number;
  name: string;
  products: Product[];
}

export interface Category {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

export interface DeliveryZone {
  id: number;
  name: string;
  description: string | null;
  fee: number;
  minOrderAmount: number;
  freeDeliveryFrom: number | null;
  minMinutes: number;
  maxMinutes: number;
  isActive: boolean;
  sortOrder: number;
}

export interface OrderItem {
  productId: number | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderTracking {
  id: number;
  status: OrderStatus;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  subTotal: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryZoneName: string | null;
  estimatedMinutes: number;
  courierName: string | null;
  courierPhone: string | null;
  createdAt: string;
  updatedAt: string | null;
  items: OrderItem[];
}

export interface Order extends OrderTracking {
  customerName: string;
  customerPhone: string;
  address: string | null;
  comment: string | null;
  courierId: number | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface StaffUser {
  id: number;
  fullName: string;
  phoneNumber: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: StaffUser;
}

export interface Dashboard {
  todayOrders: number;
  todayRevenue: number;
  averageCheck: number;
  activeOrders: number;
  activeByStatus: { status: OrderStatus; count: number }[];
  last7Days: { date: string; orders: number; revenue: number }[];
  topProducts: { productName: string; quantity: number; revenue: number }[];
}

export interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  deliveryType: DeliveryType;
  deliveryZoneId?: number;
  address?: string;
  comment?: string;
  paymentMethod: PaymentMethod;
  items: { productId: number; quantity: number }[];
}

export interface ProductRequest {
  categoryId: number;
  name: string;
  description?: string;
  portion?: string;
  badge?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  sortOrder: number;
}

export interface CategoryRequest {
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export type DeliveryZoneRequest = Omit<DeliveryZone, 'id'>;
