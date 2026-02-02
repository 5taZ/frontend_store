import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useRef } from 'react';
import { Product, CartItem, User, Order, OrderStatus, ProductRequest, View } from '../types';
import { api } from '../api';

interface StoreContextType {
  products: Product[];
  cart: CartItem[];
  user: User | null;
  orders: Order[];
  productRequests: ProductRequest[];
  currentView: View;
  setCurrentView: (view: View) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  addProduct: (product: Product) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
  updateProduct: (productId: string, product: Partial<Product>) => Promise<void>;
  placeOrder: () => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  processOrder: (orderId: string, approved: boolean) => Promise<void>;
  requestProduct: (productName: string, quantity: number, image?: string) => Promise<void>;
  processProductRequest: (requestId: string, approved: boolean) => Promise<void>;
  isAdmin: boolean;
  loading: boolean;
  refreshOrders: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshProductRequests: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [productRequests, setProductRequests] = useState<ProductRequest[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>(View.ITEMS);

  // Ref для отслеживания активных запросов
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Очистка всех запросов при размонтировании
  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach(controller => {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      });
      abortControllersRef.current.clear();
    };
  }, []);

  const loadOrders = useCallback(async (userId: number, adminStatus: boolean) => {
    try {
      let ordersData: any[];
      if (adminStatus) {
        ordersData = await api.getAllOrders();
      } else {
        ordersData = await api.getUserOrders(userId);
      }
      
      setOrders(ordersData.map((o: any) => ({
        id: o.id.toString(),
        userId: o.user_id,
        username: o.username || 'unknown',
        items: o.items || [],
        totalAmount: o.total_amount,
        status: o.status as OrderStatus,
        date: new Date(o.created_at).getTime()
      })));
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    try {
      const data: any[] = await api.getProducts();
      setProducts(data.map((p: any) => ({
        id: p.id.toString(),
        name: p.name,
        price: p.price,
        image: p.image,
        description: p.description,
        category: p.category,
        inStock: p.in_stock,
        quantity: p.quantity || 1
      })));
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    if (user) {
      await loadOrders(user.id, isAdmin);
    }
  }, [user, isAdmin, loadOrders]);

  const refreshProductRequests = useCallback(async () => {
    if (!user) return;
    
    try {
      let requestsData: any[];
      if (isAdmin) {
        requestsData = await api.getProductRequests();
      } else {
        requestsData = await api.getUserProductRequests(user.id);
      }
      
      const newRequests = requestsData.map((r: any) => ({
        id: r.id.toString(),
        userId: r.userId,
        username: r.username,
        productName: r.productName,
        quantity: r.quantity,
        image: r.image,
        status: r.status,
        createdAt: r.createdAt,
        processedAt: r.processedAt
      }));
      
      // 🔔 Проверка новых статусов для уведомлений
      const previousIds = new Set(productRequests.map(r => r.id));
      const newOrUpdated = newRequests.filter(r => {
        const old = productRequests.find(pr => pr.id === r.id);
        return !previousIds.has(r.id) || (old && old.status !== r.status);
      });
      
      // Показываем уведомление если статус изменился
      if (newOrUpdated.length > 0 && typeof window !== 'undefined') {
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.showPopup) {
          const latest = newOrUpdated[newOrUpdated.length - 1];
          if (latest.status === 'approved') {
            tg.showPopup({
              title: '✅ Запрос одобрен!',
              message: `Товар "${latest.productName}" добавлен в каталог. Вы можете заказать его прямо сейчас!`,
              buttons: [{ type: 'default', text: 'Перейти в каталог' }]
            });
          } else if (latest.status === 'rejected') {
            tg.showPopup({
              title: '❌ Запрос отклонен',
              message: `К сожалению, запрос на "${latest.productName}" не может быть выполнен.`,
              buttons: [{ type: 'default', text: 'Понятно' }]
            });
          }
        }
      }
      
      setProductRequests(newRequests);
    } catch (error) {
      console.error('Failed to load product requests:', error);
    }
  }, [user, isAdmin, productRequests]);

  useEffect(() => {
    if (!user) return;
    
    // 🔥 УМНЫЕ ИНТЕРВАЛЫ ОБНОВЛЕНИЯ
    const intervals: NodeJS.Timeout[] = [];
    
    // Заказы: 5 сек для ожидающих, 30 сек для остальных
    const ordersInterval = setInterval(async () => {
      if (!user) return;
      
      // Обновляем чаще только если есть ожидающие заказы
      const hasPending = orders.some(o => o.status === OrderStatus.PENDING);
      if (hasPending || isAdmin) {
        await refreshOrders();
      }
    }, 5000);
    intervals.push(ordersInterval);

    // Продукты: 30 сек (редко меняются)
    const productsInterval = setInterval(() => {
      refreshProducts();
    }, 30000);
    intervals.push(productsInterval);

    // 🔥 КРИТИЧЕСКИ ВАЖНО: Запросы на товары с умным интервалом
    const requestsInterval = setInterval(async () => {
      if (!user) return;
      
      // Обновляем чаще только если есть ожидающие запросы
      const hasPendingRequests = productRequests.some(r => r.status === 'pending');
      if (hasPendingRequests || isAdmin) {
        await refreshProductRequests();
      }
    }, 7000); // 7 секунд — оптимальный баланс
    intervals.push(requestsInterval);

    return () => {
      intervals.forEach(clearInterval);
    };
  }, [user, isAdmin, orders, productRequests, refreshOrders, refreshProducts, refreshProductRequests]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const tg = (window as any).Telegram?.WebApp;
        
        if (tg) {
          tg.ready();
          tg.expand();
          
          if (tg.colorScheme === 'dark') {
            document.body.style.backgroundColor = '#0a0a0a';
          }

          const tgUser = tg.initDataUnsafe?.user;
          
          if (tgUser) {
            try {
              const dbUser = await api.getOrCreateUser(
                tgUser.id,
                tgUser.username || `User_${tgUser.id}`
              );
              
              const userIsAdmin = dbUser.is_admin || false;
              setIsAdmin(userIsAdmin);
              
              const userData: User = {
                id: dbUser.id,
                username: dbUser.username,
                isAdmin: userIsAdmin,
                photoUrl: tgUser.photo_url
              };
              
              setUser(userData);

              await Promise.all([
                refreshProducts(),
                loadOrders(dbUser.id, userIsAdmin),
                refreshProductRequests()
              ]);

            } catch (error) {
              console.error('Backend connection failed:', error);
              setUser({
                id: tgUser.id,
                username: tgUser.username || 'unknown',
                isAdmin: false,
                photoUrl: tgUser.photo_url
              });
            }
          }
        } else {
          setUser({
            id: 999,
            username: 'dev_user',
            isAdmin: true,
            photoUrl: undefined
          });
          setIsAdmin(true);
          await refreshProducts();
          await refreshProductRequests();
        }
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [loadOrders, refreshProducts, refreshProductRequests]);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        const productInStock = products.find(p => p.id === product.id);
        const maxAvailable = (productInStock?.quantity || 1) - existing.quantity;
        
        if (maxAvailable <= 0) {
          return prev;
        }
        
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
  }, [products]);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const updateCartItemQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) => {
      const productInStock = products.find(p => p.id === productId);
      const maxAvailable = productInStock?.quantity || 1;
      const newQuantity = Math.min(quantity, maxAvailable);
      
      return prev.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  }, [products, removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const addProduct = useCallback(async (product: Product) => {
    const tempId = Date.now().toString();
    const optimisticProduct = { ...product, id: tempId };
    setProducts(prev => [optimisticProduct, ...prev]);
    
    try {
      const dbProduct: any = await api.addProduct(product);
      setProducts(prev => prev.map(p => p.id === tempId ? {
        id: dbProduct.id.toString(),
        name: dbProduct.name,
        price: dbProduct.price,
        image: dbProduct.image,
        description: dbProduct.description,
        category: dbProduct.category,
        inStock: dbProduct.in_stock,
        quantity: dbProduct.quantity || 1
      } : p));
    } catch (error) {
      setProducts(prev => prev.filter(p => p.id !== tempId));
      throw error;
    }
  }, []);

  const removeProduct = useCallback(async (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    try {
      await api.deleteProduct(productId);
    } catch (error) {
      refreshProducts();
      throw error;
    }
  }, [refreshProducts]);

  const updateProduct = useCallback(async (productId: string, product: Partial<Product>) => {
    console.log('🔄 updateProduct called:', { productId, product });
    
    if (product.quantity !== undefined && typeof product.quantity !== 'number') {
      console.warn('⚠️ Quantity is not a number, converting:', product.quantity);
      product = { ...product, quantity: Number(product.quantity) };
    }
    
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, ...product } : p
    ));
    
    try {
      const result = await api.updateProduct(productId, product);
      console.log('✅ updateProduct succeeded:', result);
      return result;
    } catch (error) {
      console.error('❌ updateProduct failed:', error);
      refreshProducts();
      throw error;
    }
  }, [refreshProducts]);

  const placeOrder = useCallback(async () => {
    if (!user || cart.length === 0) {
      console.warn('⚠️ Cannot place order: no user or empty cart');
      return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tempOrderId = 'temp-' + Date.now();
    
    console.log('📦 Starting placeOrder:', { userId: user.id, cartLength: cart.length, total });
    
    const optimisticOrder: Order = {
      id: tempOrderId,
      userId: user.id,
      username: user.username,
      items: [...cart],
      totalAmount: total,
      status: OrderStatus.PENDING,
      date: Date.now()
    };
    
    setOrders(prev => [optimisticOrder, ...prev]);
    setCart([]);
    
    console.log('✅ Cart cleared, optimistic order added');
    
    setProducts(prev => {
      const updated = prev
        .map(p => {
          const cartItem = cart.find(item => item.id === p.id);
          if (cartItem) {
            const newQuantity = (p.quantity || 1) - cartItem.quantity;
            console.log(`📦 Product ${p.name}: ${p.quantity} → ${newQuantity}`);
            if (newQuantity <= 0) {
              console.log(`🗑️ Product ${p.name} removed (quantity <= 0)`);
              return null;
            }
            return { ...p, quantity: newQuantity };
          }
          return p;
        })
        .filter((p): p is Product => p !== null);
      
      console.log(`✅ Products updated: ${updated.length} items remaining`);
      return updated;
    });

    try {
      const cartItemsWithNumberId = cart.map(item => ({
        ...item,
        id: parseInt(item.id)
      }));
      
      console.log('📤 Sending to server:', { 
        user_id: user.id, 
        items: cartItemsWithNumberId, 
        total_amount: total 
      });
      
      const dbOrder: any = await api.createOrder(user.id, cartItemsWithNumberId, total);
      
      console.log('✅ Server response:', dbOrder);
      
      setOrders(prev => {
        const updated = prev.map(o => 
          o.id === tempOrderId 
            ? { ...o, id: dbOrder.id.toString(), date: new Date(dbOrder.created_at || Date.now()).getTime() }
            : o
        );
        console.log('✅ Order ID updated:', dbOrder.id);
        return updated;
      });
      
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.showPopup) {
        tg.showPopup({ 
          title: 'Заказ оформлен', 
          message: 'Ваш заказ принят. Товары зарезервированы и ожидают подтверждения.' 
        });
      }
      
      console.log('🎉 Order placed successfully!');
    } catch (error: any) {
      console.error('❌ Error in placeOrder:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      console.log('🔄 Rolling back changes...');
      
      setOrders(prev => {
        const filtered = prev.filter(o => o.id !== tempOrderId);
        console.log(`✅ Removed temp order, ${filtered.length} orders remaining`);
        return filtered;
      });
      
      setProducts(prev => {
        const restored = [...prev];
        console.log('🔄 Restoring products...');
        
        cart.forEach(item => {
          const existing = restored.find(p => p.id === item.id);
          if (existing) {
            existing.quantity = (existing.quantity || 0) + item.quantity;
            console.log(`📦 Restored ${item.name}: +${item.quantity} → ${existing.quantity}`);
          } else {
            restored.push({ ...item, quantity: item.quantity });
            console.log(`📦 Added back ${item.name}: ${item.quantity}`);
          }
        });
        
        console.log(`✅ Products restored: ${restored.length} items`);
        return restored;
      });
      
      setCart(cart);
      console.log('✅ Cart restored');
      
      alert(`Не удалось оформить заказ: ${error.message || 'Неизвестная ошибка'}. Пожалуйста, попробуйте снова.`);
      throw error;
    }
  }, [user, cart]);

  const cancelOrder = useCallback(async (orderId: string) => {
    if (!user) return;
    
    const originalOrder = orders.find(o => o.id === orderId);
    if (!originalOrder) return;
    
    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, status: OrderStatus.CANCELED } : o
    ));

    try {
      await api.updateOrderStatus(orderId, 'CANCELED', undefined, user.id);
    } catch (error) {
      setOrders(prev => prev.map(o => 
        o.id === orderId ? originalOrder : o
      ));
      alert('Не удалось отменить заказ');
    }
  }, [user, orders]);

  const processOrder = useCallback(async (orderId: string, approved: boolean) => {
    if (!isAdmin) return;
    
    const originalOrder = orders.find(o => o.id === orderId);
    if (!originalOrder) return;
    
    const newStatus = approved ? OrderStatus.CONFIRMED : OrderStatus.CANCELED;
    
    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    ));

    try {
      const tg = (window as any).Telegram?.WebApp;
      await api.updateOrderStatus(orderId, approved ? 'CONFIRMED' : 'CANCELED', tg?.initData);
    } catch (error) {
      setOrders(prev => prev.map(o => 
        o.id === orderId ? originalOrder : o
      ));
      throw error;
    }
  }, [isAdmin, orders]);

  const requestProduct = useCallback(async (productName: string, quantity: number, image?: string) => {
    if (!user) {
      console.error('❌ Cannot request product: no user');
      alert('Вы должны войти в систему, чтобы запросить товар');
      return;
    }
    
    // Отменяем предыдущий запрос если есть
    const requestKey = `product-request:${user.id}:${Date.now()}`;
    if (abortControllersRef.current.has(requestKey)) {
      abortControllersRef.current.get(requestKey)!.abort();
    }
    
    const controller = new AbortController();
    abortControllersRef.current.set(requestKey, controller);
    
    try {
      console.log('📤 Sending product request:', { 
        userId: user.id, 
        productName, 
        quantity, 
        image
      });
      
      // Используем оптимизированный метод с поддержкой отмены
      const result = await api.requestProduct(
        user.id, 
        productName, 
        quantity, 
        image,
        controller.signal
      );
      
      console.log('✅ Product request successful:', result);
      
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.showPopup) {
        tg.showPopup({
          title: 'Запрос отправлен',
          message: 'Ваш запрос отправлен администратору. Вы получите уведомление, когда он будет обработан.'
        });
      }
      
      await refreshProductRequests();
      
      console.log('✅ Product request flow completed');
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      
      console.error('❌ Product request error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      alert(`Не удалось запросить товар: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      abortControllersRef.current.delete(requestKey);
    }
  }, [user, refreshProductRequests]);

  const processProductRequest = useCallback(async (requestId: string, approved: boolean) => {
    if (!isAdmin) return;
    
    try {
      const status = approved ? 'approved' : 'rejected';
      await api.processProductRequest(requestId, status as any);
      
      await refreshProductRequests();
    } catch (error: any) {
      alert(`Не удалось обработать запрос: ${error.message || 'Неизвестная ошибка'}`);
    }
  }, [isAdmin, refreshProductRequests]);

  return (
    <StoreContext.Provider
      value={{
        products,
        cart,
        user,
        orders,
        productRequests,
        currentView,
        setCurrentView,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        addProduct,
        removeProduct,
        updateProduct,
        placeOrder,
        cancelOrder,
        processOrder,
        requestProduct,
        processProductRequest,
        isAdmin,
        loading,
        refreshOrders,
        refreshProducts,
        refreshProductRequests
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
