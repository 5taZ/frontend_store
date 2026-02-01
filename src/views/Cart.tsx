import React from 'react';
import { Trash2, ShoppingBag, ArrowRight, Package, Shield, Minus, Plus } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { View } from '../types';

const Cart: React.FC = () => {
  const { cart, removeFromCart, placeOrder, setCurrentView, updateCartItemQuantity } = useStore();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    try {
      await placeOrder();
      setCurrentView(View.PROFILE);
    } catch (error) {
      console.error('Order failed:', error);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full" />
          <div className="relative bg-neutral-900/80 backdrop-blur-sm p-8 rounded-full border border-neutral-800 shadow-2xl">
            <ShoppingBag size={56} className="text-neutral-400" strokeWidth={1.5} />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">Ваша корзина пуста</h2>
        <p className="text-neutral-400 max-w-xs mx-auto leading-relaxed mb-8">
          Видимо вы ничего не выбрали
        </p>
        
        <button 
          onClick={() => setCurrentView(View.ITEMS)}
          className="group flex items-center gap-2 bg-neutral-900 hover:bg-red-600 text-white px-6 py-3 rounded-xl border border-neutral-800 hover:border-red-600 transition-all duration-300 font-medium"
        >
          <span>Вернуться к покупкам</span>
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 pt-6 h-full flex flex-col max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-800/50">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Корзина</h1>
          <p className="text-sm text-neutral-400">{totalItems} {totalItems === 1 ? 'товар' : totalItems < 5 ? 'товара' : 'товаров'} в корзине</p>
        </div>
        <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center border border-neutral-800">
          <ShoppingBag className="text-red-500" size={24} />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-4">
        {cart.map((item) => (
          <div 
            key={item.id} 
            className="group bg-neutral-900/50 backdrop-blur-sm p-4 rounded-2xl flex items-center gap-4 border border-neutral-800 hover:border-neutral-700 transition-all duration-300"
          >
            <div className="relative">
              {item.image ? (
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-20 h-20 rounded-xl object-cover bg-neutral-800" 
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-600 text-xs border border-neutral-700/50">
                  <Package size={20} />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white line-clamp-1 mb-1 group-hover:text-red-500 transition-colors">
                {item.name}
              </h3>
              <p className="text-xs text-neutral-500 mb-2">{item.price} BYN за шт.</p>
              
              {/* Управление количеством */}
              <div className="flex items-center gap-2 bg-neutral-950 rounded-xl px-2 py-1.5 w-fit border border-neutral-800">
                <button 
                  onClick={() => {
                    // ✅ Изменено: при quantity = 1 ничего не делаем (не удаляем)
                    // Удаление только через кнопку мусорки
                    if (item.quantity > 1) {
                      updateCartItemQuantity(item.id, item.quantity - 1);
                    }
                  }}
                  className={`p-1 rounded-lg transition-all active:scale-95 ${
                    item.quantity <= 1 
                      ? 'text-neutral-600 cursor-default' // Визуально неактивна, но нажимается
                      : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Minus size={14} strokeWidth={3} />
                </button>
                <span className="text-sm font-bold text-white w-6 text-center">{item.quantity}</span>
                <button 
                  onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                  className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-all active:scale-95"
                >
                  <Plus size={14} strokeWidth={3} />
                </button>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-3">
              <div className="text-white font-bold text-lg">
                {(item.price * item.quantity).toFixed(2)} BYN
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all active:scale-95"
                title="Удалить из корзины"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-gradient-to-br from-neutral-900 to-neutral-900/50 p-6 rounded-3xl border border-neutral-800 shadow-2xl shadow-black/20">
        <div className="space-y-3 mb-6 pb-6 border-b border-neutral-800/50">
          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-400">Товары ({totalItems})</span>
            <span className="text-neutral-300">{total.toFixed(2)} BYN</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-400">Доставка</span>
            <span className="text-emerald-500 font-medium">Бесплатно</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-neutral-300 font-medium">Итого к оплате</span>
            <span className="text-3xl font-bold text-white">{total.toFixed(2)} BYN</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          className="group w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:from-red-500 hover:to-red-600 transition-all duration-300 shadow-lg shadow-red-600/25 hover:shadow-red-500/30"
        >
          <span className="text-base">Оформить заказ</span>
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-neutral-500">
          <Shield size={12} />
          <span>Товары будут зарезервированы сразу после оформления</span>
        </div>
      </div>
    </div>
  );
};

export default Cart;
