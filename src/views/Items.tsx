import React, { useState } from 'react';
import { Search, Package, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import ProductRequestForm from '../components/ProductRequestForm';

const Items: React.FC = () => {
  const { products, addToCart, user, cart } = useStore(); // ✅ Добавлен cart
  const [searchQuery, setSearchQuery] = useState('');
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Каталог товаров</h2>
            <p className="text-sm text-neutral-400">Найдите лучшее оборудование для ваших задач</p>
          </div>
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

      {filteredProducts.length === 0 && searchQuery.trim() !== '' ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-neutral-900/50 rounded-3xl border border-neutral-800/50 space-y-4">
          <div className="w-20 h-20 bg-neutral-800/80 rounded-full flex items-center justify-center mb-2">
            <Package size={40} className="text-neutral-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Товар не найден</h3>
            <p className="text-neutral-400 mb-6 max-w-xs mx-auto">
              Мы не нашли "{searchQuery}" в нашем каталоге. Вы можете запросить этот товар у нас.
            </p>
          </div>
          <button
            onClick={() => setIsRequestFormOpen(true)}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3.5 rounded-2xl hover:from-red-500 hover:to-red-600 transition-all shadow-lg shadow-red-600/20 flex items-center gap-2 font-medium active:scale-95"
          >
            <Sparkles size={20} />
            Запросить этот товар
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center">
            <Package size={32} className="text-neutral-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Пока нет товаров</h3>
            <p className="text-neutral-500 text-sm">Скоро здесь появится новое оборудование</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={addToCart}
              isInCart={cart.some(item => item.id === product.id)} // ✅ Проверяем, есть ли в корзине
            />
          ))}
        </div>
      )}

      <ProductRequestForm 
        productName={searchQuery}
        isOpen={isRequestFormOpen}
        onClose={() => setIsRequestFormOpen(false)}
      />
    </div>
  );
};

export default Items;
