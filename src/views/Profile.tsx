import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Package, 
  Ban, 
  ShoppingBag, 
  Calendar,
  ArrowRight,
  Shield,
  Plus,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OrderStatus, View } from '../types';
import ProductRequestForm from '../components/ProductRequestForm';

const Profile: React.FC = () => {
  const { user, orders, productRequests, cancelOrder, setCurrentView, refreshProductRequests } = useStore();
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [showRequests, setShowRequests] = useState(false);

  if (!user) return null;

  const userOrders = orders
    .filter(order => order.userId === user.id)
    .sort((a, b) => b.date - a.date);

  const userRequests = productRequests
    .filter(req => req.userId === user.id)
    .sort((a, b) => b.createdAt - a.createdAt);

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CONFIRMED:
        return {
          icon: <CheckCircle2 size={18} />,
          badgeClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          label: 'Подтвержден',
          bgClass: 'bg-emerald-950/20'
        };
      case OrderStatus.CANCELED:
        return {
          icon: <XCircle size={18} />,
          badgeClass: 'bg-red-500/10 border-red-500/20 text-red-400',
          label: 'Отменен',
          bgClass: 'bg-red-950/20'
        };
      default: 
        return {
          icon: <Clock size={18} />,
          badgeClass: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          label: 'В обработке',
          bgClass: 'bg-amber-950/20'
        };
    }
  };

  const getRequestStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          icon: <CheckCircle2 size={14} />,
          badgeClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          label: 'Добавлен в каталог'
        };
      case 'rejected':
        return {
          icon: <XCircle size={14} />,
          badgeClass: 'bg-red-500/10 border-red-500/20 text-red-400',
          label: 'Отклонено'
        };
      default:
        return {
          icon: <Clock size={14} />,
          badgeClass: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          label: 'Рассматривается'
        };
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24 max-w-lg mx-auto">
      {/* Header Profile Card */}
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/50 rounded-3xl p-6 border border-neutral-800 shadow-xl shadow-black/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <div className="relative flex items-center gap-4">
          <div className="relative">
            {user.photoUrl ? (
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-red-600/30 shadow-lg shadow-red-600/20">
                <img 
                  src={user.photoUrl} 
                  alt={user.username}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.classList.add('bg-gradient-to-br', 'from-red-600', 'to-red-700', 'flex', 'items-center', 'justify-center');
                      parent.innerHTML = `<span class="text-3xl font-bold text-white">${user.username.charAt(0).toUpperCase()}</span>`;
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-red-600/20">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            
            {user.isAdmin && (
              <div className="absolute -bottom-1 -right-1 bg-neutral-950 rounded-full p-1 border border-neutral-800">
                <Shield size={16} className="text-red-500 fill-red-500" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">@{user.username}</h2>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                user.isAdmin 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                  : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
              }`}>
                {user.isAdmin ? 'Администратор' : 'Покупатель'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative mt-6 pt-6 border-t border-neutral-800 grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-neutral-950/50 rounded-2xl border border-neutral-800/50">
            <div className="text-2xl font-bold text-white mb-1">{userOrders.length}</div>
            <div className="text-xs text-neutral-500 flex items-center justify-center gap-1">
              <Package size={12} />
              Заказов
            </div>
          </div>
          <div className="text-center p-3 bg-neutral-950/50 rounded-2xl border border-neutral-800/50">
            <div className="text-2xl font-bold text-white mb-1">
              {userOrders.reduce((sum, order) => 
                order.status !== OrderStatus.CANCELED ? sum + order.totalAmount : sum, 0
              ).toFixed(0)}
            </div>
            <div className="text-xs text-neutral-500 flex items-center justify-center gap-1">
              <span className="text-red-500">BYN</span>
              Потрачено
            </div>
          </div>
        </div>

        {/* ✅ Улучшенная кнопка запроса товара - без лупы, стрелка справа */}
        <button
          onClick={() => setIsRequestFormOpen(true)}
          className="w-full mt-4 flex items-center justify-between p-4 bg-gradient-to-r from-neutral-800 to-neutral-800/50 hover:from-neutral-700 hover:to-neutral-700/50 border border-neutral-700 rounded-2xl transition-all active:scale-[0.98] group"
        >
          <div className="flex flex-col items-start">
            <span className="text-white font-bold">Нет нужного товара?</span>
            <span className="text-sm text-neutral-400">Запросите добавление в каталог</span>
          </div>
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20 group-hover:scale-110 transition-transform">
            <Plus size={20} className="text-white" />
          </div>
        </button>
      </div>

      {/* Секция запросов товаров */}
      {userRequests.length > 0 && (
        <div className="space-y-3">
          <button 
            onClick={() => setShowRequests(!showRequests)}
            className="w-full flex items-center justify-between p-4 bg-neutral-900/50 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center">
                <Package size={20} className="text-red-500" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-white">Мои запросы</h3>
                <p className="text-xs text-neutral-400">{userRequests.length} {userRequests.length === 1 ? 'запрос' : userRequests.length < 5 ? 'запроса' : 'запросов'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {userRequests.some(r => r.status === 'pending') && (
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              )}
              <ChevronRight size={20} className={`text-neutral-500 transition-transform ${showRequests ? 'rotate-90' : ''}`} />
            </div>
          </button>

          {showRequests && (
            <div className="space-y-3 pl-2">
              {userRequests.map((request) => {
                const statusConfig = getRequestStatusConfig(request.status);
                return (
                  <div key={request.id} className="bg-neutral-900/30 p-4 rounded-xl border border-neutral-800/50 flex items-center gap-3">
                    {request.image ? (
                      <img src={request.image} alt="" className="w-12 h-12 rounded-lg object-cover bg-neutral-800" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center">
                        <Package size={20} className="text-neutral-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{request.productName}</p>
                      <p className="text-xs text-neutral-500">Кол-во: {request.quantity} шт.</p>
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border mt-1 ${statusConfig.badgeClass}`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag size={24} className="text-red-500" />
            История заказов
          </h3>
          {userOrders.length > 0 && (
            <span className="text-xs text-neutral-500 bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800">
              {userOrders.length} {userOrders.length === 1 ? 'заказ' : userOrders.length < 5 ? 'заказа' : 'заказов'}
            </span>
          )}
        </div>
        
        {userOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-neutral-900/50 rounded-3xl border border-neutral-800/50">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-red-600/20 blur-2xl rounded-full" />
              <div className="relative w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800">
                <Package size={32} className="text-neutral-500" />
              </div>
            </div>
            
            <h4 className="text-xl font-bold text-white mb-2">Еще нет заказов</h4>
            <p className="text-neutral-400 max-w-xs mx-auto mb-6">
              Начните покупать товары, чтобы увидеть историю здесь
            </p>
            
            <button 
              onClick={() => setCurrentView(View.ITEMS)}
              className="group inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-red-600/20 hover:shadow-red-500/30 active:scale-95"
            >
              <span>Перейти к покупкам</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {userOrders.map((order, index) => {
              const statusConfig = getStatusConfig(order.status);
              const orderNumber = String(order.id).slice(-4).padStart(4, '0');
              
              return (
                <div 
                  key={order.id} 
                  className={`group bg-neutral-900/50 backdrop-blur-sm rounded-2xl border border-neutral-800 overflow-hidden hover:border-neutral-700 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 ${statusConfig.bgClass}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-4 border-b border-neutral-800/50 flex items-center justify-between bg-neutral-900/30">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center font-mono font-bold text-xs text-neutral-400 border border-neutral-700 shrink-0">
                        #{orderNumber}
                      </div>
                      <div>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.badgeClass}`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 shrink-0">
                      <Calendar size={12} />
                      {new Date(order.date).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 group/item">
                        {item.image ? (
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-800 border border-neutral-700/50 flex-shrink-0">
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300" 
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-neutral-800 flex items-center justify-center border border-neutral-700/50 flex-shrink-0">
                            <Package size={20} className="text-neutral-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate group-hover/item:text-red-500 transition-colors">
                            {item.name}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {item.quantity} шт. × {item.price} BYN
                          </p>
                        </div>
                        <div className="text-sm font-bold text-white shrink-0">
                          {(item.price * item.quantity).toFixed(2)} BYN
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-neutral-950/30 border-t border-neutral-800/50 flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-neutral-500">Итого:</span>
                      <span className="text-xl font-bold text-white">
                        {order.totalAmount} BYN
                      </span>
                    </div>
                    
                    {order.status === OrderStatus.PENDING && (
                      <button
                        onClick={() => cancelOrder(order.id)}
                        className="group/btn flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-red-600/20 hover:border-red-600/50 border border-neutral-700 rounded-xl text-sm text-neutral-400 hover:text-red-500 transition-all duration-300 shrink-0"
                      >
                        <Ban size={14} />
                        <span className="font-medium">Отменить</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ProductRequestForm 
        isOpen={isRequestFormOpen}
        onClose={() => {
          setIsRequestFormOpen(false);
          refreshProductRequests();
        }}
      />
    </div>
  );
};

export default Profile;
