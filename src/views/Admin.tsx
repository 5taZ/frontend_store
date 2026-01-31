import React, { useState, useEffect } from 'react';
import { Plus, X, Check, Ban, Package, ClipboardList, Trash2, Upload } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OrderStatus } from '../types';

// ТВОЙ CLOUDINARY (безопасно, т.к. unsigned preset только для загрузки фото)
const CLOUDINARY_CLOUD_NAME = 'dpghjapcd';
const CLOUDINARY_UPLOAD_PRESET = 'nextgear_unsigned';

enum AdminTab {
  INVENTORY = 'INVENTORY',
  ORDERS = 'ORDERS'
}

const Admin: React.FC = () => {
  const { products, addProduct, removeProduct, orders, processOrder } = useStore();
  const [activeTab, setActiveTab] = useState<AdminTab>(AdminTab.ORDERS);
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING);

  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    image: '',
    category: '',
    description: '',
  });

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Загрузка фото напрямую в Cloudinary (не через твой бэкенд!)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Max 5MB');
      return;
    }

    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      const data = await response.json();
      if (data.secure_url) {
        // Сразу получаем оптимизированный URL
        const optimizedUrl = data.secure_url.replace('/upload/', '/upload/w_800,q_auto/');
        setNewItem(prev => ({ ...prev, image: optimizedUrl }));
        setNotification({ message: 'Image uploaded!', type: 'success' });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setNotification({ message: 'Upload failed. Check preset settings.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;

    addProduct({
      id: Date.now().toString(),
      name: newItem.name,
      price: Number(newItem.price),
      image: newItem.image, // Это уже URL с Cloudinary
      category: newItem.category || 'General',
      description: newItem.description || 'No description',
      inStock: true
    });

    setNewItem({ name: '', price: '', image: '', category: '', description: '' });
    setIsAdding(false);
    setNotification({ message: 'Item added', type: 'success' });
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Delete "${productName}"?`)) return;
    try {
      await removeProduct(productId);
      setNotification({ message: `Deleted: ${productName}`, type: 'success' });
    } catch (error) {
      setNotification({ message: 'Failed to delete', type: 'error' });
    }
  };

  const handleProcessOrder = (orderId: string, approved: boolean) => {
    processOrder(orderId, approved);
    setNotification({
      message: approved ? 'Order confirmed' : 'Order rejected',
      type: approved ? 'success' : 'error'
    });
  };

  return (
    <div className="p-4 space-y-4 relative pb-24">
      {notification && (
        <div className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-xl ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {notification.message}
        </div>
      )}

      <div className="flex bg-neutral-900 p-1 rounded-xl mb-4">
        <button 
          onClick={() => setActiveTab(AdminTab.ORDERS)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${
            activeTab === AdminTab.ORDERS ? 'bg-neutral-800 text-white' : 'text-neutral-500'
          }`}
        >
          Orders ({pendingOrders.length})
        </button>
        <button 
          onClick={() => setActiveTab(AdminTab.INVENTORY)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${
            activeTab === AdminTab.INVENTORY ? 'bg-neutral-800 text-white' : 'text-neutral-500'
          }`}
        >
          Inventory
        </button>
      </div>

      {activeTab === AdminTab.INVENTORY ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Inventory</h2>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="bg-red-600 p-2 rounded-lg"
            >
              {isAdding ? <X size={20} /> : <Plus size={20} />}
            </button>
          </div>

          {isAdding && (
            <form onSubmit={handleSubmit} className="bg-neutral-900 p-4 rounded-xl space-y-3 mb-4">
              <input 
                type="text" 
                placeholder="Product Name"
                className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white"
                value={newItem.name}
                onChange={e => setNewItem({...newItem, name: e.target.value})}
                required
              />
              <input 
                type="number" 
                placeholder="Price (BYN)"
                className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white"
                value={newItem.price}
                onChange={e => setNewItem({...newItem, price: e.target.value})}
                required
              />
              <input 
                type="text" 
                placeholder="Category"
                className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white"
                value={newItem.category}
                onChange={e => setNewItem({...newItem, category: e.target.value})}
              />
              
              {/* Загрузка фото */}
              <div className="space-y-2">
                <label className="block text-sm text-neutral-400">Product Image</label>
                <label className={`w-full bg-black border border-neutral-800 rounded-lg p-3 flex items-center gap-2 cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
                  <Upload size={20} className="text-neutral-500" />
                  <span className="text-sm text-neutral-400">
                    {uploading ? 'Uploading to Cloud...' : newItem.image ? 'Change image' : 'Choose file'}
                  </span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {newItem.image && (
                  <img src={newItem.image} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                )}
              </div>

              <textarea 
                placeholder="Description"
                className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white h-20"
                value={newItem.description}
                onChange={e => setNewItem({...newItem, description: e.target.value})}
              />
              
              <button 
                type="submit" 
                disabled={uploading || !newItem.image}
                className="w-full bg-red-600 text-white font-bold py-3 rounded-xl disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Add Product'}
              </button>
            </form>
          )}

          <div className="grid grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-neutral-900 rounded-xl p-3 relative group">
                <button
                  onClick={() => handleDeleteProduct(p.id, p.name)}
                  className="absolute top-2 right-2 z-10 bg-red-600/80 hover:bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
                
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-32 object-cover rounded-lg mb-2 bg-neutral-800" loading="lazy" />
                ) : (
                  <div className="w-full h-32 bg-neutral-800 rounded-lg mb-2 flex items-center justify-center text-neutral-600 text-xs">
                    No Image
                  </div>
                )}
                <p className="font-bold text-sm truncate">{p.name}</p>
                <p className="text-sm text-neutral-400">{p.price} BYN</p>
              </div>
            ))}
            {products.length === 0 && (
              <div className="col-span-2 text-center text-neutral-500 py-10">
                No items in inventory
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {pendingOrders.map(order => (
            <div key={order.id} className="bg-neutral-900 rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-neutral-500">#{order.id.slice(-6)}</span>
                <span className="text-xs bg-yellow-900/30 text-yellow-500 px-2 py-1 rounded">PENDING</span>
              </div>
              <p className="font-bold mb-2">@{order.username}</p>
              <div className="space-y-1 mb-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {item.image && (
                      <img src={item.image} alt="" className="w-8 h-8 rounded object-cover bg-neutral-800" />
                    )}
                    <span className="text-sm text-neutral-300">
                      {item.name} x{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mb-3 pt-2 border-t border-neutral-800">
                <span className="text-sm text-neutral-400">Total</span>
                <span className="font-bold">{order.totalAmount} BYN</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleProcessOrder(order.id, false)}
                  className="bg-red-600/20 text-red-500 py-2 rounded-lg text-sm font-medium"
                >
                  Reject
                </button>
                <button 
                  onClick={() => handleProcessOrder(order.id, true)}
                  className="bg-white text-black py-2 rounded-lg text-sm font-bold"
                >
                  Confirm
                </button>
              </div>
            </div>
          ))}
          {pendingOrders.length === 0 && <p className="text-neutral-500 text-center py-8">No pending orders</p>}
        </div>
      )}
    </div>
  );
};

export default Admin;
