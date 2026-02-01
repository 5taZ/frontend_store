import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const isOutOfStock = (product.quantity || 1) <= 0;
  const displayQuantity = product.quantity !== undefined ? product.quantity : null;

  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden group hover:border-neutral-700 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 active:scale-[0.98]">
      {/* Изображение */}
      <div className="aspect-square bg-neutral-800/50 relative overflow-hidden">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600 bg-neutral-800">
            <span className="text-xs">Нет фото</span>
          </div>
        )}
        
        {/* Градиент overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Бейдж "Нет в наличии" */}
        {isOutOfStock && (
          <div className="absolute top-3 right-3 bg-red-600/95 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
            Нет в наличии
          </div>
        )}
        
        {/* Бейдж категории */}
        {product.category && (
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-neutral-300 text-[10px] font-medium px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            {product.category}
          </div>
        )}
      </div>
      
      {/* Контент */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-white line-clamp-1 mb-1 group-hover:text-red-500 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed h-8">
            {product.description}
          </p>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800/50">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white">{product.price} BYN</span>
            {displayQuantity !== null && (
              <span className={`text-[10px] font-medium ${
                isOutOfStock ? 'text-red-500' : displayQuantity <= 3 ? 'text-orange-500' : 'text-emerald-500'
              }`}>
                {isOutOfStock 
                  ? 'Нет на складе' 
                  : `Кол-во: ${displayQuantity} шт.`
                }
              </span>
            )}
          </div>
          
          {onAddToCart && (
            <button
              onClick={() => onAddToCart(product)}
              disabled={isOutOfStock}
              className={`relative p-3 rounded-xl transition-all duration-200 ${
                isOutOfStock 
                  ? 'bg-neutral-800 cursor-not-allowed text-neutral-600' 
                  : 'bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-500 hover:shadow-red-500/30 hover:-translate-y-0.5 active:translate-y-0'
              }`}
              title={isOutOfStock ? 'Нет в наличии' : 'Добавить в корзину'}
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
