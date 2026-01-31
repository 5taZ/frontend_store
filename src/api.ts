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
        init_data: getInitData()  // ← исправлено: добавлено двоеточие
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
        init_data: getInitData()  // ← исправлено
      })
    });
    if (!response.ok) throw new Error('Failed to add product');
    return response.json();
  },

  async deleteProduct(productId: string) {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ init_data: getInitData() })  // ← исправлено
    });
    if (!response.ok) throw new Error('Failed to delete product');
    return response.json();
  },

  async updateProduct(productId: string, product: Partial<any>) {
    console.log('📡 API updateProduct called:', { productId, product });
    
    if (product.quantity !== undefined && typeof product.quantity !== 'number') {
      console.warn('⚠️ API: Quantity is not a number, converting:', product.quantity);
      product = { ...product, quantity: Number(product.quantity) };
    }
    
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...product,
        init_data: getInitData()  // ← исправлено
      })
    });
    
    console.log('📡 API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API error response:', errorText);
      throw new Error(errorText || 'Failed to update product');
    }
    
    const data = await response.json();
    console.log('✅ API response ', data);
    return data;
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
    console.log('📡 API createOrder called:', { userId, itemsCount: items.length, totalAmount });
    
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: userId, 
        items, 
        total_amount: totalAmount,
        init_data: getInitData()  // ← исправлено
      })
    });
    
    console.log('📡 API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API error response:', errorText);
      throw new Error(errorText || 'Failed to create order');
    }
    
    const data = await response.json();
    console.log('✅ API response ', data);
    return data;
  },

  async updateOrderStatus(orderId: string, status: string, initData?: string, userId?: number) {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status,
        init_data: initData || getInitData(),  // ← исправлено: было init_ initData
        user_id: userId
      })
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to update order status');
    }
    return response.json();
  },

  async requestProduct(userId: number, productName: string, quantity: number, image?: string) {
    console.log('📡 API requestProduct called:', { userId, productName, quantity, image });
    
    const initData = getInitData();
    console.log('📡 Telegram init ', initData ? 'Present' : 'Missing');
    
    const response = await fetch(`${API_BASE_URL}/product-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: userId,
        product_name: productName,
        quantity,
        image,
        init_data: initData  // ← исправлено: было init_ initData
      })
    });
    
    console.log('📡 API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API error response:', errorText);
      throw new Error(errorText || 'Failed to request product');
    }
    
    const data = await response.json();
    console.log('✅ API response ', data);
    return data;
  },

  async getProductRequests() {
    const response = await fetch(`${API_BASE_URL}/product-requests`, {
      headers: { 'X-Telegram-Init-Data': getInitData() }
    });
    if (!response.ok) throw new Error('Failed to fetch product requests');
    return response.json();
  },

  async getUserProductRequests(userId: number) {
    const response = await fetch(`${API_BASE_URL}/product-requests/user/${userId}`, {
      headers: { 'X-Telegram-Init-Data': getInitData() }
    });
    if (!response.ok) throw new Error('Failed to fetch user product requests');
    return response.json();
  },

  async processProductRequest(requestId: string, status: 'approved' | 'rejected') {
    const response = await fetch(`${API_BASE_URL}/product-requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status,
        init_data: getInitData()  // ← исправлено
      })
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to process product request');
    }
    return response.json();
  },
};
