const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getInitData = (): string => {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    return (window as any).Telegram.WebApp.initData || '';
  }
  return '';
};

export const api = {
  async getOrCreateUser(telegramId: number, username: string) {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        telegram_id: telegramId, 
        username,
        init_data: getInitData()
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to get user');
    }
    return response.json();
  },

  async getProducts() {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  async addProduct(product: any) {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...product,
        init_data: getInitData()
      })
    });
    if (!response.ok) throw new Error('Failed to add product');
    return response.json();
  },

  async deleteProduct(productId: string) {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ init_data: getInitData() })
    });
    if (!response.ok) throw new Error('Failed to delete product');
    return response.json();
  },

  async getAllOrders() {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      headers: { 'X-Telegram-Init-Data': getInitData() }
    });
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  },

  async getUserOrders(userId: number) {
    const response = await fetch(`${API_BASE_URL}/orders/user/${userId}`, {
      headers: { 'X-Telegram-Init-Data': getInitData() }
    });
    if (!response.ok) throw new Error('Failed to fetch user orders');
    return response.json();
  },

  async createOrder(userId: number, items: any[], totalAmount: number) {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: userId, 
        items, 
        total_amount: totalAmount,
        init_data: getInitData()
      })
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create order');
    }
    return response.json();
  },

  // Универсальный метод для изменения статуса (отмена пользователем или обработка админом)
  async updateOrderStatus(orderId: string, status: string, initData?: string, userId?: number) {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status,
        init_data: initData || getInitData(),
        user_id: userId // Для проверки прав пользователя при отмене
      })
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to update order status');
    }
    return response.json();
  }
};
