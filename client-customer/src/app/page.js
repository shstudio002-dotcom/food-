'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const categories = [
  { id: 'all', name: 'All Items', icon: '🌟' },
  
  { id: 'Breakfast', name: 'Breakfast', icon: '🥞' },
  { id: 'Veg', name: 'Veg', icon: '🥗' },
  { id: 'Non-Veg', name: 'Non-Veg', icon: '🍗' },
  { id: 'South', name: 'South', icon: '🍛' },
  { id: 'North', name: 'North', icon: '🍲' },
  { id: 'Chats', name: 'Chats', icon: '🍲' },
];

export default function Home() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [hotelsList, setHotelsList] = useState([]);
  const [foodItemsList, setFoodItemsList] = useState([]);
  const [cart, setCart] = useState({});
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 🔒 Security Check: Ensure user is logged in before showing the storefront
    const token = localStorage.getItem('shopmatries_token') || localStorage.getItem('shopmatries_admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    setIsAuthorized(true);

    // Fetch live restaurants from backend
    fetch('http://localhost:5000/api/restaurants')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHotelsList(data);
        } else {
          fetch('http://localhost:5000/api/foods/restaurants')
            .then(r => r.json())
            .then(hData => {
              if (Array.isArray(hData)) setHotelsList(hData);
            })
            .catch(() => {});
        }
      })
      .catch(err => {
        console.error('Failed to fetch restaurants:', err);
        fetch('http://localhost:5000/api/foods/restaurants')
          .then(r => r.json())
          .then(hData => {
            if (Array.isArray(hData)) setHotelsList(hData);
          })
          .catch(() => {});
      });

    // Fetch live food menu catalog from backend
    fetch('http://localhost:5000/api/foods')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setFoodItemsList(data);
      })
      .catch(err => console.error('Failed to fetch food catalog:', err));

    try {
      const savedCart = localStorage.getItem('shopmatries_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    }
  }, [router]);

  // Automatically hide or show bottom nav bar based on cart items
  useEffect(() => {
    const navBar = document.getElementById('bottom-nav-bar');
    const totalCount = Object.values(cart).reduce((a, b) => a + b, 0);
    if (navBar) {
      if (totalCount > 0) {
        navBar.style.transform = 'translateY(100%)';
        navBar.style.opacity = '0';
        navBar.style.pointerEvents = 'none';
      } else {
        navBar.style.transform = 'translateY(0%)';
        navBar.style.opacity = '1';
        navBar.style.pointerEvents = 'auto';
      }
    }
  }, [cart]);

  const updateCartStorage = (newCart) => {
    setCart(newCart);
    try {
      localStorage.setItem('shopmatries_cart', JSON.stringify(newCart));
    } catch (e) {
      console.error('Failed to save cart to storage', e);
    }
  };

  const handleAddToCart = (id) => {
    const stringId = String(id);
    const updated = {
      ...cart,
      [stringId]: (cart[stringId] || 0) + 1
    };
    updateCartStorage(updated);
  };

  const handleRemoveFromCart = (id) => {
    const stringId = String(id);
    const currentQty = cart[stringId] || 0;
    const updated = { ...cart };
    
    if (currentQty <= 1) {
      delete updated[stringId];
    } else {
      updated[stringId] = currentQty - 1;
    }
    updateCartStorage(updated);
  };

  const handleClearCart = () => {
    updateCartStorage({});
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
        <p className="text-xs font-bold text-slate-500 animate-pulse">🔒 Verifying secure session & redirecting to login...</p>
      </div>
    );
  }

  const totalItemsCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = foodItemsList.find(i => String(i._id || i.id) === String(id));
    return sum + (item ? item.price * qty : 0);
  }, 0);

  // Safe Filter Logic mapping restaurant names and food fields
  const filteredItems = foodItemsList.filter(item => {
    const hotelRefId = item.hotelId;
    const hotelNameField = item.hotelName || '';
    const itemName = item.englishName || item.name || item.dishName || '';
    const kannadaName = item.kannadaName || '';
    const query = searchQuery ? searchQuery.toLowerCase() : '';

    const matchesSearch = itemName.toLowerCase().includes(query) || kannadaName.toLowerCase().includes(query);
    
    if (selectedHotel) {
      const matchesHotelId = hotelRefId && String(hotelRefId) === String(selectedHotel._id || selectedHotel.id);
      const matchesHotelName = hotelNameField && selectedHotel.name && (hotelNameField.toLowerCase() === selectedHotel.name.toLowerCase());
      return (matchesHotelId || matchesHotelName) && matchesSearch;
    }

    const matchesCategory = selectedCategory === 'all' || item.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative pb-36 bg-white min-h-screen">
      
      {/* 1. TOP GREEN NOTIFICATION BAR */}
      <div className="bg-emerald-800 text-white text-[11px] px-3 py-2 flex justify-between items-center font-medium shadow-inner">
        <div className="flex items-center space-x-1.5 truncate">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="truncate">Get food in 30 mins • Under 30 min guarantee</span>
        </div>
        <div className="shrink-0 bg-emerald-900/80 px-2 py-0.5 rounded text-[10px] border border-emerald-700">
          📍 Shivamogga Hub
        </div>
      </div>

      {/* 2. STATIONARY HEADER, LOGO, QUICK MENU & OFFERS BANNER */}
      <div className="sticky top-0 bg-white z-30 px-4 pt-3 pb-2 space-y-2.5 border-b border-slate-100 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg className="w-7 h-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="14" rx="2" />
              <line x1="10" y1="10" x2="10" y2="20" />
              <line x1="2" y1="10" x2="22" y2="10" />
              <path d="M10 6V4a2 2 0 0 1 4 0v2" />
            </svg>
            <h1 className="text-lg font-black tracking-tight text-slate-900">
              Shop<span className="text-emerald-600">matries</span>
            </h1>
          </div>
          <button 
            onClick={() => router.push('/quick-menu')}
            className="border border-emerald-200 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-sm hover:bg-emerald-100 transition active:scale-95 cursor-pointer"
          >
            ⚡ Quick Menu
          </button>
        </div>

        {/* Offers Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-3 text-white shadow-md overflow-hidden flex justify-between items-center">
          <div className="z-10 space-y-0.5">
            <span className="bg-amber-400 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Offer</span>
            <h2 className="text-xs font-black tracking-tight">FLAT 50% OFF</h2>
            <p className="text-[10px] text-slate-300">On your first 3 food orders!</p>
          </div>
          <div className="z-10 text-right bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10">
            <p className="text-[8px] text-emerald-400 font-bold uppercase">Speed</p>
            <p className="text-xs font-black text-white">30 Min</p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedHotel(null);
              }}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border ${
                selectedCategory === cat.id && !selectedHotel
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. SCROLLABLE CONTENT AREA */}
      <div className="p-4 space-y-4">
        
        {/* Search Bar */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder={selectedHotel ? `Search in ${selectedHotel.name}...` : "Search for biryani, dosa, meals..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>

        {/* RESTAURANTS VIEW (When 'Restaurants' category is chosen) */}
        {selectedCategory === 'Hotels' && !selectedHotel ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-xs flex items-center space-x-1">
                <span>🏨</span>
                <span>Partner Restaurants (ಪಾಲುದಾರ ಹೋಟೆಲ್‌ಗಳು)</span>
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                {hotelsList.length} Open
              </span>
            </div>

            <div className="space-y-2.5">
              {hotelsList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-bold bg-slate-50 border border-slate-100 rounded-2xl">
                  No partner restaurants registered yet.
                </div>
              ) : (
                hotelsList.map((hotel) => {
                  const hotelId = hotel._id || hotel.id;
                  // Mapping exact fields from Restaurant schema: name, address, cuisine, image, isOpen
                  const cuisineList = Array.isArray(hotel.cuisine) ? hotel.cuisine.join(', ') : (hotel.cuisine || 'Multi-Cuisine');

                  return (
                    <div 
                      key={hotelId} 
                      onClick={() => setSelectedHotel(hotel)}
                      className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-3 shadow-sm flex items-center space-x-3 cursor-pointer transition active:scale-[0.99]"
                    >
                      {hotel.image ? (
                        <img src={hotel.image} alt={hotel.name} className="w-16 h-16 rounded-xl object-cover border border-slate-100" />
                      ) : (
                        <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl border border-emerald-100">🏨</div>
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-extrabold text-slate-900 text-xs">{hotel.name}</h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${hotel.isOpen !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {hotel.isOpen !== false ? '🟢 Open' : '🔴 Closed'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">📍 {hotel.address}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">🍴 {cuisineList}</p>
                        <p className="text-[9px] text-emerald-600 font-bold mt-1">Tap to view restaurant menu ➔</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* FOOD ITEMS GRID VIEW */
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xs flex items-center space-x-1">
                  <span>🍔</span>
                  <span>{selectedHotel ? `${selectedHotel.name} Menu` : 'Food Catalog (ಆಹಾರ ಪದಾರ್ಥಗಳು)'}</span>
                </h3>
                {selectedHotel && (
                  <button 
                    onClick={() => setSelectedHotel(null)} 
                    className="text-[10px] text-emerald-600 font-bold hover:underline mt-0.5 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>← Back to all restaurants</span>
                  </button>
                )}
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                {filteredItems.length} Dishes
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {filteredItems.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-400 text-xs font-bold bg-slate-50 border border-slate-100 rounded-2xl">
                  {selectedHotel ? `No dishes found for ${selectedHotel.name}.` : 'No food dishes found in this category.'}
                </div>
              ) : (
                filteredItems.map((item) => {
                  const itemId = item._id || item.id;
                  const qty = cart[itemId] || 0;
                  
                  const displayName = item.englishName || item.name || item.dishName || 'Food Item';
                  const displayKannada = item.kannadaName || '';

                  return (
                    <div key={itemId} className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-sm flex flex-col justify-between transition hover:shadow-md">
                      <div>
                        <div className="relative h-20 rounded-xl overflow-hidden mb-1.5 bg-slate-100 border border-slate-100">
                          {item.image ? (
                            <img src={item.image} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl bg-slate-100">🍲</div>
                          )}
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-[11px] line-clamp-1">
                          {displayName}
                        </h4>
                        {displayKannada && (
                          <p className="text-[9px] text-slate-400 font-medium truncate">
                            {displayKannada}
                          </p>
                        )}
                        
                        <p className="text-[9px] text-emerald-700 font-bold truncate mt-0.5">
                          🏨 {item.hotelName || 'Partner Restaurant'}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-slate-900 text-xs">₹{item.price}</span>
                          <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-semibold">Base</span>
                        </div>

                        {qty === 0 ? (
                          <button
                            onClick={() => handleAddToCart(itemId)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-1.5 rounded-lg transition shadow-sm active:scale-95 cursor-pointer"
                          >
                            + Add
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-emerald-600 text-white rounded-lg px-1.5 py-1 shadow-sm">
                            <button 
                              onClick={() => handleRemoveFromCart(itemId)}
                              className="w-5 h-5 flex items-center justify-center font-black text-xs hover:bg-emerald-700 rounded transition cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-[10px] font-extrabold px-1">{qty}</span>
                            <button 
                              onClick={() => handleAddToCart(itemId)}
                              className="w-5 h-5 flex items-center justify-center font-black text-xs hover:bg-emerald-700 rounded transition cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>

      {/* 4. FLOATING CHECKOUT BAR */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-[390px] bg-slate-950 text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between z-50 border border-slate-800 animate-slideUp">
          <div className="flex items-center space-x-2.5">
            <div className="bg-emerald-600 text-white w-8 h-8 rounded-xl flex items-center justify-center shadow font-black text-xs">
              {totalItemsCount}
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">TOTAL AMOUNT</p>
              <p className="text-sm font-black text-white">₹{totalPrice}</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleClearCart}
              title="Clear Cart"
              className="bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-white p-2 rounded-xl transition border border-slate-700 text-xs cursor-pointer"
            >
              🗑️
            </button>

            <button
              onClick={() => router.push('/cart')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-3 py-2.5 rounded-xl transition shadow-md flex items-center space-x-1 active:scale-95 cursor-pointer"
            >
              <span>View Cart & Checkout</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}