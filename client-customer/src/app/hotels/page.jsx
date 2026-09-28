'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerHotelsPage() {
  const [hotels, setHotels] = useState({});
  const [hotelImages, setHotelImages] = useState({});
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

    fetch(`${API_URL}/api/foods`) // Assumes your food items endpoint
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Group food dishes by hotel name and capture hotel images
          const grouped = {};
          const images = {};

          data.forEach(item => {
            const hotelName = item.hotelName || item.restaurant || 'Featured Restaurant';
            if (!grouped[hotelName]) grouped[hotelName] = [];
            grouped[hotelName].push(item);

            // Capture hotel logo/image if present
            if (item.hotelImage || item.restaurantImage) {
              images[hotelName] = item.hotelImage || item.restaurantImage;
            }
          });

          setHotels(grouped);
          setHotelImages(images);
        }
      })
      .catch(err => console.error('Failed to load menu items:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="p-4 space-y-6 pb-28 bg-white min-h-screen">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-orange-100 pb-4">
        <div>
          <h1 className="text-lg font-black text-slate-900">🏨 Partner Hotels & Eateries</h1>
          <p className="text-xs text-slate-500">Explore dishes curated directly from local kitchens.</p>
        </div>
        <button 
          onClick={() => router.push('/')}
          className="text-xs font-bold bg-orange-50 text-orange-700 px-3 py-1.5 rounded-xl hover:bg-orange-100 transition cursor-pointer border border-orange-200"
        >
          ← Back Home
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs font-bold text-orange-500 animate-pulse">Loading nearby hotels & menus...</div>
      ) : Object.keys(hotels).length === 0 ? (
        <div className="bg-orange-50/50 border border-orange-200 p-8 rounded-3xl text-center space-y-2">
          <p className="text-2xl">🍽️</p>
          <p className="text-xs font-bold text-slate-700">No partner hotels available right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(hotels).map(([hotelName, foods]) => {
            const storeImg = hotelImages[hotelName];

            return (
              <div key={hotelName} className="bg-white border border-orange-200 rounded-3xl p-4 shadow-sm space-y-3">
                
                {/* Hotel Banner Header */}
                <div className="flex justify-between items-center cursor-pointer" onClick={() => setSelectedHotel(selectedHotel === hotelName ? null : hotelName)}>
                  <div className="flex items-center space-x-3">
                    {storeImg ? (
                      <img src={storeImg} alt={hotelName} className="w-12 h-12 rounded-2xl object-cover border border-orange-200 shadow-inner" />
                    ) : (
                      <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center font-black text-lg border border-orange-200 shadow-inner">
                        🏨
                      </div>
                    )}
                    <div>
                      <h2 className="text-sm font-black text-slate-900">{hotelName}</h2>
                      <p className="text-[11px] text-orange-600 font-bold">{foods.length} items available • Tap to view menu</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {selectedHotel === hotelName ? '▲ Hide' : '▼ View Menu'}
                  </span>
                </div>

                {/* Expandable Food Menu for this Specific Hotel */}
                {selectedHotel === hotelName && (
                  <div className="space-y-2 pt-3 border-t border-orange-100 animate-fadeIn">
                    {foods.map((food, idx) => (
                      <div key={food._id || idx} className="flex justify-between items-center bg-orange-50/40 p-3 rounded-2xl border border-orange-100">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-900">{food.name || food.englishName}</p>
                          <p className="text-[10px] text-orange-600 font-mono font-bold">₹{food.price || food.basePrice}</p>
                        </div>
                        <button 
                          onClick={() => {
                            alert(`Added ${food.name || food.englishName} to cart!`);
                          }}
                          className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow transition cursor-pointer active:scale-95"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </main>
  );
}