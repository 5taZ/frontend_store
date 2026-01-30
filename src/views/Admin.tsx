import React, { useState, useEffect } from 'react';
import { Plus, X, Info, Package, ClipboardList, Check, Ban, CheckCircle, AlertCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
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
  
  // Filter only pending orders for the main view
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING);

  // New Product Form State
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    image: '',
    category: '',
    description: '',
    inStock: true,
  });

  // Clear notification automatically
  useEffect(() => {
    if (notification) {
        const timer = setTimeout(() => setNotification(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;

    addProduct({
        id: Date.now().toString(),
        name: newItem.name,
        price: Number(newItem.price),
        image: newItem.image || 'https://picsum.photos/400/400',
        category: newItem.category || 'General',
        description: newItem.description || 'No description',
        inStock: newItem.inStock
    });

    setNewItem({ name: '', price: '', image: '', category: '', description: '', inStock: true });
    setIsAdding(false);
    setNotification({ message: 'Item added to inventory successfully', type: 'success' });
  };

  const handleProcessOrder = (orderId: string, approved: boolean, items: any[]) => {
    processOrder(orderId, approved);
    if (approved) {
        setNotification({
            message: `Order confirmed! ${items.length} items removed from inventory.`,
            type: 'success'
        });
    } else {
        setNotification({
            message: 'Order rejected and cancelled.',
            type: 'error'
        });
    }
  };

  const renderInventory = () => (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-xl font-bold text-white">Inventory Management</h2>
            <p className="text-xs text-neutral-400 mt-1">Manage stock and add items</p>
        </div>
        <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors shadow-lg shadow-red-600/20"
        >
            {isAdding ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {isAdding && (
        <div className="bg-neutral-900 p-5 rounded-2xl border border-red-600/30 animate-fade-in shadow-xl mb-6">
            <h3 className="text-lg font-bold text-white mb-4">Add New Item</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
                <input 
                    type="text" 
                    placeholder="Product Name"
                    className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-red-600 outline-none"
                    value={newItem.name}
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                    required
                />
                <div className="flex gap-3">
                    <input 
                        type="number" 
                        placeholder="Price (₽)"
                        className="w-1/2 bg-black border border-neutral-800 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-red-600 outline-none"
                        value={newItem.price}
                        onChange={e => setNewItem({...newItem, price: e.target.value})}
                        required
                    />
                    <input 
                        type="text" 
                        placeholder="Category"
                        className="w-1/2 bg-black border border-neutral-800 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-red-600 outline-none"
                        value={newItem.category}
                        onChange={e => setNewItem({...newItem, category: e.target.value})}
                    />
                </div>
                <input 
                    type="url" 
                    placeholder="Image URL"
                    className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-red-600 outline-none"
                    value={newItem.image}
                    onChange={e => setNewItem({...newItem, image: e.target.value})}
                />
                <textarea 
                    placeholder="Description"
                    className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-red-600 outline-none h-20"
                    value={newItem.description}
                    onChange={e => setNewItem({...newItem, description: e.target.value})}
                />
                
                <div className="flex items-center space-x-2 py-2">
                    <input 
                        type="checkbox"
                        id="inStock"
                        checked={newItem.inStock}
                        onChange={e => setNewItem({...newItem, inStock: e.target.checked})}
                        className="w-5 h-5 rounded border-neutral-700 bg-neutral-900 text-red-600 focus:ring-red-600"
                    />
                    <label htmlFor="inStock" className="text-sm text-neutral-300">Available in Stock</label>
                </div>

                <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20">
                    Add Product
                </button>
            </form>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 pb-20">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isAdminView={true}
          />
        ))}
        {products.length === 0 && (
            <div className="col-span-2 text-center text-neutral-500 py-10">
                No items in inventory. Add some!
            </div>
        )}
      </div>
    </>
  );

  const renderOrders = () => (
    <div className="space-y-4 pb-20">
        <h2 className="text-xl font-bold text-white mb-4">Incoming Orders ({pendingOrders.length})</h2>
        {pendingOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-neutral-500 bg-neutral-900/50 rounded-2xl border border-neutral-800 border-dashed">
                <ClipboardList size={48} className="mb-2 opacity-50" />
                <p>No pending orders</p>
            </div>
        ) : (
            pendingOrders.map(order => (
                <div key={order.id} className="bg-neutral-900 rounded-xl border border-neutral-800 p-4 shadow-sm transition-all">
                    <div className="flex justify-between items-start mb-3 border-b border-neutral-800 pb-3">
                        <div>
                            <p className="text-xs text-neutral-400">Order ID: #{order.id.slice(-6)}</p>
                            <p className="text-white font-bold">@{order.username}</p>
                        </div>
                        <span className="bg-yellow-900/30 text-yellow-500 text-[10px] font-bold px-2 py-1 rounded border border-yellow-900/50">PENDING</span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-white truncate pr-2 flex-1">{item.name} <span className="text-neutral-500">x{item.quantity}</span></span>
                                <span className="text-neutral-300">{item.price.toLocaleString()} ₽</span>
                            </div>
                        ))}
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-neutral-400 text-sm">Total</span>
                        <span className="text-xl font-bold text-white">{order.totalAmount.toLocaleString()} ₽</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => handleProcessOrder(order.id, false, order.items)}
                            className="bg-red-600/10 hover:bg-red-600/20 text-red-500 py-2 rounded-lg flex items-center justify-center space-x-1 transition-colors border border-red-600/20"
                        >
                            <Ban size={16} />
                            <span>Reject</span>
                        </button>
                        <button 
                            onClick={() => handleProcessOrder(order.id, true, order.items)}
                            className="bg-white hover:bg-neutral-200 text-black font-bold py-2 rounded-lg flex items-center justify-center space-x-1 transition-colors shadow-sm"
                        >
                            <Check size={16} />
                            <span>Confirm</span>
                        </button>
                    </div>
                </div>
            ))
        )}
    </div>
  );

  return (
    <div className="p-4 pt-6 space-y-4 relative min-h-screen">
       {/* Notification Toast */}
       {notification && (
            <div className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center space-x-3 transform transition-all duration-300 ${
                notification.type === 'success' ? 'bg-white text-black border-l-4 border-green-500' : 'bg-white text-black border-l-4 border-red-500'
            }`}>
                {notification.type === 'success' ? <CheckCircle size={24} className="text-green-500" /> : <AlertCircle size={24} className="text-red-500" />}
                <div>
                    <p className="font-bold text-sm">{notification.type === 'success' ? 'Success' : 'Rejected'}</p>
                    <p className="text-xs opacity-70">{notification.message}</p>
                </div>
            </div>
        )}

      {/* Tabs */}
      <div className="flex bg-neutral-900 p-1 rounded-xl mb-4 border border-neutral-800">
        <button 
            onClick={() => setActiveTab(AdminTab.ORDERS)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === AdminTab.ORDERS ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
            <ClipboardList size={16} />
            Orders
            {pendingOrders.length > 0 && (
                <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingOrders.length}</span>
            )}
        </button>
        <button 
            onClick={() => setActiveTab(AdminTab.INVENTORY)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === AdminTab.INVENTORY ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
            <Package size={16} />
            Inventory
        </button>
      </div>

      {activeTab === AdminTab.ORDERS ? renderOrders() : renderInventory()}
    </div>
  );
};

export default Admin;