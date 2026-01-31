export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  inStock: boolean;
  quantity?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: number;
  username: string;
  isAdmin: boolean;
}

export enum View {
  ITEMS = 'ITEMS',
  CART = 'CART',
  PROFILE = 'PROFILE',
  ADMIN = 'ADMIN'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELED = 'CANCELED'
}

export interface Order {
  id: string;
  userId: number;
  username: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  date: number;
}

export interface Notification {
  id: string;
  type: 'order_confirmed' | 'order_rejected' | 'product_requested';
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  orderId?: string;
}

export interface ProductRequest {
  id: string;
  userId: number;
  username: string;
  productName: string;
  quantity: number;
  image?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export const ADMIN_TELEGRAM_USERNAME = "next_gear_manager";
