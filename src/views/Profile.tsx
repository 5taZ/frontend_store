import React from 'react';
import { Clock, CheckCircle, XCircle, Package, Ban } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OrderStatus } from '../types';

const Profile: React.FC = () => {
  const { user, orders, cancelOrder } = useStore();

  if (!user) return null;

  const userOrders = orders
    .filter(order => order.userId === user.id)
    .sort((a, b) => b.date - a.date);

  // Возвращаем иконку и стили для каждого статуса
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CONFIRMED:
        return {
          icon: <CheckCircle size={16} className="text-green-500" />,
          badgeClass: 'bg-green-900/30 text-green-500 border-green-500/30',
          label: 'Подтверждено',
          color: 'text-green-500'
        };
      case OrderStatus.CANCELED:
        return {
          icon: <XCircle size={16} className="text-red-500" />,
          badgeClass: 'bg-red-900/30 text-red-500 border-red-500/30',
          label: 'Отклонено',
          color: 'text-red-500'
        };
      default: // PENDING
        return {
          icon: <Clock size={16} className="text-yellow-500" />,
          badgeClass: 'bg-yellow-900/30 text-yellow-500 border-yellow-500/30',
          label: 'Ожидание',
          color: 'text-yellow-500'
        };
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-2xl font-bold">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold">@{user.username}</h2>
          <span className={`text-xs px-2 py-1 rounded ${user.isAdmin ? 'bg-red-600' : 'bg-neutral-800'}`}>
            {user.isAdmin ? 'Admin' : 'Member'}
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Package size={20} className="text-red-600" />
          Order History
        </h3>
        
        <div className="space-y-4">
          {userOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            
            return (
              <div 
                key={order.id} 
                className={`rounded-xl p-4 border ${statusConfig.badgeClass}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs text-neutral-500">#{order.id.slice(-6)}</span>
                    <div className="flex items-center gap-2 mt-1">
                      {statusConfig.icon}
                      <span className={`text-sm font-bold ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-400">
                    {new Date(order.date).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-neutral-300">{item.name} x{item.quantity}</span>
                      <span className="text-neutral-400">{item.price * item.quantity} BYN</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-neutral-800">
                  <span className="font-bold">{order.totalAmount} BYN</span>
                  
                  {/* Кнопка отмены для заказов в ожидании */}
                  {order.status === OrderStatus.PENDING && (
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="flex items-center gap-1 text-red-500 text-sm hover:text-red-400 transition-colors"
                    >
                      <Ban size={14} />
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {userOrders.length === 0 && <p className="text-neutral-500 text-center">No orders yet</p>}
        </div>
      </div>
    </div>
  );
};

export default Profile;
