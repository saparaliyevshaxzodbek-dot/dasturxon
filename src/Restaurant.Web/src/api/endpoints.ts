import { api } from './client';
import type {
  Category,
  CategoryRequest,
  CreateOrderRequest,
  Dashboard,
  DeliveryZone,
  DeliveryZoneRequest,
  LoginResponse,
  MenuCategory,
  Order,
  OrderStatus,
  OrderTracking,
  PagedResult,
  Product,
  ProductRequest,
  StaffRole,
  StaffUser,
} from './types';

export const menuApi = {
  get: () => api<MenuCategory[]>('/menu'),
};

export const zonesApi = {
  active: () => api<DeliveryZone[]>('/delivery-zones'),
  all: () => api<DeliveryZone[]>('/delivery-zones/all'),
  create: (request: DeliveryZoneRequest) => api<DeliveryZone>('/delivery-zones', { method: 'POST', body: request }),
  update: (id: number, request: DeliveryZoneRequest) =>
    api<DeliveryZone>(`/delivery-zones/${id}`, { method: 'PUT', body: request }),
  remove: (id: number) => api<void>(`/delivery-zones/${id}`, { method: 'DELETE' }),
};

export const authApi = {
  login: (phoneNumber: string, password: string) =>
    api<LoginResponse>('/auth/login', { method: 'POST', body: { phoneNumber, password } }),
};

export const ordersApi = {
  create: (request: CreateOrderRequest) => api<OrderTracking>('/orders', { method: 'POST', body: request }),
  track: (id: number, phone: string) => api<OrderTracking>(`/orders/${id}/track`, { method: 'POST', body: { phone } }),
  active: () => api<Order[]>('/orders/active'),
  list: (query: { status?: OrderStatus; date?: string; search?: string; page: number; pageSize: number }) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, String(value));
    });
    return api<PagedResult<Order>>(`/orders?${params}`);
  },
  setStatus: (id: number, status: OrderStatus, courierId?: number) =>
    api<Order>(`/orders/${id}/status`, { method: 'PATCH', body: { status, courierId } }),
};

export const dashboardApi = {
  get: () => api<Dashboard>('/dashboard'),
};

export const categoriesApi = {
  list: () => api<Category[]>('/categories'),
  create: (request: CategoryRequest) => api<Category>('/categories', { method: 'POST', body: request }),
  update: (id: number, request: CategoryRequest) => api<Category>(`/categories/${id}`, { method: 'PUT', body: request }),
  remove: (id: number) => api<void>(`/categories/${id}`, { method: 'DELETE' }),
};

export const productsApi = {
  list: () => api<Product[]>('/products'),
  create: (request: ProductRequest) => api<Product>('/products', { method: 'POST', body: request }),
  update: (id: number, request: ProductRequest) => api<Product>(`/products/${id}`, { method: 'PUT', body: request }),
  setAvailability: (id: number, isAvailable: boolean) =>
    api<Product>(`/products/${id}/availability`, { method: 'PATCH', body: { isAvailable } }),
  remove: (id: number) => api<void>(`/products/${id}`, { method: 'DELETE' }),
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api<{ url: string }>('/uploads/image', { method: 'POST', form });
  },
};

export const staffApi = {
  list: () => api<StaffUser[]>('/staff'),
  couriers: () => api<StaffUser[]>('/staff/couriers'),
  create: (request: { fullName: string; phoneNumber: string; password: string; role: StaffRole }) =>
    api<StaffUser>('/staff', { method: 'POST', body: request }),
  update: (id: number, request: { fullName: string; role: StaffRole; isActive: boolean; newPassword?: string }) =>
    api<StaffUser>(`/staff/${id}`, { method: 'PUT', body: request }),
};
