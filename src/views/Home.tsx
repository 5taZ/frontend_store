import React from 'react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

const Home: React.FC = () => {
  const { products, addToCart } = useStore();
  const availableProducts = products.filter(p => p.inStock);

  return (
    <div className="p-4 space-y-6">
      <header className="flex justify-between items-center mb-4">
        <div>
            <h1 className="text-2xl font-black text-white italic tracking-tighter">NEXT GEAR</h1>
        </div>
        {/* Placeholder for the Next Gear Logo - Replace src with actual logo URL */}
        <img 
            src="https://placehold.co/100x100/0a0a0a/dc2626?text=LOGO"
            alt="Next Gear Logo" 
            className="w-12 h-12 object-contain"
        />
      </header>

      {/* Banner / Hero Area */}
      <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <h2 className="text-xl font-bold text-white mb-1">New Arrivals</h2>
        <p className="text-neutral-400 text-sm mb-4">Check out the latest drops.</p>
        <div className="h-1 w-12 bg-red-600 rounded-full"></div>
      </div>

      {availableProducts.length === 0 ? (
        <div className="text-center py-20 text-neutral-500">
            <p>No items in stock currently.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
            {availableProducts.map((product) => (
            <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => addToCart(product)}
            />
            ))}
        </div>
      )}
    </div>
  );
};

export default Home;