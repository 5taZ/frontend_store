import React from 'react';
import { Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OrderStatus } from '../types';

const Profile: React.FC = () => {
  const { user, orders } = useStore();

  if (!user) return null;

  // Исправлен фильтр - используем user.id (number) вместо username
  const userOrders = orders
    .filter(order => order.userId === user.id)
    .sort((a, b) => b.date - a.date);

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CONFIRMED: 
        return { 
            className: 'text-green-500 bg-green-500/10 border-green-500/20',
            icon: <CheckCircle size={12} strokeWidth={3} /> 
        };
      case OrderStatus.CANCELED: 
        return { 
            className: 'text-red-500 bg-red-500/10 border-red-500/20',
            icon: <XCircle size={12} strokeWidth={3} /> 
        };
      default: 
        return { 
            className: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
            icon: <Clock size={12} strokeWidth={3} /> 
        };
    }
  };

  return (
    <div className="p-4 pt-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">@{user.username}</h2>
          <div className="flex items-center space-x-2 mt-1">
             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${user.isAdmin ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-300'}`}>
                {user.isAdmin ? 'Admin' : 'Member'}
             </span>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Package size={20} className="text-red-600" />
            Order History
        </h3>
        
        {userOrders.length === 0 ? (
            <div className="bg-neutral-900 rounded-xl p-8 border border-neutral-800 text-center">
                <p className="text-neutral-500 text-sm">No orders yet.</p>
            </div>
        ) : (
            <div className="space-y-4">
                {userOrders.map((order) => {
                    const statusStyle = getStatusStyle(order.status);
                    return (
                        <div key={order.id} className="bg-neutral-900 rounded-xl border border-neutral-800 p-4 overflow-hidden">
                            <div className="flex justify-between items-start mb-3 border-b border-neutral-800 pb-3">
                                <div>
                                    <span className="text-xs text-neutral-500">#{order.id.slice(-6)}</span>
                                    <p className="text-[10px] text-neutral-400 mt-0.5">
                                        {new Date(order.date).toLocaleDateString()} • {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wide ${statusStyle.className}`}>
                                    {statusStyle.icon}
                                    <span>{order.status}</span>
                                </div>
                            </div>

                            <div className="space-y-2 mb-3">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-neutral-200 line-clamp-1 flex-1 pr-4">
                                            {item.name} <span className="text-neutral-500">x{item.quantity}</span>
                                        </span>
                                        <span className="text-neutral-400">{(item.price * item.quantity).toLocaleString()} BYN</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
                                <span className="text-xs text-neutral-500">Total Amount</span>
                                <span className="text-white font-bold">{order.totalAmount.toLocaleString()} BYN</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* Info footer */}
      <div className="text-center text-neutral-600 text-xs mt-8">
        <p>Authenticated via Telegram</p>
        <p className="mt-1 opacity-50">Next Gear v1.0.5</p>
      </div>
    </div>
  );
};

export default Profile;
