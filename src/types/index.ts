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
  id: number; // Database ID
  username: string;
  balance: number;
  referrals: number;
  referralLink: string;
  isAdmin: boolean;
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
  userId: string;
  username: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  date: number;
}

export const ADMIN_TELEGRAM_USERNAME = "next_gear_manager";
