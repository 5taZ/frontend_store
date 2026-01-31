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

  // Возвращаем иконку и стили для каждого статуса (БОЛЕЕ МЯГКИЕ ЦВЕТА)
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CONFIRMED:
        return {
          icon: <CheckCircle size={16} className="text-emerald-400" />,
          badgeClass: 'bg-emerald-400/5 border-emerald-400/10',
          label: 'Подтвержден',
          color: 'text-emerald-400'
        };
      case OrderStatus.CANCELED:
        return {
          icon: <XCircle size={16} className="text-rose-400" />,
          badgeClass: 'bg-rose-400/5 border-rose-400/10',
          label: 'Отменен',
          color: 'text-rose-400'
        };
      default: // PENDING
        return {
          icon: <Clock size={16} className="text-amber-400" />,
          badgeClass: 'bg-amber-400/5 border-amber-400/10',
          label: 'В обработке',
          color: 'text-amber-400'
        };
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-2xl font-bold">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold">@{user.username}</h2>
          <span className={`text-xs px-2 py-1 rounded ${user.isAdmin ? 'bg-red-600' : 'bg-neutral-800'}`}>
            {user.isAdmin ? 'Admin' : 'Покупатель'}
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Package size={20} className="text-neutral-400" />
          История заказов
        </h3>
        
        {userOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-neutral-600" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Еще нет заказов</h4>
            <p className="text-neutral-500">
              Начните покупать товары, чтобы увидеть историю здесь
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {userOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              
              return (
                <div 
                  key={order.id} 
                  className={`rounded-xl p-4 border ${statusConfig.badgeClass} 
                    hover:shadow-md transition-shadow duration-300
                    ${order.status === OrderStatus.CANCELED ? 'bg-rose-900/10' : ''}
                    ${order.status === OrderStatus.CONFIRMED ? 'bg-emerald-900/10' : ''}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                    <div className="flex items-center gap-3 mb-2 md:mb-0">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-sm">
                        #{order.id.slice(-4)}
                      </div>
                      <div className="flex items-center gap-2">
                        {statusConfig.icon}
                        <span className={`text-sm font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {new Date(order.date).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-white truncate max-w-[150px]">
                              {item.name}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {item.quantity} шт. × {item.price} BYN
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-white">
                          {(item.price * item.quantity).toFixed(2)} BYN
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-4 pt-3 border-t border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500">Итого:</span>
                      <span className="text-lg font-bold text-white">
                        {order.totalAmount} BYN
                      </span>
                    </div>
                    
                    {order.status === OrderStatus.PENDING && (
                      <button
                        onClick={() => cancelOrder(order.id)}
                        className="mt-3 md:mt-0 flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm text-neutral-300 transition-colors"
                      >
                        <Ban size={16} className="text-neutral-500" />
                        Отменить заказ
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
