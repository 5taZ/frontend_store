import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Product, CartItem, User, Order, OrderStatus } from '../types';
import { api } from '../api';

interface StoreContextType {
  products: Product[];
  cart: CartItem[];
  user: User | null;
  orders: Order[];
  addToCart: (product: Product) => void; // Синхронно, без ожидания
  removeFromCart: (productId: string) => void; // Синхронно
  clearCart: () => void;
  addProduct: (product: Product) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
  placeOrder: () => Promise<void>; // Оптимистичное обновление
  cancelOrder: (orderId: string) => Promise<void>; // Оптимистичное обновление
  processOrder: (orderId: string, approved: boolean) => Promise<void>; // Оптимистичное обновление
  isAdmin: boolean;
  loading: boolean;
  refreshOrders: () => Promise<void>;
  refreshProducts: () => Promise<void>; // Добавлено
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Загрузка заказов (оптимизированная)
  const loadOrders = useCallback(async (userId: number, adminStatus: boolean) => {
    try {
      let ordersData;
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

  // Загрузка продуктов (оптимизированная)
  const refreshProducts = useCallback(async () => {
    try {
      const data = await api.getProducts();
      setProducts(data.map((p: any) => ({
        id: p.id.toString(),
        name: p.name,
        price: p.price,
        image: p.image,
        description: p.description,
        category: p.category,
        inStock: p.in_stock
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

  // 🔄 AUTO-REFRESH: Обновление данных каждые 5 секунд (Real-time эффект)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      refreshOrders(); // Проверяем новые заказы/статусы
      refreshProducts(); // Проверяем новые товары
    }, 5000); // 5 секунд - оптимально для Telegram Mini App

    return () => clearInterval(interval);
  }, [user, isAdmin, refreshOrders, refreshProducts]);

  // Инициализация
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
                isAdmin: userIsAdmin
              };
              
              setUser(userData);

              // Параллельная загрузка (быстрее чем последовательная)
              await Promise.all([
                refreshProducts(),
                loadOrders(dbUser.id, userIsAdmin)
              ]);

            } catch (error) {
              console.error('Backend connection failed:', error);
              setUser({
                id: tgUser.id,
                username: tgUser.username || 'unknown',
                isAdmin: false
              });
            }
          }
        } else {
          setUser({
            id: 999,
            username: 'dev_user',
            isAdmin: true
          });
          setIsAdmin(true);
          await refreshProducts();
        }
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [loadOrders, refreshProducts]);

  // ⚡ ОПТИМИСТИЧНО: addToCart мгновенно, без ожидания сервера
  const addToCart = useCallback((product: Product) => {
    // Мгновенное обновление UI
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    
    // Мгновенная вибрация (если поддерживается)
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const addProduct = useCallback(async (product: Product) => {
    // Оптимистично добавляем в UI сразу
    const tempId = Date.now().toString();
    const optimisticProduct = { ...product, id: tempId };
    setProducts(prev => [optimisticProduct, ...prev]);
    
    try {
      const dbProduct = await api.addProduct(product);
      // Заменяем временный ID на реальный
      setProducts(prev => prev.map(p => p.id === tempId ? {
        id: dbProduct.id.toString(),
        name: dbProduct.name,
        price: dbProduct.price,
        image: dbProduct.image,
        description: dbProduct.description,
        category: dbProduct.category,
        inStock: dbProduct.in_stock
      } : p));
    } catch (error) {
      // Откат при ошибке
      setProducts(prev => prev.filter(p => p.id !== tempId));
      throw error;
    }
  }, []);

  const removeProduct = useCallback(async (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId)); // Сразу убираем
    try {
      await api.deleteProduct(productId);
    } catch (error) {
      refreshProducts(); // Возвращаем если ошибка
      throw error;
    }
  }, [refreshProducts]);

  // ⚡ ОПТИМИСТИЧНО: Заказ создается мгновенно в UI
  const placeOrder = useCallback(async () => {
    if (!user || cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tempOrderId = 'temp-' + Date.now();
    
    // 1. Сразу показываем заказ в истории (PENDING)
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
    setCart([]); // Сразу очищаем корзину
    
    // 2. Убираем товары из каталога сразу (резервирование)
    const purchasedIds = cart.map(item => item.id);
    setProducts(prev => prev.filter(p => !purchasedIds.includes(p.id)));

    try {
      // 3. Отправляем на сервер в фоне
      const dbOrder = await api.createOrder(user.id, cart, total);
      
      // 4. Обновляем на реальный ID
      setOrders(prev => prev.map(o => 
        o.id === tempOrderId 
          ? { ...o, id: dbOrder.id.toString(), date: new Date(dbOrder.created_at).getTime() }
          : o
      ));
      
      // Успех
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.showPopup) {
        tg.showPopup({ title: 'Order Placed', message: 'Successfully reserved!' });
      }
    } catch (error) {
      // Откат при ошибке
      setOrders(prev => prev.filter(o => o.id !== tempOrderId));
      setProducts(prev => [...cart, ...prev]); // Возвращаем товары
      setCart(cart); // Возвращаем корзину
      alert('Failed to place order. Please try again.');
    }
  }, [user, cart]);

  // ⚡ ОПТИМИСТИЧНО: Отмена заказа
  const cancelOrder = useCallback(async (orderId: string) => {
    if (!user) return;
    
    const originalOrder = orders.find(o => o.id === orderId);
    if (!originalOrder) return;
    
    // Сразу меняем статус в UI
    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, status: OrderStatus.CANCELED } : o
    ));
    
    // Возвращаем товары сразу
    setProducts(prev => [...originalOrder.items.map(i => ({ ...i, inStock: true })), ...prev]);

    try {
      await api.updateOrderStatus(orderId, 'CANCELED', undefined, user.id);
    } catch (error) {
      // Откат
      setOrders(prev => prev.map(o => 
        o.id === orderId ? originalOrder : o
      ));
      setProducts(prev => prev.filter(p => !originalOrder.items.some(i => i.id === p.id)));
      alert('Failed to cancel order');
    }
  }, [user, orders]);

  // ⚡ ОПТИМИСТИЧНО: Обработка заказа админом
  const processOrder = useCallback(async (orderId: string, approved: boolean) => {
    if (!isAdmin) return;
    
    const originalOrder = orders.find(o => o.id === orderId);
    if (!originalOrder) return;
    
    const newStatus = approved ? OrderStatus.CONFIRMED : OrderStatus.CANCELED;
    
    // Сразу обновляем UI
    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    ));

    // Если отмена - возвращаем товары сразу
    if (!approved) {
      setProducts(prev => [...originalOrder.items.map(i => ({ ...i, inStock: true })), ...prev]);
    }

    try {
      const tg = (window as any).Telegram?.WebApp;
      await api.updateOrderStatus(orderId, approved ? 'CONFIRMED' : 'CANCELED', tg?.initData);
    } catch (error) {
      // Откат
      setOrders(prev => prev.map(o => 
        o.id === orderId ? originalOrder : o
      ));
      if (!approved) {
        setProducts(prev => prev.filter(p => !originalOrder.items.some(i => i.id === p.id)));
      }
      throw error;
    }
  }, [isAdmin, orders]);

  return (
    <StoreContext.Provider
      value={{
        products,
        cart,
        user,
        orders,
        addToCart, // Теперь мгновенный!
        removeFromCart, // Мгновенный!
        clearCart,
        addProduct,
        removeProduct,
        placeOrder,
        cancelOrder,
        processOrder,
        isAdmin,
        loading,
        refreshOrders,
        refreshProducts
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
