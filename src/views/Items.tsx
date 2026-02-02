import React, { useState } from 'react';
import { Search, Package, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { View } from '../types';
import ProductCard from '../components/ProductCard';

const Items: React.FC = () => {
  const { products, addToCart, cart, setCurrentView } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isEmptyCatalog = products.length === 0;
  const isEmptySearch = products.length > 0 && filteredProducts.length === 0 && searchQuery.trim() !== '';

  return (
    <div className="p-4 space-y-6 pb-24 max-w-lg mx-auto">
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">NextGear</h2>
          <p className="text-sm text-neutral-400">Найдите лучшее оборудование для ваших задач</p>
        </div>

        <div className="relative group">
          <Search 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-red-500 transition-colors" 
            size={20} 
          />
          <input
            type="text"
            placeholder="Поиск..."
            className="w-full bg-neutral-900/80 border border-neutral-800 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-neutral-500 focus:outline-none focus:border-red-600 focus:bg-neutral-900 focus:shadow-lg focus:shadow-red-600/10 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-800 rounded-full transition-colors"
            >
              <span className="text-neutral-500 text-xs px-2">×</span>
            </button>
          )}
        </div>
      </div>

      {isEmptyCatalog ? (
        // ✅ Пустой каталог - центрированная кнопка + улучшенный текст
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-neutral-900/50 rounded-3xl border border-neutral-800/50">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full" />
            <div className="relative w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800">
              <Package size={48} className="text-neutral-500" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-3">В данный момент товаров нет</h3>
          <p className="text-neutral-400 max-w-xs mx-auto mb-6">
            Не нашли нужное? Закажите товар в профиле — добавим в ассортимент!
          </p>
          
          {/* ✅ Центрированная кнопка */}
          <button 
            onClick={() => setCurrentView(View.PROFILE)}
            className="group inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 hover:shadow-red-500/30 active:scale-95"
          >
            <span>Перейти в профиль</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      ) : isEmptySearch ? (
        // ✅ Поиск не дал результатов - центрированная кнопка + улучшенный текст
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-neutral-900/50 rounded-3xl border border-neutral-800/50">
          <div className="w-20 h-20 bg-neutral-800/80 rounded-full flex items-center justify-center mb-4">
            <Package size={40} className="text-neutral-500" />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">Ничего не найдено</h3>
          <p className="text-neutral-400 mb-2 max-w-xs mx-auto">
            Попробуйте изменить запрос поиска
          </p>
          
          {/* ✅ Улучшенный клиентоориентированный текст */}
          <p className="text-sm text-neutral-500 mb-6 max-w-xs mx-auto leading-relaxed">
            Не нашли нужное? <span className="text-red-500 font-medium">Закажите товар в профиле — мы добавим его специально для вас!</span>
          </p>
          
          {/* ✅ Центрированная кнопка */}
          <button 
            onClick={() => setCurrentView(View.PROFILE)}
            className="group inline-flex items-center justify-center gap-2 bg-neutral-800 hover:bg-red-600 text-white px-6 py-3 rounded-xl border border-neutral-700 hover:border-red-600 transition-all font-medium"
          >
            <span>Перейти в профиль</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={addToCart}
              isInCart={cart.some(item => item.id === product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Items;
