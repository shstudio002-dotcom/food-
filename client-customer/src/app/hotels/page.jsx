'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerHotelsPage() {
  const [hotels, setHotels] = useState({});
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-ohea.onrender.com';

    fetch(`${API_URL}/api/foods`) // Assumes your food items endpoint
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Group food dishes by hotel name
          const grouped = data.reduce((acc, item) => {
            const hotelName = item.hotelName || item.restaurant || 'Featured Restaurant';
            if (!acc[hotelName]) acc[hotelName] = [];
            acc[hotelName].push(item);
            return acc;
          }, {});
          setHotels(grouped);
        }
      })
      .catch(err => console.error('Failed to load menu items:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="p-4 space-y-6 pb-28 bg-white min-h-screen">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-lg font-black text-slate-900">🏨 Partner Hotels & Eateries</h1>
          <p className="text-xs text-slate-500">Explore dishes curated directly from local kitchens.</p>
        </div>
        <button 
          onClick={() => router.push('/')}
          className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-200 transition cursor-pointer"
        >
          ← Back Home
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs font-bold text-slate-400">Loading nearby hotels & menus...</div>
      ) : Object.keys(hotels).length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl text-center space-y-2">
          <p className="text-2xl">🍽️</p>
          <p className="text-xs font-bold text-slate-700">No partner hotels available right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(hotels).map(([hotelName, foods]) => (
            <div key={hotelName} className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
              
              {/* Hotel Banner Header */}
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setSelectedHotel(selectedHotel === hotelName ? null : hotelName)}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-lg border border-emerald-100 shadow-inner">
                    🏨
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">{hotelName}</h2>
                    <p className="text-[11px] text-emerald-600 font-bold">{foods.length} items available • Tap to view menu</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {selectedHotel === hotelName ? '▲ Hide' : '▼ View Menu'}
                </span>
              </div>

              {/* Expandable Food Menu for this Specific Hotel */}
              {selectedHotel === hotelName && (
                <div className="space-y-2 pt-3 border-t border-slate-100 animate-fadeIn">
                  {foods.map((food, idx) => (
                    <div key={food._id || idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900">{food.name || food.englishName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">₹{food.price || food.basePrice}</p>
                      </div>
                      <button 
                        onClick={() => {
                          // Optional: Add to cart logic directly from hotel view
                          alert(`Added ${food.name} to cart!`);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow transition cursor-pointer active:scale-95"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>
          ))}
        </div>
      )}

    </main>
  );
}