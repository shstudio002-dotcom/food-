'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QuickMenuPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('custom');
  const [customItems, setCustomItems] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Breakfast',
    notes: ''
  });
  const [cateringForm, setCateringForm] = useState({
    name: '',
    phone: '',
    guests: '50',
    date: '',
    menuType: 'South Indian Feast'
  });
  const [cart, setCart] = useState({});
  const [message, setMessage] = useState('');
  const [userPhone, setUserPhone] = useState('default_user');

  useEffect(() => {
    const phone = localStorage.getItem('shopmatries_phone') || 'default_user';
    setUserPhone(phone);

    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      'https://food-cgs4.onrender.com';

    fetch(`${API_URL}/api/custom-menu`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCustomItems(data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch custom menu from backend:', err);
      });

    try {
      const savedCart = localStorage.getItem(`shopmatries_cart_${phone}`) || localStorage.getItem('shopmatries_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) {
      console.error('Failed to load user cart', e);
    }
  }, []);

  const updateCartStorage = (newCart) => {
    setCart(newCart);
    try {
      localStorage.setItem(`shopmatries_cart_${userPhone}`, JSON.stringify(newCart));
      localStorage.setItem('shopmatries_cart', JSON.stringify(newCart));
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
      userPhone: userPhone,
      isCustom: true
    };

    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      'https://food-cgs4.onrender.com';

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

  const handleCateringSubmit = (e) => {
    e.preventDefault();
    alert(`🎉 Catering Inquiry Received for ${cateringForm.guests} guests on ${cateringForm.date}! Our event manager will call you shortly.`);
    router.push('/');
  };

  const handleAddToCart = (item) => {
    const itemId = String(item._id || item.id);
    const updatedCart = {
      ...cart,
      [itemId]: (cart[itemId] || 0) + 1
    };

    updateCartStorage(updatedCart);

    try {
      const allCustomDetails = JSON.parse(
        localStorage.getItem(`shopmatries_custom_details_${userPhone}`) || '{}'
      );
      allCustomDetails[itemId] = item;
      localStorage.setItem(`shopmatries_custom_details_${userPhone}`, JSON.stringify(allCustomDetails));
    } catch (e) {}

    setMessage(`🛒 Added "${item.name}" to cart!`);
    setTimeout(() => setMessage(''), 2500);
  };

  const handleDeleteCustomItem = (id) => {
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      'https://food-cgs4.onrender.com';

    fetch(`${API_URL}/api/custom-menu/${id}`, {
      method: 'DELETE'
    })
      .then(() => {
        setCustomItems(prev => prev.filter(i => (i._id || i.id) !== id));
        setMessage('🗑️ Custom item removed from server database.');
        setTimeout(() => setMessage(''), 3000);
      })
      .catch(() => {
        setCustomItems(prev => prev.filter(i => (i._id || i.id) !== id));
      });
  };

  const totalItemsCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const userCustomItems = customItems.filter(item => !item.userPhone || item.userPhone === userPhone);

  return (
    <div className="relative pb-28 bg-white min-h-screen p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-orange-100 pb-3">
        <button
          onClick={() => router.push('/')}
          className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-200 hover:bg-orange-100 transition cursor-pointer"
        >
          ← Back to Store
        </button>
        <h1 className="text-xs font-black text-slate-900 uppercase tracking-wider">
          ⚡ Quick Menu & Catering
        </h1>
      </div>

      {message && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold p-3 rounded-2xl text-center shadow-sm">
          {message}
        </div>
      )}

      {/* Navigation Tabs for Quick Menu vs Catering */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setActiveTab('custom')}
          className={`py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
            activeTab === 'custom'
              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow'
              : 'bg-orange-50 text-slate-700 border border-orange-100'
          }`}
        >
          ✍️ Write Custom Dish
        </button>
        <button
          onClick={() => setActiveTab('catering')}
          className={`py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
            activeTab === 'catering'
              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow'
              : 'bg-orange-50 text-slate-700 border border-orange-100'
          }`}
        >
          🍽️ Event Catering
        </button>
      </div>

      {activeTab === 'custom' ? (
        <>
          <form
            onSubmit={handleAddCustomItem}
            className="bg-white border border-orange-100 p-4 rounded-3xl shadow-sm space-y-3"
          >
            <div>
              <h2 className="text-xs font-black text-slate-950">
                Write Your Own Dish (ನಿಮ್ಮ ಸ್ವಂತ ಆಹಾರ ಬರೆಯಿರಿ)
              </h2>
              <p className="text-[10px] text-slate-500">
                Type in any dish or item you want to order without worrying about prices.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">
                Dish / Item Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Special Ghee Rava Dosa"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-orange-50/50 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-orange-50/50 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500"
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
              <label className="text-[10px] font-bold text-slate-600 uppercase">
                Special Instructions / Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Hotel Name, Extra spicy"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-orange-50/50 border border-orange-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-xs font-black py-3 rounded-xl shadow-lg shadow-orange-500/20 transition active:scale-95 cursor-pointer"
            >
              + Add to My Quick Menu ⚡
            </button>
          </form>

          <div className="space-y-2.5 pt-2">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Your Custom Written Items ({userCustomItems.length})
            </h3>

            {userCustomItems.length === 0 ? (
              <div className="bg-orange-50/50 border border-orange-100 p-6 rounded-2xl text-center space-y-1">
                <p className="text-xl">🍲</p>
                <p className="text-xs font-bold text-slate-600">No custom items written yet.</p>
              </div>
            ) : (
              userCustomItems.map((item) => {
                const itemId = item._id || item.id;
                const qty = cart[itemId] || 0;

                return (
                  <div
                    key={itemId}
                    className="bg-white border border-orange-100 p-3.5 rounded-2xl shadow-sm flex justify-between items-center transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-slate-900">{item.name}</span>
                        <span className="text-[9px] bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-bold">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">📝 {item.notes}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDeleteCustomItem(itemId)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 p-2 rounded-xl text-xs transition cursor-pointer"
                      >
                        🗑️
                      </button>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] px-3 py-2 rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
                      >
                        {qty > 0 ? `Added (${qty})` : '+ Add to Cart'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <form
          onSubmit={handleCateringSubmit}
          className="bg-white border border-orange-100 p-4 rounded-3xl shadow-sm space-y-3"
        >
          <div>
            <h2 className="text-xs font-black text-slate-950">
              🍽️ Bulk Event Catering Booking
            </h2>
            <p className="text-[10px] text-slate-500">
              Professional catering services for weddings, parties, and gatherings.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase">Organizer Name *</label>
            <input
              type="text"
              required
              placeholder="Full Name"
              value={cateringForm.name}
              onChange={(e) => setCateringForm({ ...cateringForm, name: e.target.value })}
              className="w-full bg-orange-50/50 border border-orange-200 text-xs rounded-xl p-3 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase">Contact Phone *</label>
            <input
              type="tel"
              required
              placeholder="9108626303"
              value={cateringForm.phone}
              onChange={(e) => setCateringForm({ ...cateringForm, phone: e.target.value })}
              className="w-full bg-orange-50/50 border border-orange-200 text-xs rounded-xl p-3 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Guests Count *</label>
              <input
                type="number"
                required
                value={cateringForm.guests}
                onChange={(e) => setCateringForm({ ...cateringForm, guests: e.target.value })}
                className="w-full bg-orange-50/50 border border-orange-200 text-xs rounded-xl p-3 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Event Date *</label>
              <input
                type="date"
                required
                value={cateringForm.date}
                onChange={(e) => setCateringForm({ ...cateringForm, date: e.target.value })}
                className="w-full bg-orange-50/50 border border-orange-200 text-xs rounded-xl p-3 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-xs font-black py-3 rounded-xl shadow-lg transition cursor-pointer"
          >
            Submit Catering Inquiry 🚀
          </button>
        </form>
      )}

      {totalItemsCount > 0 && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-[390px] bg-slate-950 text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between z-50 border border-orange-900">
          <div className="flex items-center space-x-2">
            <span className="bg-orange-500 text-white w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs">
              {totalItemsCount}
            </span>
            <span className="text-xs font-bold text-white">Items in Cart</span>
          </div>
          <button
            onClick={() => router.push('/cart')}
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-extrabold text-[11px] px-3.5 py-2 rounded-xl transition shadow-md cursor-pointer"
          >
            Go to Checkout ➔
          </button>
        </div>
      )}
    </div>
  );
}