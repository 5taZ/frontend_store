import React, { useState } from 'react';
import { Package, Upload, X, Check, Loader2, Search } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface ProductRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProductRequestForm: React.FC<ProductRequestFormProps> = ({ isOpen, onClose }) => {
  const { requestProduct } = useStore();
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    quantity: '1',
    image: ''
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Максимальный размер файла — 5MB');
      return;
    }

    setUploading(true);
    
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('upload_preset', 'nextgear_unsigned');

    try {
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dpghjapcd/image/upload',
        {
          method: 'POST',
          body: formDataUpload
        }
      );
      
      const data = await response.json();
      if (data.secure_url) {
        const optimizedUrl = data.secure_url.replace('/upload/', '/upload/w_800,q_auto/');
        setFormData(prev => ({ ...prev, image: optimizedUrl }));
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ошибка загрузки. Попробуйте снова.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productName.trim()) {
      alert('Пожалуйста, введите название товара');
      return;
    }

    setSubmitting(true);
    
    try {
      await requestProduct(
        formData.productName.trim(),
        parseInt(formData.quantity),
        formData.image || undefined
      );
      
      setFormData({ productName: '', quantity: '1', image: '' });
      onClose();
    } catch (error) {
      alert('Ошибка отправки запроса');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 rounded-3xl w-full max-w-md relative border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-neutral-900 pt-6 pb-4 px-6 border-b border-neutral-800 z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-full transition-all"
          >
            <X size={20} />
          </button>

          <div className="text-center">
            <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="text-red-500" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Запросить товар
            </h2>
            <p className="text-sm text-neutral-400">
              Опишите товар, которого нет в каталоге. Мы добавим его и сообщим вам.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Название товара <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Например: iPhone 15 Pro Max..."
              className="w-full bg-black border border-neutral-800 rounded-xl p-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Количество <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                placeholder="1"
                className="w-full bg-black border border-neutral-800 rounded-xl p-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">шт.</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Фото товара (опционально)
            </label>
            <label 
              className={`
                w-full bg-black border-2 border-dashed border-neutral-800 rounded-xl p-4 
                flex flex-col items-center gap-2 cursor-pointer hover:border-neutral-600 hover:bg-neutral-900/50 transition-all
                ${uploading ? 'opacity-50 cursor-wait' : ''}
                ${formData.image ? 'border-emerald-600/50 bg-emerald-600/5' : ''}
              `}
            >
              {formData.image ? (
                <>
                  <Check size={24} className="text-emerald-500" />
                  <span className="text-sm text-emerald-500 font-medium">Фото загружено</span>
                  <span className="text-xs text-neutral-500">Нажмите, чтобы изменить</span>
                </>
              ) : (
                <>
                  <Upload size={24} className={uploading ? 'animate-bounce text-neutral-500' : 'text-neutral-500'} />
                  <span className="text-sm text-neutral-400">
                    {uploading ? 'Загрузка...' : 'Загрузить фото'}
                  </span>
                  <span className="text-xs text-neutral-600">PNG, JPG до 5MB</span>
                </>
              )}
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            
            {formData.image && (
              <div className="mt-3 relative rounded-xl overflow-hidden border border-neutral-800">
                <img 
                  src={formData.image} 
                  alt="Preview" 
                  className="w-full h-48 object-cover" 
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                  className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-red-600 rounded-full text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={uploading || submitting || !formData.productName.trim()}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-4 rounded-xl hover:from-red-500 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Package size={20} />
              )}
              {submitting ? 'Отправка...' : 'Отправить запрос'}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 text-neutral-400 hover:text-white text-sm font-medium transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductRequestForm;
