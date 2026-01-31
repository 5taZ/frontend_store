import React, { useEffect, useState } from 'react';
import { ShoppingCart, User, Package, Grid } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { View } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  setCurrentView: (view: View) => void;
  cartItemsCount: number;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setCurrentView, cartItemsCount }) => {
  const { isAdmin } = useStore();
  const [animateBadge, setAnimateBadge] = useState(false);

  // Анимация badge при изменении количества
  useEffect(() => {
    if (cartItemsCount > 0) {
      setAnimateBadge(true);
      const timer = setTimeout(() => setAnimateBadge(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartItemsCount]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Rubik, sans-serif' }}>
            NextGear
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 pb-safe z-50">
        <div className={`max-w-lg mx-auto grid ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} h-16 px-2`}>
          <button
            onClick={() => setCurrentView(View.ITEMS)}
            className={`flex flex-col items-center justify-center space-y-1 ${
              currentView === View.ITEMS ? 'text-red-500' : 'text-neutral-500'
            }`}
          >
            <Grid size={24} />
            <span className="text-[10px] font-medium">Items</span>
          </button>
          
          {/* Кнопка корзины с badge поверх */}
          <button
            onClick={() => setCurrentView(View.CART)}
            className={`flex flex-col items-center justify-center space-y-1 relative ${
              currentView === View.CART ? 'text-red-500' : 'text-neutral-500'
            }`}
          >
            <div className="relative">
              <ShoppingCart size={24} />
              {/* Badge "поверх" иконки */}
              {cartItemsCount > 0 && (
                <span 
                  className={`absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full transition-transform ${
                    animateBadge ? 'scale-125' : 'scale-100'
                  }`}
                >
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Cart</span>
          </button>
          
          <button
            onClick={() => setCurrentView(View.PROFILE)}
            className={`flex flex-col items-center justify-center space-y-1 ${
              currentView === View.PROFILE ? 'text-red-500' : 'text-neutral-500'
            }`}
          >
            <User size={24} />
            <span className="text-[10px] font-medium">Profile</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setCurrentView(View.ADMIN)}
              className={`flex flex-col items-center justify-center space-y-1 ${
                currentView === View.ADMIN ? 'text-red-500' : 'text-neutral-500'
              }`}
            >
              <Package size={24} />
              <span className="text-[10px] font-medium">Admin</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
