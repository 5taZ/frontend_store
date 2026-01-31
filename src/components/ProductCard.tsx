import React from 'react';
import { Plus } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  isAdminView?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, isAdminView }) => {
  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden flex flex-col">
      <div className="aspect-square relative bg-neutral-800">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover"
            // Для base64 изображений
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600">
            No Image
          </div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-sm font-bold text-white line-clamp-1">{product.name}</h3>
        <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{product.description}</p>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-white font-bold">{product.price} BYN</span>
          {!isAdminView && onAddToCart && (
            <button
              onClick={() => onAddToCart(product)}
              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
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
