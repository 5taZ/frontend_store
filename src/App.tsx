import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import Layout from './components/Layout';
import Items from './views/Items';
import Cart from './views/Cart';
import Profile from './views/Profile';
import Admin from './views/Admin';
import { View } from './types';

const AppContent: React.FC = () => {
  const { user, cart } = useStore();
  const [currentView, setCurrentView] = useState<View>(View.ITEMS);

  if (!user) {
      return (
        <div className="flex items-center justify-center h-screen bg-neutral-950 text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="font-bold text-xl" style={{ fontFamily: 'Rubik, sans-serif' }}>NextGear</div>
            </div>
        </div>
      );
  }

  const renderView = () => {
    if (currentView === View.ADMIN && !user.isAdmin) {
      return <Items />;
    }
    
    switch (currentView) {
      case View.ITEMS:
        return <Items />;
      case View.CART:
        return <Cart />;
      case View.PROFILE:
        return <Profile />;
      case View.ADMIN:
        return user.isAdmin ? <Admin /> : <Items />;
      default:
        return <Items />;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      setCurrentView={setCurrentView}
      cartItemsCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
    >
      {renderView()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;
