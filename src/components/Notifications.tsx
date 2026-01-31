import React, { useState } from 'react';
import { Bell, X, CheckCircle, XCircle, Package } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Notification } from '../types';

const Notifications: React.FC = () => {
  const { notifications, markNotificationAsRead } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order_confirmed':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'order_rejected':
        return <XCircle size={20} className="text-red-500" />;
      case 'product_requested':
        return <Package size={20} className="text-blue-500" />;
      default:
        return <Bell size={20} className="text-neutral-500" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Кнопка колокольчика */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-neutral-900 rounded-full hover:bg-neutral-800 transition-colors border border-neutral-800"
      >
        <Bell size={24} className="text-white" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Выпадающее меню уведомлений */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl max-h-[60vh] overflow-y-auto">
          <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
            <h3 className="font-bold text-white">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-neutral-800/50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-neutral-800/30' : ''
                  }`}
                  onClick={() => {
                    markNotificationAsRead(notification.id);
                    // Можно добавить переход к заказу или другое действие
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-bold text-white">{notification.title}</h4>
                        <span className="text-xs text-neutral-500">
                          {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-400 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
