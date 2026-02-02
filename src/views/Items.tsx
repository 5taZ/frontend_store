import React, { useState } from 'react';
import { Search, Package } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

const Items: React.FC = () => {
  const { products, addToCart, cart } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Каталог товаров</h2>
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

      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-neutral-900/50 rounded-3xl border border-neutral-800/50 space-y-4">
          <div className="w-20 h-20 bg-neutral-800/80 rounded-full flex items-center justify-center mb-2">
            <Package size={40} className="text-neutral-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Ничего не найдено</h3>
            <p className="text-neutral-400 mb-2 max-w-xs mx-auto">
              Попробуйте изменить запрос поиска
            </p>
            <p className="text-xs text-neutral-500">
              Нужного товара нет? Запросите добавление во вкладке <span className="text-red-500 font-bold">Profile</span>
            </p>
          </div>
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
