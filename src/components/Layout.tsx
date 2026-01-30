import React from 'react';
import { Home, Search, ShoppingBag, User, ShieldCheck } from 'lucide-react';
import { View } from '../types';
import { useStore } from '../context/StoreContext';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setCurrentView }) => {
  const { cart, isAdmin } = useStore();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex flex-col items-center justify-center w-full py-2 transition-colors duration-200 ${
        currentView === view ? 'text-red-600' : 'text-neutral-500 hover:text-neutral-300'
      }`}
    >
      <div className="relative">
        <Icon size={24} strokeWidth={currentView === view ? 2.5 : 2} />
        {view === View.CART && cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-neutral-950">
            {cartCount}
          </span>
        )}
      </div>
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-50 overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        <div className="max-w-md mx-auto min-h-full">
            {children}
        </div>
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 bg-neutral-950/95 backdrop-blur-lg border-t border-neutral-800 z-50 pb-safe">
        <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
          <NavItem view={View.HOME} icon={Home} label="Home" />
          <NavItem view={View.SEARCH} icon={Search} label="Search" />
          <NavItem view={View.CART} icon={ShoppingBag} label="Cart" />
          <NavItem view={View.PROFILE} icon={User} label="Profile" />
          {isAdmin && <NavItem view={View.ADMIN} icon={ShieldCheck} label="Admin" />}
        </div>
      </div>
    </div>
  );
};

export default Layout;