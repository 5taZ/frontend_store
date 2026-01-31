import React, { useState, useEffect } from 'react';
import { Plus, X, Check, Ban, Package, ClipboardList } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OrderStatus } from '../types';

enum AdminTab {
  INVENTORY = 'INVENTORY',
  ORDERS = 'ORDERS'
}

const Admin: React.FC = () => {
  const { products, addProduct, orders, processOrder } = useStore();
  const [activeTab, setActiveTab] = useState<AdminTab>(AdminTab.ORDERS);
  const [isAdding, setIsAdding] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING);

  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    image: '',
    category: '',
    description: '',
  });

  // Загрузка файла и конвертация в base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image too large. Max 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;

    addProduct({
      id: Date.now().toString(),
      name: newItem.name,
      price: Number(newItem.price),
      image: newItem.image,
      category: newItem.category || 'General',
      description: newItem.description || 'No description',
      inStock: true
    });

    setNewItem({ name: '', price: '', image: '', category: '', description: '' });
    setIsAdding(false);
    setNotification({ message: 'Item added', type: 'success' });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleProcessOrder = (orderId: string, approved: boolean) => {
    processOrder(orderId, approved);
    setNotification({
      message: approved ? 'Order confirmed' : 'Order rejected',
      type: approved ? 'success' : 'error'
    });
  };

  return (
    <div className="p-4 space-y-4 relative">
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
            <h2 className="text-lg font-bold">Add New Item</h2>
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
                placeholder="Price (BYN)" // Изменено на BYN
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
              
              {/* Загрузка файла вместо URL */}
              <div className="space-y-2">
                <label className="block text-sm text-neutral-400">Product Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-red-600 file:text-white"
                />
                {newItem.image && (
                  <img src={newItem.image} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                )}
              </div>

              <textarea 
                placeholder="Description"
                className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white h-20"
                value={newItem.description}
                onChange={e => setNewItem({...newItem, description: e.target.value})}
              />
              
              <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-xl">
                Add Product
              </button>
            </form>
          )}

          <div className="grid grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-neutral-900 rounded-xl p-3">
                {p.image && <img src={p.image} alt={p.name} className="w-full h-32 object-cover rounded-lg mb-2" />}
                <p className="font-bold">{p.name}</p>
                <p className="text-sm text-neutral-400">{p.price} BYN</p>
              </div>
            ))}
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
                  <div key={i} className="text-sm text-neutral-300">
                    {item.name} x{item.quantity} - {item.price * item.quantity} BYN
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
                <span className="font-bold">Total: {order.totalAmount} BYN</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleProcessOrder(order.id, false)}
                    className="bg-red-600/20 text-red-500 px-3 py-1 rounded-lg text-sm"
                  >
                    <Ban size={16} />
                  </button>
                  <button 
                    onClick={() => handleProcessOrder(order.id, true)}
                    className="bg-green-600/20 text-green-500 px-3 py-1 rounded-lg text-sm"
                  >
                    <Check size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {pendingOrders.length === 0 && <p className="text-neutral-500 text-center">No pending orders</p>}
        </div>
      )}
    </div>
  );
};

export default Admin;
