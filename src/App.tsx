import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import Layout from './components/Layout';
import Home from './views/Home';
import Search from './views/Search';
import Cart from './views/Cart';
import Profile from './views/Profile';
import Admin from './views/Admin';
import { View } from './types';

const AppContent: React.FC = () => {
  const { user } = useStore();
  const [currentView, setCurrentView] = useState<View>(View.HOME);

  // Simple loading state while verifying Telegram User
  if (!user) {
      return (
        <div className="flex items-center justify-center h-screen bg-neutral-950 text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="font-bold text-xl tracking-wider">NEXT GEAR</div>
            </div>
        </div>
      );
  }

  const renderView = () => {
    switch (currentView) {
      case View.HOME:
        return <Home />;
      case View.SEARCH:
        return <Search />;
      case View.CART:
        return <Cart />;
      case View.PROFILE:
        return <Profile />;
      case View.ADMIN:
        return <Admin />;
      default:
        return <Home />;
    }
  };

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView}>
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