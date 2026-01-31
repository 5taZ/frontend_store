import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

const Items: React.FC = () => {
  const { products, addToCart } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Простой поиск без фильтров
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  return (
    <div className="p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" size={20} />
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-red-600"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 gap-4 pb-4">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={addToCart}
          />
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-2 text-center py-10 text-neutral-500">
            No items found
          </div>
        )}
      </div>
    </div>
  );
};

export default Items;
