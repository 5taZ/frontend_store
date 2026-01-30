import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, Send, PackageSearch, Filter } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import { ADMIN_TELEGRAM_USERNAME } from '../types';

const Search: React.FC = () => {
  const { products, user, addToCart } = useStore();
  const [query, setQuery] = useState('');

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Pre-order
  const [preOrderName, setPreOrderName] = useState('');
  const [preOrderPhoto, setPreOrderPhoto] = useState('');

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['All', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = products.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || p.category === selectedCategory;
    const matchesStock = inStockOnly ? p.inStock : true;
    return matchesQuery && matchesCategory && matchesStock;
  });

  const handlePreOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preOrderName.trim()) return;

    if (!user) {
      alert('You must be logged in to submit a pre-order');
      return;
    }

    const message =
      `🛍 *NEW PRE-ORDER REQUEST* %0A%0A` +
      `📦 *Item:* ${preOrderName} %0A` +
      `📸 *Photo:* ${preOrderPhoto || 'No photo provided'} %0A` +
      `👤 *User:* @${user.username}`;

    const telegramUrl = `https://t.me/${ADMIN_TELEGRAM_USERNAME}?text=${message}`;
    window.open(telegramUrl, '_blank');

    setPreOrderName('');
    setPreOrderPhoto('');
    alert('Pre-order request opened in Telegram!');
  };

  return (
    <div className="p-4 pt-6 min-h-full flex flex-col">
      {/* Search bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-neutral-800 rounded-xl bg-neutral-900 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-red-600"
            placeholder="Search items..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-3 rounded-xl border transition-all ${
            showFilters
              ? 'bg-red-600 border-red-600 text-white'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          <Filter size={20} />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 bg-neutral-900 p-4 rounded-xl border border-neutral-800 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-neutral-500 uppercase mb-2">
              Category
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    selectedCategory === cat
                      ? 'bg-red-600 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
            <span className="text-sm text-neutral-300">
              Show In Stock Only
            </span>
            <button
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`w-12 h-6 rounded-full p-1 ${
                inStockOnly ? 'bg-red-600' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full transition-transform ${
                  inStockOnly ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {query.length > 0 && filteredProducts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 w-full">
            <div className="flex items-center space-x-3 mb-4 text-red-600">
              <PackageSearch size={24} />
              <h2 className="text-lg font-bold text-white">
                Request Item
              </h2>
            </div>

            <form onSubmit={handlePreOrderSubmit} className="space-y-4">
              <input
                type="text"
                value={preOrderName}
                onChange={(e) => setPreOrderName(e.target.value)}
                placeholder="Item name"
                className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white"
              />
              <input
                type="url"
                value={preOrderPhoto}
                onChange={(e) => setPreOrderPhoto(e.target.value)}
                placeholder="Photo URL (optional)"
                className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white"
              />
              <button
                type="submit"
                className="w-full bg-white text-black font-bold py-3 rounded-xl flex justify-center gap-2"
              >
                <span>Send Request</span>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 pb-20">
          {filteredProducts.map(product => (
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

export default Search;
