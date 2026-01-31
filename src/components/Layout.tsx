import React from 'react';
import { ShoppingCart, User, Package, Grid } from 'lucide-react';
import { View } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  setCurrentView: (view: View) => void;
  cartItemsCount: number;
  isAdmin: boolean; // Явно получаем isAdmin!
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setCurrentView, cartItemsCount, isAdmin }) => {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Rubik, sans-serif' }}>
            NextGear
          </h1>
          {cartItemsCount > 0 && (
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {cartItemsCount}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-20">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800">
        <div className={`max-w-lg mx-auto grid ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} h-16`}>
          <button
            onClick={() => setCurrentView(View.ITEMS)}
            className={`flex flex-col items-center justify-center space-y-1 ${
              currentView === View.ITEMS ? 'text-red-500' : 'text-neutral-500'
            }`}
          >
            <Grid size={24} />
            <span className="text-[10px] font-medium">Items</span>
          </button>
          
          <button
            onClick={() => setCurrentView(View.CART)}
            className={`flex flex-col items-center justify-center space-y-1 ${
              currentView === View.CART ? 'text-red-500' : 'text-neutral-500'
            }`}
          >
            <ShoppingCart size={24} />
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
          
          {/* КНОПКА ADMIN ТОЛЬКО ДЛЯ АДМИНА! */}
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
