import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
  isAdminView?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, isAdminView = false }) => {
  const { removeProduct } = useStore();

  return (
    <div className="bg-neutral-900 rounded-xl overflow-hidden shadow-sm border border-neutral-800 flex flex-col h-full relative group">
      <div className="relative h-48 w-full overflow-hidden bg-white">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-[2px]">
            <span className="text-white font-bold bg-red-600 px-3 py-1 rounded-md text-xs uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
        {isAdminView && (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    removeProduct(product.id);
                }}
                className="absolute top-2 right-2 bg-neutral-950/80 p-2 rounded-full text-white hover:bg-red-600 transition-colors"
            >
                <Trash2 size={16} />
            </button>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
            <h3 className="text-sm font-bold text-white line-clamp-1">{product.name}</h3>
        </div>
        <p className="text-xs text-neutral-400 mb-3 line-clamp-2">{product.description}</p>
        
        <div className="mt-auto flex items-center justify-between">
          <span className="text-base font-bold text-white">
            {product.price.toLocaleString('ru-RU')} ₽
          </span>
          
          {!isAdminView && product.inStock && (
            <button
              onClick={onAddToCart}
              className="bg-neutral-800 hover:bg-red-600 text-white p-2 rounded-lg transition-colors active:scale-95 border border-neutral-700 hover:border-red-600"
            >
              <Plus size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;