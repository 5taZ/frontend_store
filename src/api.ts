const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Кэш для запросов
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10000; // 10 секунд

// Отслеживание активных запросов для предотвращения дубликатов
const activeRequests = new Map<string, Promise<any>>();

// AbortController для отмены запросов
const abortControllers = new Map<string, AbortController>();

const getInitData = (): string => {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    return (window as any).Telegram.WebApp.initData || '';
  }
  return '';
};

// Генерация уникального ключа для запроса
const getRequestKey = (url: string, method: string, body?: any) => {
  return `${method}:${url}:${JSON.stringify(body)}`;
};

// Очистка старого кэша
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      requestCache.delete(key);
    }
  }
}, CACHE_TTL / 2);

export const api = {
  // Универсальный метод с кэшированием и отменой
  async request<T>(
    url: string,
    options: RequestInit = {},
    useCache: boolean = false,
    cacheKey?: string
  ): Promise<T> {
    const fullUrl = `${API_BASE_URL}${url}`;
    const key = cacheKey || getRequestKey(fullUrl, options.method || 'GET', options.body);
    
    // Проверка кэша
    if (useCache && requestCache.has(key)) {
      const cached = requestCache.get(key)!;
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }
    
    // Проверка активных запросов (дедупликация)
    if (activeRequests.has(key)) {
      return activeRequests.get(key)!;
    }
    
    // Отмена предыдущего запроса с тем же ключом
    if (abortControllers.has(key)) {
      abortControllers.get(key)!.abort();
    }
    
    const controller = new AbortController();
    abortControllers.set(key, controller);
    
    const requestPromise = (async () => {
      try {
        const response = await fetch(fullUrl, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // Сохранение в кэш
        if (useCache) {
          requestCache.set(key, { data, timestamp: Date.now() });
        }
        
        return data;
      } finally {
        activeRequests.delete(key);
        abortControllers.delete(key);
      }
    })();
    
    activeRequests.set(key, requestPromise);
    return requestPromise;
  },

  // Отмена всех запросов
  abortAll() {
    abortControllers.forEach(controller => controller.abort());
    abortControllers.clear();
    activeRequests.clear();
  },

  // Отмена запроса по ключу
  abort(key: string) {
    if (abortControllers.has(key)) {
      abortControllers.get(key)!.abort();
      abortControllers.delete(key);
      activeRequests.delete(key);
    }
  },

  async getOrCreateUser(telegramId: number, username: string) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify({ 
        telegram_id: telegramId, 
        username,
        init_data: getInitData()
      })
    });
  },

  async getProducts() {
    return this.request('/products', {}, true, 'products:list');
  },

  async addProduct(product: any) {
    const result = await this.request('/products', {
      method: 'POST',
      body: JSON.stringify({
        ...product,
        init_data: getInitData()
      })
    });
    // Инвалидация кэша продуктов
    requestCache.delete('products:list');
    return result;
  },

  async deleteProduct(productId: string) {
    const result = await this.request(`/products/${productId}`, {
      method: 'DELETE',
      body: JSON.stringify({ init_data: getInitData() })
    });
    requestCache.delete('products:list');
    return result;
  },

  async updateProduct(productId: string, product: Partial<any>) {
    if (product.quantity !== undefined && typeof product.quantity !== 'number') {
      product = { ...product, quantity: Number(product.quantity) };
    }
    
    const result = await this.request(`/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...product,
        init_data: getInitData()
      })
    });
    requestCache.delete('products:list');
    return result;
  },

  async getAllOrders() {
    return this.request('/orders', {
      headers: { 'X-Telegram-Init-Data': getInitData() }
    });
  },

  async getUserOrders(userId: number) {
    return this.request(`/orders/user/${userId}`, {
      headers: { 'X-Telegram-Init-Data': getInitData() }
    }, true, `orders:user:${userId}`);
  },

  async createOrder(userId: number, items: any[], totalAmount: number) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify({ 
        user_id: userId, 
        items, 
        total_amount: totalAmount,
        init_data: getInitData()
      })
    });
  },

  async updateOrderStatus(orderId: string, status: string, initData?: string, userId?: number) {
    return this.request(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ 
        status,
        init_data: initData || getInitData(),
        user_id: userId
      })
    });
  },

  // ✅ ОПТИМИЗИРОВАНО: Добавлена поддержка отмены запросов
  async requestProduct(
    userId: number, 
    productName: string, 
    quantity: number, 
    image?: string,
    signal?: AbortSignal
  ) {
    const controller = signal ? undefined : new AbortController();
    const abortSignal = signal || controller?.signal;
    
    try {
      const response = await fetch(`${API_BASE_URL}/product-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId,
          product_name: productName,
          quantity,
          image,
          init_data: getInitData()
        }),
        signal: abortSignal
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to request product');
      }
      
      return response.json();
    } finally {
      // Очищаем контроллер если создавали его
      if (controller) {
        // Контроллер будет очищен автоматически
      }
    }
  },

  async getProductRequests() {
    return this.request('/product-requests', {
      headers: { 'X-Telegram-Init-Data': getInitData() }
    });
  },

  async getUserProductRequests(userId: number) {
    return this.request(`/product-requests/user/${userId}`, {
      headers: { 'X-Telegram-Init-Data': getInitData() }
    }, true, `product-requests:user:${userId}`);
  },

  async processProductRequest(requestId: string, status: 'approved' | 'rejected') {
    return this.request(`/product-requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ 
        status,
        init_data: getInitData()
      })
    });
  },
};
