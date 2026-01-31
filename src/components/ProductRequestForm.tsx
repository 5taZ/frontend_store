import React, { useState } from 'react';
import { Package, Upload, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface ProductRequestFormProps {
  productName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const ProductRequestForm: React.FC<ProductRequestFormProps> = ({ productName = '', isOpen, onClose }) => {
  const { requestProduct } = useStore();
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    productName: productName,
    quantity: '1',
    image: ''
  });

  // Загрузка фото в Cloudinary
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Max 5MB');
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
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productName.trim()) {
      alert('Please enter product name');
      return;
    }

    await requestProduct(
      formData.productName.trim(),
      parseInt(formData.quantity),
      formData.image || undefined
    );
    
    setFormData({ productName: productName, quantity: '1', image: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          Product Not Found?
        </h2>
        <p className="text-sm text-neutral-400 text-center mb-6">
          Request the product and we'll notify you when it's available
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter product name..."
              className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-red-600"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="1"
              min="1"
              className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-red-600"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-2">
              Product Image (Optional)
            </label>
            <label className={`w-full bg-black border border-neutral-800 rounded-lg p-3 flex items-center gap-2 cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
              <Upload size={20} className="text-neutral-500" />
              <span className="text-sm text-neutral-400">
                {uploading ? 'Uploading...' : formData.image ? 'Change image' : 'Upload image (optional)'}
              </span>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            {formData.image && (
              <img 
                src={formData.image} 
                alt="Preview" 
                className="w-full h-40 object-cover rounded-lg mt-2" 
              />
            )}
          </div>

          <button
            type="submit"
            disabled={uploading || !formData.productName.trim()}
            className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            Send Request
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductRequestForm;
