import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Product, CartItem, User, Order, OrderStatus, ADMIN_TELEGRAM_USERNAME } from '../types';
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
  const [loading, setLoading] = useState(true);

  // Load orders function
  const loadOrders = useCallback(async (userId: number, isAdmin: boolean) => {
    try {
      let ordersData;
      if (isAdmin) {
        ordersData = await api.getAllOrders();
      } else {
        ordersData = await api.getUserOrders(userId);
      }
      
      setOrders(ordersData.map((o: any) => ({
        id: o.id.toString(),
        userId: o.username || 'unknown',
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
      await loadOrders(user.id, user.isAdmin);
    }
  }, [user, loadOrders]);

  // Initialize from Telegram WebApp and database
  useEffect(() => {
    const initializeApp = async () => {
      const tg = (window as any).Telegram?.WebApp;
      
      if (tg) {
        tg.ready();
        tg.expand();

        const tgUser = tg.initDataUnsafe?.user;
        
        if (tgUser) {
          const isAdmin = tgUser.username === ADMIN_TELEGRAM_USERNAME;
          
          try {
            // Get or create user in database
            const dbUser = await api.getOrCreateUser(
              tgUser.id,
              tgUser.username || `User_${tgUser.id}`,
              isAdmin
            );
            
            const userData: User = {
              id: dbUser.id,
              username: dbUser.username,
              balance: dbUser.balance,
              referrals: dbUser.referrals,
              referralLink: `https://t.me/ResellHubBot?start=${tgUser.id}`,
              isAdmin: dbUser.is_admin
            };
            
            setUser(userData);

            // Load products
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

            // Load orders
            await loadOrders(dbUser.id, dbUser.is_admin);

          } catch (error) {
            console.error('Failed to initialize app:', error);
            // Fallback to guest user
            setUser({
              id: 0,
              username: 'guest_user',
              balance: 0,
              referrals: 0,
              referralLink: 'https://t.me/ResellHubBot?start=guest',
              isAdmin: false
            });
          }
        } else {
          // Guest user fallback
          setUser({
            id: 0,
            username: 'guest_user',
            balance: 0,
            referrals: 0,
            referralLink: 'https://t.me/ResellHubBot?start=guest',
            isAdmin: false
          });
        }
      } else {
        // Development fallback
        console.warn('Telegram WebApp not found, using dev mode');
        setUser({
          id: 999,
          username: 'dev_user',
          balance: 0,
          referrals: 0,
          referralLink: 'https://t.me/ResellHubBot?start=dev',
          isAdmin: false
        });
      }
      
      setLoading(false);
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

  const placeOrder = useCallback(async () => {
    if (!user || cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    try {
      const dbOrder = await api.createOrder(user.id, cart, total);
      
      const newOrder: Order = {
        id: dbOrder.id.toString(),
        userId: user.username,
        username: user.username,
        items: [...cart],
        totalAmount: total,
        status: OrderStatus.PENDING,
        date: new Date(dbOrder.created_at).getTime()
      };

      setOrders(prev => [newOrder, ...prev]);
      setCart([]);
      
      // Refresh orders to get latest data
      await refreshOrders();
    } catch (error) {
      console.error('Failed to place order:', error);
      throw error;
    }
  }, [user, cart, refreshOrders]);

  const processOrder = useCallback(async (orderId: string, approved: boolean) => {
    try {
      const status = approved ? 'CONFIRMED' : 'CANCELED';
      await api.updateOrderStatus(orderId, status);
      
      setOrders(prevOrders => {
        return prevOrders.map(order => {
          if (order.id !== orderId) return order;
          
          // If approved locally, also remove from products state
          if (approved) {
            const itemIdsToRemove = order.items.map(i => i.id);
            setProducts(prevProds => prevProds.filter(p => !itemIdsToRemove.includes(p.id)));
          }

          return {
            ...order,
            status: approved ? OrderStatus.CONFIRMED : OrderStatus.CANCELED
          };
        });
      });
      
      // Refresh to ensure sync
      await refreshOrders();
    } catch (error) {
      console.error('Failed to process order:', error);
      throw error;
    }
  }, [refreshOrders]);

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
        isAdmin: user?.isAdmin || false,
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
