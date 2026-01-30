import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, Send, PackageSearch, Filter, Check } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import { ADMIN_TELEGRAM_USERNAME } from '../types';

const Search: React.FC = () => {
  const { products, user, addToCart } = useStore();
  const [query, setQuery] = useState('');
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  
  // Pre-order form state
  const [preOrderName, setPreOrderName] = useState('');
  const [preOrderPhoto, setPreOrderPhoto] = useState(''); 

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['All', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = products.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesStock = inStockOnly ? p.inStock : true;
    return matchesQuery && matchesCategory && matchesStock;
  });

  const handlePreOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preOrderName.trim()) return;

    // Construct message: "Pre-order: [Name], Photo: [Link], User: [Username]"
    const message = `🛍 *NEW PRE-ORDER REQUEST* %0A%0A📦 *Item:* ${preOrderName} %0A📸 *Photo:* ${preOrderPhoto || 'No photo provided'} %0A👤 *User:* @${user.username}`;
    
    // Simulate sending to admin
    const telegramUrl = `https://t.me/${ADMIN_TELEGRAM_USERNAME}?text=${message}`;
    window.open(telegramUrl, '_blank');
    
    // Reset
    setPreOrderName('');
    setPreOrderPhoto('');
    alert('Pre-order request opened in Telegram!');
  };

  return (
    <div className="p-4 pt-6 min-h-full flex flex-col">
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-neutral-400" />
            </div>
            <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-neutral-800 rounded-xl leading-5 bg-neutral-900 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
            placeholder="Search items..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            />
        </div>
        <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl border transition-all ${
                showFilters 
                ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20' 
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
        >
            <Filter size={20} />
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 animate-fade-in bg-neutral-900 p-4 rounded-xl border border-neutral-800 space-y-4">
            <div>
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Category</h3>
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                selectedCategory === cat
                                    ? 'bg-red-600 text-white'
                                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                <span className="text-sm text-neutral-300">Show In Stock Only</span>
                <button
                    onClick={() => setInStockOnly(!inStockOnly)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${inStockOnly ? 'bg-red-600' : 'bg-neutral-800'}`}
                >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${inStockOnly ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>
        </div>
      )}

      {/* Results */}
      {query.length > 0 && filteredProducts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
          <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 w-full shadow-sm">
            <div className="flex items-center space-x-3 mb-4 text-red-600">
                <PackageSearch size={24} />
                <h2 className="text-lg font-bold text-white">Request Item</h2>
            </div>
            <p className="text-neutral-400 text-sm mb-6">
              Couldn't find what you're looking for? Submit a pre-order request directly to our admin.
            </p>
            
            <form onSubmit={handlePreOrderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={preOrderName}
                  onChange={(e) => setPreOrderName(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-red-600 outline-none"
                  placeholder="e.g. Jordan 1 Retro High"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Photo URL (Optional)</label>
                <input
                  type="url"
                  value={preOrderPhoto}
                  onChange={(e) => setPreOrderPhoto(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-red-600 outline-none"
                  placeholder="https://..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-white hover:bg-neutral-200 text-black font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition-all"
              >
                <span>Send Request to Admin</span>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 pb-20">
            {filteredProducts.map((product) => (
            <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => addToCart(product)}
            />
            ))}
            
            {filteredProducts.length === 0 && (
                 <div className="col-span-2 flex flex-col items-center justify-center py-10 text-neutral-500">
                    <PackageSearch size={32} className="mb-2 opacity-50"/>
                    <p className="text-sm">No items match your filters.</p>
                    <button 
                        onClick={() => {
                            setQuery('');
                            setSelectedCategory('All');
                            setInStockOnly(false);
                        }}
                        className="mt-2 text-red-500 text-xs font-bold hover:underline"
                    >
                        Clear all filters
                    </button>
                </div>
            )}

            {query.length === 0 && filteredProducts.length > 0 && !showFilters && (
                <div className="col-span-2 text-center text-neutral-500 text-sm mt-10">
                    Start typing to search our inventory...
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Search;