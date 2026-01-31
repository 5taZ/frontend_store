import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, Upload, Edit, Save } from 'lucide-react';
import { useStore } from '../context/StoreContext';

// ТВОЙ CLOUDINARY (безопасно, т.к. unsigned preset только для загрузки фото)
const CLOUDINARY_CLOUD_NAME = 'dpghjapcd';
const CLOUDINARY_UPLOAD_PRESET = 'nextgear_unsigned';

enum AdminTab {
  INVENTORY = 'INVENTORY',
  ORDERS = 'ORDERS',
  PRODUCT_REQUESTS = 'PRODUCT_REQUESTS'
}

const Admin: React.FC = () => {
  const { products, addProduct, removeProduct, updateProduct, orders, processOrder, productRequests, processProductRequest, refreshProductRequests } = useStore();
  const [activeTab, setActiveTab] = useState<AdminTab>(AdminTab.ORDERS);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING);
  const pendingRequests = productRequests.filter(r => r.status === 'pending');

  const [formState, setFormState] = useState({
    id: '',
    name: '',
    price: '',
    image: '',
    category: '',
    description: '',
    quantity: '1',
  });

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Автообновление запросов каждые 5 секунд
  useEffect(() => {
    if (activeTab === AdminTab.PRODUCT_REQUESTS) {
      const interval = setInterval(() => {
        refreshProductRequests();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, refreshProductRequests]);

  // Загрузка фото напрямую в Cloudinary
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
        const optimizedUrl = data.secure_url.replace('/upload/', '/upload/w_800,q_auto/');
        setFormState(prev => ({ ...prev, image: optimizedUrl }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.name || !formState.price) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingProduct) {
        // Редактирование существующего товара
        await updateProduct(editingProduct, {
          name: formState.name,
          price: Number(formState.price),
          image: formState.image,
          category: formState.category || 'General',
          description: formState.description || 'No description',
          quantity: Number(formState.quantity) || 1
        });
        setNotification({ message: 'Product updated!', type: 'success' });
      } else {
        // Добавление нового товара
        await addProduct({
          id: Date.now().toString(),
          name: formState.name,
          price: Number(formState.price),
          image: formState.image,
          category: formState.category || 'General',
          description: formState.description || 'No description',
          inStock: true,
          quantity: Number(formState.quantity) || 1
        });
        setNotification({ message: 'Product added!', type: 'success' });
      }
      
      // Сброс формы
      setFormState({ id: '', name: '', price: '', image: '', category: '', description: '', quantity: '1' });
      setIsAdding(false);
      setEditingProduct(null);
    } catch (error) {
      setNotification({ message: 'Failed to save product', type: 'error' });
    }
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

  // ✅ НОВОЕ: Начать редактирование товара
  const handleEditProduct = (product: any) => {
    setFormState({
      id: product.id,
      name: product.name,
      price: product.price.toString(),
      image: product.image || '',
      category: product.category || '',
      description: product.description || '',
      quantity: (product.quantity || 1).toString()
    });
    setEditingProduct(product.id);
    setIsAdding(true);
  };

  const handleProcessOrder = (orderId: string, approved: boolean) => {
    processOrder(orderId, approved);
    setNotification({
      message: approved ? 'Order confirmed' : 'Order rejected',
      type: approved ? 'success' : 'error'
    });
  };

  const handleProcessProductRequest = (requestId: string, approved: boolean) => {
    processProductRequest(requestId, approved);
    setNotification({
      message: approved ? 'Request approved' : 'Request rejected',
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
          onClick={() => setActiveTab(AdminTab.PRODUCT_REQUESTS)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${
            activeTab === AdminTab.PRODUCT_REQUESTS ? 'bg-neutral-800 text-white' : 'text-neutral-500'
          }`}
        >
          Product Requests ({pendingRequests.length})
        </button>
        <button 
          onClick={() => {
            setActiveTab(AdminTab.INVENTORY);
            if (isAdding) {
              setIsAdding(false);
              setEditingProduct(null);
              setFormState({ id: '', name: '', price: '', image: '', category: '', description: '', quantity: '1' });
            }
          }}
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
              onClick={() => {
                if (isAdding && editingProduct) {
                  // Выходим из режима редактирования
                  setEditingProduct(null);
                  setFormState({ id: '', name: '', price: '', image: '', category: '', description: '', quantity: '1' });
                } else {
                  // Переключаем режим добавления/редактирования
                  setIsAdding(!isAdding);
                  if (!isAdding) {
                    setEditingProduct(null);
                    setFormState({ id: '', name: '', price: '', image: '', category: '', description: '', quantity: '1' });
                  }
                }
              }}
              className="bg-red-600 p-2 rounded-lg flex items-center gap-2"
            >
              {isAdding ? (
                <>
                  <X size={20} />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <Plus size={20} />
                  <span>Add Product</span>
                </>
              )}
            </button>
          </div>

          {isAdding && (
            <form onSubmit={handleSubmit} className="bg-neutral-900 p-4 rounded-xl space-y-3 mb-4">
              <input 
                type="text" 
                placeholder="Product Name"
                className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white"
                value={formState.name}
                onChange={e => setFormState({...formState, name: e.target.value})}
                required
              />
              <input 
                type="number" 
                placeholder="Price (BYN)"
                className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white"
                value={formState.price}
                onChange={e => setFormState({...formState, price: e.target.value})}
                required
              />
              <input 
                type="number" 
                placeholder="Quantity"
                className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white"
                value={formState.quantity}
                onChange={e => setFormState({...formState, quantity: e.target.value})}
                min="1"
                required
              />
              <input 
                type="text" 
                placeholder="Category"
                className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white"
                value={formState.category}
                onChange={e => setFormState({...formState, category: e.target.value})}
              />
              
              <div className="space-y-2">
                <label className="block text-sm text-neutral-400">Product Image</label>
                <label className={`w-full bg-black border border-neutral-800 rounded-lg p-3 flex items-center gap-2 cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
                  <Upload size={20} className="text-neutral-500" />
                  <span className="text-sm text-neutral-400">
                    {uploading ? 'Uploading to Cloud...' : formState.image ? 'Change image' : 'Choose file'}
                  </span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {formState.image && (
                  <img src={formState.image} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                )}
              </div>

              <textarea 
                placeholder="Description"
                className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white h-20"
                value={formState.description}
                onChange={e => setFormState({...formState, description: e.target.value})}
              />
              
              <button 
                type="submit" 
                disabled={uploading || !formState.image}
                className="w-full bg-red-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {editingProduct ? (
                  <>
                    <Save size={20} />
                    <span>Save Changes</span>
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    <span>Add Product</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="grid grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-neutral-900 rounded-xl p-3 relative group">
                {/* Кнопки управления */}
                <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditProduct(p)}
                    className="bg-blue-600/80 hover:bg-blue-600 text-white p-1.5 rounded-lg transition-colors"
                    title="Edit product"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p.id, p.name)}
                    className="bg-red-600/80 hover:bg-red-600 text-white p-1.5 rounded-lg transition-colors"
                    title="Delete product"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-32 object-cover rounded-lg mb-2 bg-neutral-800" loading="lazy" />
                ) : (
                  <div className="w-full h-32 bg-neutral-800 rounded-lg mb-2 flex items-center justify-center text-neutral-600 text-xs">
                    No Image
                  </div>
                )}
                <p className="font-bold text-sm truncate">{p.name}</p>
                <p className="text-sm text-neutral-400">{p.price} BYN</p>
                {p.quantity !== undefined && (
                  <p className={`text-xs mt-1 font-medium ${
                    (p.quantity || 0) <= 0 ? 'text-red-500' : 'text-emerald-500'
                  }`}>
                    Qty: {p.quantity}
                  </p>
                )}
              </div>
            ))}
            {products.length === 0 && (
              <div className="col-span-2 text-center text-neutral-500 py-10">
                No items in inventory
              </div>
            )}
          </div>
        </>
      ) : activeTab === AdminTab.PRODUCT_REQUESTS ? (
        // ... (код таба запросов без изменений) ...
        <div className="space-y-4">
          {pendingRequests.map(request => (
            <div key={request.id} className="bg-neutral-900 rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-neutral-500">#{request.id.slice(-6)}</span>
                <span className="text-xs bg-blue-900/30 text-blue-500 px-2 py-1 rounded">REQUEST</span>
              </div>
              <p className="font-bold mb-1">@{request.username}</p>
              <p className="text-sm text-neutral-300 mb-2">"{request.productName}"</p>
              <div className="flex items-center gap-2 mb-3">
                <Box size={16} className="text-neutral-500" />
                <span className="text-sm text-neutral-400">Quantity: {request.quantity}</span>
              </div>
              {request.image && (
                <img src={request.image} alt="Product" className="w-full h-32 object-cover rounded-lg mb-3 bg-neutral-800" />
              )}
              <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
                <span className="text-xs text-neutral-500">
                  {new Date(request.createdAt).toLocaleDateString()}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleProcessProductRequest(request.id, false)}
                    className="bg-red-600/20 text-red-500 py-2 rounded-lg text-sm font-medium"
                  >
                    <XCircle size={16} className="inline mr-1" />
                    Reject
                  </button>
                  <button 
                    onClick={() => handleProcessProductRequest(request.id, true)}
                    className="bg-green-600/20 text-green-500 py-2 rounded-lg text-sm font-medium"
                  >
                    <CheckCircle size={16} className="inline mr-1" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
          {pendingRequests.length === 0 && <p className="text-neutral-500 text-center py-8">No pending product requests</p>}
        </div>
      ) : (
        // ... (код таба заказов без изменений) ...
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
