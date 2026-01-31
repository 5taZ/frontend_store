]export interface Product {
  id: string;
  name: string;
  price: number;
  image: string; // Теперь это может быть base64 dataURL
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
}

export enum View {
  ITEMS = 'ITEMS',  // Вместо HOME и SEARCH
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

export const ADMIN_TELEGRAM_USERNAME = "next_gear_manager";
