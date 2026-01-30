export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  inStock: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: number;
  username: string;
  isAdmin: boolean;
  // Убраны balance, referrals, referralLink
}

export enum View {
  HOME = 'HOME',
  SEARCH = 'SEARCH',
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
  userId: number; // Изменено на number (ID из БД)
  username: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  date: number;
}

export const ADMIN_TELEGRAM_USERNAME = "next_gear_manager";
