'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const quickCategories = [
  { id: 'all', name: 'All Quick', icon: '⚡' },
  { id: 'Breakfast', name: 'Tiffins', icon: '🥞' },
  { id: 'Veg', name: 'Meals', icon: '🍛' },
  { id: 'Fast Food', name: 'Fast Food', icon: '🍔' },
];

export default function QuickMenuPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [quickCatalog, setQuickCatalog] = useState([]);
  const [cart, setCart] = useState({});

  useEffect(() => {
    // Fetch live food catalog from backend
    fetch('http://localhost:5000/api/foods')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setQuickCatalog(data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch quick menu catalog:', err);
        setQuickCatalog([]);
      });

    try {
      const savedCart = localStorage.getItem('shopmatries_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const updateCart = (id, delta) => {
    const current = cart[id] || 0;
    const updated = { ...cart };
    const newQty = current + delta;
    if (newQty > 0) {
      updated[id] = newQty;
    } else {
      delete updated[id];
    }
    setCart(updated);
    localStorage.setItem('shopmatries_cart', JSON.stringify(updated));
  };

  const totalCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalAmount = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = quickCatalog.find(i => (i._id || i.id) === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const displayedItems = activeTab === 'all' 
    ? quickCatalog 
    : quickCatalog.filter(i => i.category?.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="relative pb-36 bg-white min-h-screen p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-3">
        <div>
          <h1 className="text-base font-black text-slate-900">⚡ Quick Menu Catalog</h1>
          <p className="text-[10px] text-slate-500">Express delivery items ready in 10-15 mins</p>
        </div>
        <button 
          onClick={() => router.push('/')}
          className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-xl"
        >
          ← Home
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {quickCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 border ${
              activeTab === cat.id ? 'bg-emerald-600 text-white border-emerald-600 shadow' : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {displayedItems.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-400 text-xs font-bold">
            No items available in this category yet.
          </div>
        ) : (
          displayedItems.map(item => {
            const itemId = item._id || item.id;
            const qty = cart[itemId] || 0;
            return (
              <div key={itemId} className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="relative h-20 rounded-xl overflow-hidden mb-1.5 bg-slate-100">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl bg-slate-100">🍲</div>
                    )}
                    <span className="absolute top-1 right-1 bg-black/70 text-white text-[8px] font-bold px-1 rounded">⭐ {item.rating || '4.8'}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-[11px] line-clamp-1">{item.name}</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">⏱️ {item.time || '15 mins'}</p>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-black text-slate-900 text-xs">₹{item.price}</span>
                  {qty === 0 ? (
                    <button
                      onClick={() => updateCart(itemId, 1)}
                      className="bg-emerald-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg active:scale-95"
                    >
                      + Add
                    </button>
                  ) : (
                    <div className="flex items-center space-x-1.5 bg-emerald-600 text-white rounded-lg px-2 py-1">
                      <button onClick={() => updateCart(itemId, -1)} className="font-bold text-xs">-</button>
                      <span className="text-[10px] font-extrabold">{qty}</span>
                      <button onClick={() => updateCart(itemId, 1)} className="font-bold text-xs">+</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Checkout Bar */}
      {totalCount > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[92%] max-w-[390px] bg-slate-950 text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between z-50 border border-slate-800">
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Total ({totalCount} items)</p>
            <p className="text-sm font-black text-white">₹{totalAmount}</p>
          </div>
          <button
            onClick={() => router.push('/cart')}
            className="bg-emerald-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow active:scale-95"
          >
            Checkout ➔
          </button>
        </div>
      )}
    </div>
  );
}