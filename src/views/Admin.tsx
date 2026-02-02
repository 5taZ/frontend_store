import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, Upload, Edit, Check, Box, XCircle, CheckCircle, ChevronRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OrderStatus } from '../types';

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
  
  // ✅ Состояние для обработки запроса с ценой
  const [processingRequest, setProcessingRequest] = useState<{
    id: string;
    productName: string;
    quantity: number;
    image?: string;
    price: string;
  } | null>(null);
  
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

  useEffect(() => {
    if (activeTab === AdminTab.PRODUCT_REQUESTS) {
      const interval = setInterval(() => {
        refreshProductRequests();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, refreshProductRequests]);

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
      setNotification({ message: 'Upload failed', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const name = formState.name.trim();
    const priceStr = formState.price.trim();
    const quantityStr = formState.quantity.trim();
    
    if (!name || !priceStr || !quantityStr) {
      alert('Please fill in all required fields');
      return;
    }
    
    const priceNum = parseFloat(priceStr);
    const quantityNum = parseInt(quantityStr, 10);
    
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Price must be a positive number');
      return;
    }
    
    if (isNaN(quantityNum) || quantityNum <= 0) {
      alert('Quantity must be a positive integer');
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct, {
          name, price: priceNum, quantity: quantityNum,
          image: formState.image || undefined,
          category: formState.category.trim() || 'General',
          description: formState.description.trim() || 'No description',
        });
        setNotification({ message: 'Product updated!', type: 'success' });
      } else {
        await addProduct({
          id: Date.now().toString(), name, price: priceNum, quantity: quantityNum,
          image: formState.image || '',
          category: formState.category.trim() || 'General',
          description: formState.description.trim() || 'No description',
          inStock: true,
        });
        setNotification({ message: 'Product added!', type: 'success' });
      }
      
      setFormState({ id: '', name: '', price: '', image: '', category: '', description: '', quantity: '1' });
      setIsAdding(false);
      setEditingProduct(null);
    } catch (error: any) {
      setNotification({ message: `Failed: ${error.message}`, type: 'error' });
    }
  };

  const handleCancel = () => {
    setFormState({ id: '', name: '', price: '', image: '', category: '', description: '', quantity: '1' });
    setIsAdding(false);
    setEditingProduct(null);
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

  const handleEditProduct = (product: any) => {
    setFormState({
      id: product.id, name: product.name, price: product.price.toString(),
      image: product.image || '', category: product.category || '',
      description: product.description || '', quantity: (product.quantity || 1).toString()
    });
    setEditingProduct(product.id);
    setIsAdding(true);
  };

  const handleProcessOrder = (orderId: string, approved: boolean) => {
    processOrder(orderId, approved);
    setNotification({ message: approved ? 'Order confirmed' : 'Order rejected', type: approved ? 'success' : 'error' });
  };

  // ✅ НОВОЕ: Начать обработку запроса с вводом цены
  const handleStartProcessRequest = (request: any) => {
    setProcessingRequest({
      id: request.id,
      productName: request.productName,
      quantity: request.quantity,
      image: request.image,
      price: ''
    });
  };

  // ✅ НОВОЕ: Подтвердить запрос с ценой и добавить товар
  const handleApproveWithPrice = async () => {
    if (!processingRequest) return;
    
    const price = parseFloat(processingRequest.price);
    if (isNaN(price) || price <= 0) {
      alert('Введите корректную цену');
      return;
    }

    try {
      // 1. Добавляем товар в каталог
      await addProduct({
        id: Date.now().toString(),
        name: processingRequest.productName,
        price: price,
        quantity: processingRequest.quantity,
        image: processingRequest.image || '',
        category: 'General',
        description: 'Добавлено по запросу пользователя',
        inStock: true,
      });

      // 2. Одобряем запрос
      await processProductRequest(processingRequest.id, true);
      
      setNotification({ message: 'Товар добавлен в каталог!', type: 'success' });
      setProcessingRequest(null);
    } catch (error: any) {
      setNotification({ message: `Ошибка: ${error.message}`, type: 'error' });
    }
  };

  const handleRejectRequest = (requestId: string) => {
    processProductRequest(requestId, false);
    setNotification({ message: 'Запрос отклонен', type: 'error' });
  };

  return (
    <div className="p-4 space-y-4 relative pb-24">
      {notification && (
        <div className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-xl ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          {notification.message}
        </div>
      )}

      {/* ✅ Модалка для ввода цены */}
      {processingRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 rounded-3xl w-full max-w-md p-6 border border-neutral-800">
            <h3 className="text-xl font-bold text-white mb-4">Добавить товар в каталог</h3>
            
            <div className="bg-neutral-800/50 rounded-xl p-4 mb-4">
              <p className="text-sm text-neutral-400 mb-1">Название</p>
              <p className="text-white font-medium mb-3">{processingRequest.productName}</p>
              
              <p className="text-sm text-neutral-400 mb-1">Количество</p>
              <p className="text-white font-medium">{processingRequest.quantity} шт.</p>
              
              {processingRequest.image && (
                <img src={processingRequest.image} alt="" className="w-full h-32 object-cover rounded-lg mt-3" />
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Установите цену (BYN) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full bg-black border border-neutral-800 rounded-xl p-4 text-white text-xl font-bold focus:outline-none focus:border-red-600"
                value={processingRequest.price}
                onChange={(e) => setProcessingRequest({...processingRequest, price: e.target.value})}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setProcessingRequest(null)}
                className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={handleApproveWithPrice}
                disabled={!processingRequest.price}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Добавить в каталог
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex bg-neutral-900 p-1 rounded-xl mb-4">
        <button 
          onClick={() => setActiveTab(AdminTab.ORDERS)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === AdminTab.ORDERS ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
        >
          Orders ({pendingOrders.length})
        </button>
        <button 
          onClick={() => setActiveTab(AdminTab.PRODUCT_REQUESTS)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === AdminTab.PRODUCT_REQUESTS ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
        >
          Requests ({pendingRequests.length})
        </button>
        <button 
          onClick={() => { setActiveTab(AdminTab.INVENTORY); if (isAdding) handleCancel(); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === AdminTab.INVENTORY ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
        >
          Inventory
        </button>
      </div>

      {activeTab === AdminTab.INVENTORY ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Inventory</h2>
            <button 
              onClick={() => isAdding ? handleCancel() : (setIsAdding(true), setEditingProduct(null), setFormState({ id: '', name: '', price: '', image: '', category: '', description: '', quantity: '1' }))}
              className="bg-red-600 p-2 rounded-lg flex items-center gap-2 hover:bg-red-700"
            >
              <Plus size={20} />
              <span>{isAdding ? 'Close' : 'Add Product'}</span>
            </button>
          </div>

          {isAdding && (
            <form onSubmit={handleSubmit} className="bg-neutral-900 p-4 rounded-xl space-y-3 mb-4">
              <input type="text" placeholder="Product Name *" className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} required />
              <input type="number" placeholder="Price (BYN) *" className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white" value={formState.price} onChange={e => setFormState({...formState, price: e.target.value})} required min="0.01" step="0.01" />
              <input type="number" placeholder="Quantity *" className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white" value={formState.quantity} onChange={e => setFormState({...formState, quantity: e.target.value})} min="1" required />
              
              <label className={`w-full bg-black border border-neutral-800 rounded-lg p-3 flex items-center gap-2 cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
                <Upload size={20} className="text-neutral-500" />
                <span className="text-sm text-neutral-400">{uploading ? 'Uploading...' : formState.image ? 'Change image' : 'Upload image'}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
              </label>
              {formState.image && (
                <div className="relative w-full h-40">
                  <img src={formState.image} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                  <button type="button" onClick={() => setFormState(prev => ({ ...prev, image: '' }))} className="absolute top-2 right-2 bg-red-600/80 text-white p-1 rounded-full"><X size={14} /></button>
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={handleCancel} className="flex-1 bg-neutral-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"><X size={20} /><span>Cancel</span></button>
                <button type="submit" disabled={uploading} className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"><Check size={20} /><span>{editingProduct ? 'Save' : 'Add'}</span></button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-neutral-900 rounded-xl p-3 relative group">
                <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditProduct(p)} className="bg-blue-600/80 text-white p-1.5 rounded-lg"><Edit size={14} /></button>
                  <button onClick={() => handleDeleteProduct(p.id, p.name)} className="bg-red-600/80 text-white p-1.5 rounded-lg"><Trash2 size={14} /></button>
                </div>
                {p.image ? <img src={p.image} alt={p.name} className="w-full h-32 object-cover rounded-lg mb-2 bg-neutral-800" /> : <div className="w-full h-32 bg-neutral-800 rounded-lg mb-2 flex items-center justify-center text-neutral-600 text-xs">No Image</div>}
                <p className="font-bold text-sm truncate">{p.name}</p>
                <p className="text-sm text-neutral-400">{p.price} BYN</p>
                <p className={`text-xs mt-1 font-medium ${(p.quantity || 0) <= 0 ? 'text-red-500' : 'text-emerald-500'}`}>Qty: {p.quantity}</p>
              </div>
            ))}
            {products.length === 0 && <div className="col-span-2 text-center text-neutral-500 py-10">No items</div>}
          </div>
        </>
      ) : activeTab === AdminTab.PRODUCT_REQUESTS ? (
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
              {request.image && <img src={request.image} alt="Product" className="w-full h-32 object-cover rounded-lg mb-3 bg-neutral-800" />}
              
              {/* ✅ Новые кнопки с вводом цены */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800">
                <button 
                  onClick={() => handleRejectRequest(request.id)}
                  className="bg-red-600/20 text-red-500 py-3 rounded-xl text-sm font-bold"
                >
                  <XCircle size={16} className="inline mr-1" />
                  Отклонить
                </button>
                <button 
                  onClick={() => handleStartProcessRequest(request)}
                  className="bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold"
                >
                  <CheckCircle size={16} className="inline mr-1" />
                  Добавить в каталог
                </button>
              </div>
            </div>
          ))}
          {pendingRequests.length === 0 && <p className="text-neutral-500 text-center py-8">No pending requests</p>}
        </div>
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
                    {item.image && <img src={item.image} alt="" className="w-8 h-8 rounded object-cover bg-neutral-800" />}
                    <span className="text-sm text-neutral-300">{item.name} x{item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mb-3 pt-2 border-t border-neutral-800">
                <span className="text-sm text-neutral-400">Total</span>
                <span className="font-bold">{order.totalAmount} BYN</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleProcessOrder(order.id, false)} className="bg-red-600/20 text-red-500 py-2 rounded-lg text-sm font-medium">Reject</button>
                <button onClick={() => handleProcessOrder(order.id, true)} className="bg-white text-black py-2 rounded-lg text-sm font-bold">Confirm</button>
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
