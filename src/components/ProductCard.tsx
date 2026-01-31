import React from 'react';
import { Plus } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden active:scale-95 transition-transform">
      <div className="aspect-square bg-neutral-800 relative">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
            No Image
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-bold text-white truncate">{product.name}</h3>
        <p className="text-xs text-neutral-400 mt-1 line-clamp-2 h-8">{product.description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-white font-bold">{product.price} BYN</span>
          {onAddToCart && (
            <button
              onClick={() => onAddToCart(product)}
              className="bg-red-600 active:bg-red-700 text-white p-2 rounded-lg transition-colors"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
