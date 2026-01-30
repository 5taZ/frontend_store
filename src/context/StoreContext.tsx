import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Product, CartItem, User, Order, OrderStatus } from '../types';
import { api } from '../api';

interface StoreContextType {
  products: Product[];
  cart: CartItem[];
  user: User | null;
  orders: Order[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  addProduct: (product: Product) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
  placeOrder: () => Promise<void>;
  processOrder: (orderId: string, approved: boolean) => Promise<void>;
  isAdmin: boolean;
  loading: boolean;
  refreshOrders: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

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
        userId: o.user_id, // Важно: number из БД
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

  const refreshOrders = useCallback(async () => {
    if (user) {
      await loadOrders(user.id, isAdmin);
    }
  }, [user, isAdmin, loadOrders]);

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
            console.log('Telegram user detected:', tgUser.username);
            
            try {
              const dbUser = await api.getOrCreateUser(
                tgUser.id,
                tgUser.username || `User_${tgUser.id}`
              );
              
              const userIsAdmin = dbUser.is_admin || false;
              setIsAdmin(userIsAdmin);
              
              // Упрощенный объект User без balance/referrals
              const userData: User = {
                id: dbUser.id,
                username: dbUser.username,
                isAdmin: userIsAdmin
              };
              
              setUser(userData);

              const productsData = await api.getProducts();
              setProducts(productsData.map((p: any) => ({
                id: p.id.toString(),
                name: p.name,
                price: p.price,
                image: p.image,
                description: p.description,
                category: p.category,
                inStock: p.in_stock
              })));

              await loadOrders(dbUser.id, userIsAdmin);

            } catch (error) {
              console.error('Backend connection failed:', error);
              setUser({
                id: tgUser.id,
                username: tgUser.username || 'unknown',
                isAdmin: false
              });
            }
          } else {
            console.warn('No Telegram user data');
            setUser({
              id: 0,
              username: 'guest',
              isAdmin: false
            });
          }
        } else {
          // Режим разработки
          console.log('Development mode - no Telegram WebApp');
          setUser({
            id: 999,
            username: 'dev_user',
            isAdmin: true
          });
          setIsAdmin(true);
          
          const productsData = await api.getProducts().catch(() => []);
          setProducts(productsData);
        }
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [loadOrders]);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const addProduct = useCallback(async (product: Product) => {
    try {
      const dbProduct = await api.addProduct({
        name: product.name,
        price: product.price,
        image: product.image,
        description: product.description,
        category: product.category,
        in_stock: product.inStock
      });
      
      setProducts((prev) => [{
        id: dbProduct.id.toString(),
        name: dbProduct.name,
        price: dbProduct.price,
        image: dbProduct.image,
        description: dbProduct.description,
        category: dbProduct.category,
        inStock: dbProduct.in_stock
      }, ...prev]);
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  }, []);

  const removeProduct = useCallback(async (productId: string) => {
    try {
      await api.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (error) {
      console.error('Failed to remove product:', error);
      throw error;
    }
  }, []);

  // ОСНОВНОЕ ИЗМЕНЕНИЕ: Сразу резервируем товары при заказе
  const placeOrder = useCallback(async () => {
    if (!user || cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    try {
      const dbOrder = await api.createOrder(user.id, cart, total);
      
      const newOrder: Order = {
        id: dbOrder.id.toString(),
        userId: dbOrder.user_id, // number из БД
        username: user.username,
        items: [...cart],
        totalAmount: total,
        status: OrderStatus.PENDING,
        date: new Date(dbOrder.created_at).getTime()
      };

      // СРАЗУ УДАЛЯЕМ ТОВАРЫ ИЗ АССОРТИМЕНТА (резервирование)
      const purchasedIds = cart.map(item => item.id);
      setProducts(prev => prev.filter(p => !purchasedIds.includes(p.id)));

      setOrders(prev => [newOrder, ...prev]);
      setCart([]);
      
    } catch (error) {
      console.error('Failed to place order:', error);
      throw error;
    }
  }, [user, cart]);

  // ОСНОВНОЕ ИЗМЕНЕНИЕ: Логика возврата при отмене
  const processOrder = useCallback(async (orderId: string, approved: boolean) => {
    if (!isAdmin) {
      throw new Error('Only admin can process orders');
    }
    
    try {
      const status = approved ? 'CONFIRMED' : 'CANCELED';
      await api.updateOrderStatus(orderId, status);
      
      // Находим заказ в локальном состоянии
      const orderToProcess = orders.find(o => o.id === orderId);
      
      if (!approved && orderToProcess) {
        // ОТМЕНА: Возвращаем товары в ассортимент
        // Проверяем, нет ли уже таких товаров (чтобы не дублировать)
        setProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const itemsToReturn = orderToProcess.items.filter(item => !existingIds.has(item.id));
          return [...itemsToReturn, ...prev];
        });
        console.log('✅ Order canceled: items returned to store');
      }
      
      // Если approved - товары остаются удаленными (уже куплены)
      if (approved) {
        console.log('✅ Order confirmed: items stay removed');
      }

      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: approved ? OrderStatus.CONFIRMED : OrderStatus.CANCELED } 
            : order
        )
      );
      
    } catch (error) {
      console.error('Failed to process order:', error);
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
        addToCart,
        removeFromCart,
        clearCart,
        addProduct,
        removeProduct,
        placeOrder,
        processOrder,
        isAdmin,
        loading,
        refreshOrders
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
