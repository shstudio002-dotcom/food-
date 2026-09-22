'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QuickMenuPage() {
  const router = useRouter();
  const [customItems, setCustomItems] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Breakfast',
    notes: ''
  });
  const [cart, setCart] = useState({});
  const [message, setMessage] = useState('');
  const [userPhone, setUserPhone] = useState('default_user');

  // Load user-specific storage keys on mount
  useEffect(() => {
    const phone = localStorage.getItem('shopmatries_phone') || 'default_user';
    setUserPhone(phone);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-ohea.onrender.com';

    // Fetch custom menu items from backend
    fetch(`${API_URL}/api/custom-menu`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Filter items belonging to this specific user if stored by phone, or show global custom items
          setCustomItems(data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch custom menu from backend:', err);
      });

    // Load isolated cart for this specific user
    try {
      const savedCart = localStorage.getItem(`shopmatries_cart_${phone}`);
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) {
      console.error('Failed to load user cart', e);
    }
  }, []);

  const updateCartStorage = (newCart) => {
    setCart(newCart);
    try {
      localStorage.setItem(`shopmatries_cart_${userPhone}`, JSON.stringify(newCart));
    } catch (e) {
      console.error('Failed to save user cart', e);
    }
  };

  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    const payload = {
      name: formData.name,
      category: formData.category,
      price: 0,
      notes: formData.notes || 'Custom requested item',
      userPhone: userPhone, // Tag item with user's phone for isolation
      isCustom: true
    };

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-ohea.onrender.com';

    fetch(`${API_URL}/api/custom-menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        const savedItem = data.item || data;
        setCustomItems(prev => [savedItem, ...prev]);
        setMessage('✅ Successfully added to your Quick Menu database!');
        setFormData({ name: '', category: 'Breakfast', notes: '' });
        setTimeout(() => setMessage(''), 3000);
      })
      .catch((err) => {
        console.error('Failed to save custom menu item on backend:', err);
        setMessage('❌ Failed to save item to server.');
        setTimeout(() => setMessage(''), 3000);
      });
  };

  const handleAddToCart = (item) => {
    const itemId = String(item._id || item.id);
    const updatedCart = {
      ...cart,
      [itemId]: (cart[itemId] || 0) + 1
    };
    updateCartStorage(updatedCart);

    try {
      const allCustomDetails = JSON.parse(localStorage.getItem(`shopmatries_custom_details_${userPhone}`) || '{}');
      allCustomDetails[itemId] = item;
      localStorage.setItem(`shopmatries_custom_details_${userPhone}`, JSON.stringify(allCustomDetails));
    } catch (e) {}

    setMessage(`🛒 Added "${item.name}" to cart!`);
    setTimeout(() => setMessage(''), 2500);
  };

  const handleDeleteCustomItem = (id) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-ohea.onrender.com';

    fetch(`${API_URL}/api/custom-menu/${id}`, {
      method: 'DELETE'
    })
      .then(() => {
        setCustomItems(prev => prev.filter(i => (i._id || i.id) !== id));
        setMessage('🗑️ Custom item removed from server database.');
        setTimeout(() => setMessage(''), 3000);
      })
      .catch((err) => {
        console.error('Failed to delete custom item:', err);
        setCustomItems(prev => prev.filter(i => (i._id || i.id) !== id));
      });
  };

  const totalItemsCount = Object.values(cart).reduce((a, b) => a + b, 0);

  // Filter custom items belonging strictly to this logged-in user phone
  const userCustomItems = customItems.filter(item => !item.userPhone || item.userPhone === userPhone);

  return (
    <div className="relative pb-28 bg-white min-h-screen p-4 space-y-4">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <button 
          onClick={() => router.push('/')}
          className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition"
        >
          ← Back to Store
        </button>
        <h1 className="text-xs font-black text-slate-900 uppercase tracking-wider">⚡ Quick Custom Menu</h1>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold p-3 rounded-2xl text-center shadow-sm">
          {message}
        </div>
      )}

      {/* Write Your Own Menu Form */}
      <form onSubmit={handleAddCustomItem} className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm space-y-3">
        <div>
          <h2 className="text-xs font-black text-slate-950">Write Your Own Dish (ನಿಮ್ಮ ಸ್ವಂತ ಆಹಾರ ಬರೆಯಿರಿ)</h2>
          <p className="text-[10px] text-slate-500">Type in any dish or item you want to order without worrying about prices.</p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600 uppercase">Dish / Item Name *</label>
          <input 
            type="text"
            placeholder="e.g. Special Ghee Rava Dosa or Special Curry"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600 uppercase">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
          >
            <option value="Breakfast">Breakfast</option>
            <option value="Veg">Veg</option>
            <option value="Non-Veg">Non-Veg</option>
            <option value="Snacks">Snacks</option>
            <option value="Beverages">Beverages</option>
            <option value="Desserts">Desserts</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600 uppercase">Special Instructions / Notes</label>
          <input 
            type="text"
            placeholder="e.g. Hotel Name, Extra spicy, less oil"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button 
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition active:scale-95"
        >
          + Add to My Quick Menu ⚡
        </button>
      </form>

      {/* Custom Menu Items List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Your Custom Written Items ({userCustomItems.length})</h3>
        
        {userCustomItems.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl text-center space-y-1">
            <p className="text-xl">🍲</p>
            <p className="text-xs font-bold text-slate-600">No custom items written yet.</p>
            <p className="text-[10px] text-slate-400">Use the form above to add your own dishes.</p>
          </div>
        ) : (
          userCustomItems.map((item) => {
            const itemId = item._id || item.id;
            const qty = cart[itemId] || 0;
            return (
              <div key={itemId} className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-slate-900">{item.name}</span>
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">📝 {item.notes}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleDeleteCustomItem(itemId)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 p-2 rounded-xl text-xs transition"
                    title="Delete"
                  >
                    🗑️
                  </button>

                  <button 
                    onClick={() => handleAddToCart(item)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3 py-2 rounded-xl shadow-sm transition active:scale-95"
                  >
                    {qty > 0 ? `Added (${qty})` : '+ Add to Cart'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Checkout Button if items in cart */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-[390px] bg-slate-950 text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between z-50 border border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-600 text-white w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs">
              {totalItemsCount}
            </span>
            <span className="text-xs font-bold text-white">Items in Cart</span>
          </div>
          <button
            onClick={() => router.push('/cart')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] px-3.5 py-2 rounded-xl transition shadow-md"
          >
            Go to Checkout ➔
          </button>
        </div>
      )}

    </div>
  );
}