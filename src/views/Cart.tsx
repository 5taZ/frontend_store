import React from 'react';
import { Trash2, ShoppingBag, ArrowRight, CheckCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const Cart: React.FC = () => {
  const { cart, removeFromCart, clearCart, placeOrder } = useStore();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Place internal order
    placeOrder();

    // Show native Telegram popup or alert
    const tg = (window as any).Telegram?.WebApp;
    
    // showPopup requires Web App version 6.2+
    if (tg && tg.isVersionAtLeast && tg.isVersionAtLeast('6.2')) {
        tg.showPopup({ 
            title: 'Order Placed', 
            message: 'Your order has been sent to the admin for processing. Wait for confirmation.' 
        });
    } else {
        // Fallback for older Telegram clients or web browsers
        alert("Order placed successfully! Waiting for admin confirmation.");
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-4 text-center">
        <div className="bg-neutral-900 p-6 rounded-full mb-4 border border-neutral-800">
            <ShoppingBag size={48} className="text-neutral-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Your Cart is Empty</h2>
        <p className="text-neutral-400">Looks like you haven't added any gear yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4 pt-6 h-full flex flex-col">
      <h1 className="text-2xl font-bold text-white mb-6">Shopping Cart</h1>
      
      <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-4">
        {cart.map((item) => (
          <div key={item.id} className="bg-neutral-900 p-4 rounded-xl flex items-center space-x-4 border border-neutral-800">
            <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-white" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white">{item.name}</h3>
              <p className="text-xs text-neutral-400 mt-1">Quantity: {item.quantity}</p>
              <div className="text-white font-bold mt-1">{item.price.toLocaleString('ru-RU')} ₽</div>
            </div>
            <button
              onClick={() => removeFromCart(item.id)}
              className="p-2 text-neutral-500 hover:text-red-500 transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
        <div className="flex justify-between items-center mb-6">
          <span className="text-neutral-400">Total Amount</span>
          <span className="text-2xl font-bold text-white">{total.toLocaleString('ru-RU')} ₽</span>
        </div>
        <button
          onClick={handleCheckout}
          className="w-full bg-red-600 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
        >
          <span>Confirm Purchase</span>
          <ArrowRight size={20} />
        </button>
        <p className="text-[10px] text-center text-neutral-500 mt-3">
            Clicking confirm will send your order to the admin. Items will be reserved upon approval.
        </p>
      </div>
    </div>
  );
};

export default Cart;