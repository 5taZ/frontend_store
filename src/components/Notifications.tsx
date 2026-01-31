import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, XCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const Notifications: React.FC = () => {
  const { notifications } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  // Считаем непрочитанные уведомления
  const unreadCount = notifications.filter(n => !n.read).length;

  // Автоматически открываем меню при появлении новых уведомлений
  useEffect(() => {
    if (unreadCount > 0 && !isOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        // Автоматически закрываем через 5 секунд
        setTimeout(() => setIsOpen(false), 5000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount, isOpen]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_confirmed':
        return <CheckCircle size={20} className="text-emerald-500" />;
      case 'order_canceled':
        return <XCircle size={20} className="text-rose-500" />;
      default:
        return <Bell size={20} className="text-neutral-500" />;
    }
  };

  return (
    <div className="fixed top-2 right-2 z-50">
      {/* Кнопка колокольчика */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-neutral-900 rounded-full hover:bg-neutral-800 transition-colors border border-neutral-800 shadow-lg"
      >
        <Bell size={20} className="text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Выпадающее меню уведомлений */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl max-h-[60vh] overflow-y-auto"
        >
          <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
            <h3 className="font-bold text-white">Уведомления</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              Нет уведомлений
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 ${notification.read ? 'opacity-70' : 'bg-neutral-800/30'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-bold text-white">{notification.title}</h4>
                        <span className="text-xs text-neutral-500">
                          {new Date(notification.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-300 mt-1">
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
