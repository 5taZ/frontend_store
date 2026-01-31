import React, { useState } from 'react';
import { Search, Package } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import ProductRequestForm from '../components/ProductRequestForm';

const Items: React.FC = () => {
  const { products, addToCart, user } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-red-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredProducts.length === 0 && searchQuery.trim() !== '' ? (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-neutral-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Product Not Found</h3>
          <p className="text-neutral-400 mb-6">
            We couldn't find "{searchQuery}" in our catalog
          </p>
          <button
            onClick={() => setIsRequestFormOpen(true)}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Package size={20} />
            Request This Product
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          No items available
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={addToCart}
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
