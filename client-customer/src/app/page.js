'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import buyBriggLogo from './images/buybrigg-logo.png';

const categories = [
  { id: 'all', name: 'All Items', icon: '🌟' },
  { id: 'Hotels', name: 'Hotels', icon: '🏨' },
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
  const [restaurantDetailsMap, setRestaurantDetailsMap] = useState({});
  const [bannerData, setBannerData] = useState({
    title: '',
    subtitle: '',
    Delivery: '',
    deliveryFee: '',
    bgMedia: '',
    mediaType: '',
  });
  const [promoBanner, setPromoBanner] = useState(null);
  const [cart, setCart] = useState({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [userLocationName, setUserLocationName] = useState('Shivamogga Hub');

  // Helper function to dynamically check if a restaurant is open based strictly on database/admin settings
  const checkIfStoreIsOpen = (hotelObj) => {
    if (!hotelObj) return false;
    
    if (hotelObj.autoMode === false || hotelObj.manualOverride === true) {
      return hotelObj.isManuallyOpen ?? false;
    }
    if (!hotelObj.operatingHours) return false;

    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = days[now.getDay()];
    
    const todaySchedule = hotelObj.operatingHours[currentDayName];
    if (!todaySchedule || todaySchedule.closed) return false;

    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = (todaySchedule.open || '08:00').split(':').map(Number);
    const [closeHour, closeMin] = (todaySchedule.close || '22:00').split(':').map(Number);
    
    const openTimeMinutes = openHour * 60 + openMin;
    const closeTimeMinutes = closeHour * 60 + closeMin;

    return currentTimeMinutes >= openTimeMinutes && currentTimeMinutes <= closeTimeMinutes;
  };

  // Helper to show today's weekday timings strictly from database/admin settings (no fake defaults)
  const getTodayTimingString = (hotelObj) => {
    if (!hotelObj || !hotelObj.operatingHours) return 'Timings not set';
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = days[now.getDay()];
    const todaySchedule = hotelObj.operatingHours[currentDayName];
    
    if (!todaySchedule || todaySchedule.closed) return 'Closed Today';
    return `${todaySchedule.open} - ${todaySchedule.close}`;
  };

  // Strict database record lookup without fake default hours
  const getDbHotelRecord = (name, detailsMap, fallbackObj) => {
    if (!name) return fallbackObj;
    const cleanKey = name.toLowerCase().trim();
    if (detailsMap[cleanKey]) return detailsMap[cleanKey];

    const matchedKey = Object.keys(detailsMap).find(
      k => k.includes(cleanKey) || cleanKey.includes(k)
    );
    
    return matchedKey ? detailsMap[matchedKey] : fallbackObj;
  };

  useEffect(() => {
    const savedLat = localStorage.getItem('shopmatries_lat');
    if (!savedLat) {
      setShowLocationPopup(true);
    } else {
      const savedLng = localStorage.getItem('shopmatries_lng');
      if (savedLng) {
        setUserLocationName(`GPS: ${parseFloat(savedLat).toFixed(2)}, ${parseFloat(savedLng).toFixed(2)}`);
      }
    }

    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      'https://food-cgs4.onrender.com';

    fetch(`${API_URL}/api/foods/restaurants`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const restMap = {};
          data.forEach(r => {
            const name = r.name || r.hotelName || r.restaurantName;
            if (name) {
              restMap[name.toLowerCase().trim()] = r;
            }
          });
          setRestaurantDetailsMap(restMap);
        }
      })
      .catch(err => console.error('Failed to fetch restaurants metadata:', err));

    fetch(`${API_URL}/api/offers`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setBannerData({
            tag: data.tag || '',
            title: data.title || '',
            subtitle: data.subtitle || '',
            Delivery: data.Delivery || '',
            deliveryFee: data.deliveryFee || '',
            bgMedia: data.bgMedia || '',
            mediaType: data.mediaType || '',
          });
          if (data.promoMedia || data.promoVideo || data.bgMedia) {
            setPromoBanner({
              media: data.promoMedia || data.bgMedia,
              type: data.mediaType || 'image',
              title: data.promoTitle || 'Special Partner Promotion',
              subtitle: data.subtitle || 'Order now for exclusive discounts'
            });
          }
        }
      })
      .catch(() => {});

    const loadCatalogData = async () => {
      let fetchedHotels = [];

      try {
        const res = await fetch(`${API_URL}/api/restaurants`);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          fetchedHotels = data;
        } else {
          const resAlt = await fetch(
            `${API_URL}/api/foods/restaurants`
          );

          const dataAlt = await resAlt.json();

          if (Array.isArray(dataAlt) && dataAlt.length > 0) {
            fetchedHotels = dataAlt;
          }
        }
      } catch (err) {
        console.error('Failed to fetch restaurants:', err);
      }

      try {
        const foodRes = await fetch(`${API_URL}/api/foods`);
        const foodData = await foodRes.json();

        if (Array.isArray(foodData)) {
          const sortedFood = foodData.sort((a, b) => (b.rating || 4.8) - (a.rating || 4.8));
          setFoodItemsList(sortedFood);

          const hotelMap = {};

          fetchedHotels.forEach((h) => {
            const hName =
              h.name ||
              h.hotelName ||
              h.restaurantName ||
              h.title;

            if (hName) {
              hotelMap[hName.toLowerCase()] = {
                ...h,
                name: hName,
                image:
                  h.image ||
                  h.logo ||
                  h.hotelImage ||
                  h.restaurantImage ||
                  '',
              };
            }
          });

          foodData.forEach((item) => {
            const hName =
              item.hotelName ||
              item.restaurant ||
              item.restaurantName ||
              item.title;

            if (hName) {
              const key = hName.toLowerCase();

              if (!hotelMap[key]) {
                hotelMap[key] = {
                  id: item.hotelId || hName,
                  name: hName,
                  image:
                    item.hotelImage ||
                    item.restaurantImage ||
                    '',
                  address: item.address || 'Shivamogga Hub',
                  cuisine: item.category
                    ? [item.category]
                    : ['Multi-Cuisine'],
                };
              } else if (
                !hotelMap[key].image &&
                (item.hotelImage || item.restaurantImage)
              ) {
                hotelMap[key].image =
                  item.hotelImage || item.restaurantImage;
              }
            }
          });

          setHotelsList(Object.values(hotelMap));
        } else {
          setHotelsList(fetchedHotels);
        }
      } catch (err) {
        console.error('Failed to fetch food catalog:', err);
        setHotelsList(fetchedHotels);
      }
    };

    loadCatalogData();

    try {
      const userPhoneKey = localStorage.getItem('shopmatries_phone') || 'default_user';
      const savedCart = localStorage.getItem(`shopmatries_cart_${userPhoneKey}`) || localStorage.getItem('shopmatries_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    }
  }, []);

  // 100% Real Exact GPS Location Fetching
  const handleTurnOnLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      setShowLocationPopup(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        localStorage.setItem('shopmatries_lat', latitude);
        localStorage.setItem('shopmatries_lng', longitude);
        setUserLocationName(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setShowLocationPopup(false);
      },
      (error) => {
        console.error('GPS error:', error);
        alert('⚠️ Unable to retrieve your exact location. Please enable GPS permissions in your browser settings.');
        setShowLocationPopup(false);
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const updateCartStorage = (newCart) => {
    setCart(newCart);
    try {
      const userPhoneKey = localStorage.getItem('shopmatries_phone') || 'default_user';
      localStorage.setItem(`shopmatries_cart_${userPhoneKey}`, JSON.stringify(newCart));
      localStorage.setItem('shopmatries_cart', JSON.stringify(newCart));
    } catch (e) {
      console.error('Failed to save cart to storage', e);
    }
  };

  const handleAddToCart = (id) => {
    const token = localStorage.getItem('shopmatries_token');
    if (!token) {
      setShowLoginPrompt(true);
      return;
    }

    const stringId = String(id);
    const updated = {
      ...cart,
      [stringId]: (cart[stringId] || 0) + 1,
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

  const totalItemsCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = foodItemsList.find(
      (i) => String(i._id || i.id) === String(id)
    );
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const filteredItems = foodItemsList.filter((item) => {
    const hotelRefId = item.hotelId;
    const hotelNameField =
      item.hotelName || item.restaurant || item.restaurantName || '';
    const itemName = item.englishName || item.name || item.dishName || '';
    const kannadaName = item.kannadaName || '';
    const itemCategory = item.category || '';

    const query = searchQuery ? searchQuery.toLowerCase().trim() : '';
    const searchTerms = query.split(/\s+/);

    const matchesSearch =
      query === '' ||
      searchTerms.every(
        (term) =>
          itemName.toLowerCase().includes(term) ||
          kannadaName.toLowerCase().includes(term) ||
          hotelNameField.toLowerCase().includes(term) ||
          itemCategory.toLowerCase().includes(term)
      );

    if (selectedHotel) {
      const hotelDisplayName =
        selectedHotel.name ||
        selectedHotel.hotelName ||
        selectedHotel.restaurantName ||
        '';
      const matchesHotelId =
        hotelRefId &&
        String(hotelRefId) === String(selectedHotel._id || selectedHotel.id);
      const matchesHotelName =
        hotelNameField &&
        hotelDisplayName &&
        hotelNameField.toLowerCase() === hotelDisplayName.toLowerCase();
      return (matchesHotelId || matchesHotelName) && matchesSearch;
    }

    if (selectedCategory === 'Hotels') {
      return matchesSearch;
    }

    const matchesCategory =
      selectedCategory === 'all' ||
      itemCategory.toLowerCase() === selectedCategory.toLowerCase();

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative pb-36 bg-[#fffaf7] min-h-screen">

      {showLocationPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-orange-200 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black shadow-inner">
              📍
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950">
                Turn On Your Exact GPS Location
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enable precise GPS location to show exact nearby partner hotels and delivery distance around you.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                onClick={handleTurnOnLocation}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition cursor-pointer active:scale-95"
              >
                Turn On Exact GPS 🛰️
              </button>
              <button
                onClick={() => setShowLocationPopup(false)}
                className="w-full bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold text-xs py-3 rounded-xl transition cursor-pointer"
              >
                Skip for Now
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-orange-200 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto text-xl font-black">
              🔒
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950">
                Please Login or Register First
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                You must be signed in to add food items to your cart and place orders.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition cursor-pointer"
              >
                Sign In ➔
              </button>
              <button
                onClick={() => router.push('/register')}
                className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 font-extrabold text-xs py-3 rounded-xl transition cursor-pointer"
              >
                Register
              </button>
            </div>
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="text-[11px] text-slate-400 font-bold hover:text-slate-600 pt-1 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="sticky top-0 bg-white z-40 shadow-sm">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[11px] px-3 py-2 flex justify-between items-center font-medium shadow-sm">
          <div className="flex items-center space-x-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse"></span>
            <span className="truncate">
              Get food in 30 mins • Under 30 min guarantee
            </span>
          </div>
          <button
            onClick={() => setShowLocationPopup(true)}
            className="shrink-0 bg-red-600/70 hover:bg-red-700 px-2.5 py-0.5 rounded-lg text-[10px] border border-orange-300/40 font-bold cursor-pointer"
          >
            📍 {userLocationName}
          </button>
        </div>

        <div className="px-4 pt-3 pb-2 space-y-2.5 border-b border-orange-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img
                src={buyBriggLogo.src}
                alt="BuyBrigg Logo"
                className="w-12 h-12 rounded-lg object-cover shadow-sm"
              />
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                BUY<span className="text-orange-500">BRIGG</span>
              </h1>
            </div>

            <button
              onClick={() => router.push('/quick-menu')}
              className="border border-orange-200 bg-orange-50 text-orange-600 text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-sm hover:bg-orange-100 transition active:scale-95 cursor-pointer"
            >
              ⚡ Quick Menu & Catering
            </button>
          </div>

          <div className="relative rounded-2xl p-3 text-white shadow-md overflow-hidden bg-slate-900 min-h-[90px] flex justify-between items-center">
            {bannerData.bgMedia ? (
              bannerData.mediaType === 'video' ? (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
                >
                  <source src={bannerData.bgMedia} />
                </video>
              ) : (
                <div
                  className="absolute inset-0 w-full h-full bg-cover bg-center z-0 opacity-50"
                  style={{ backgroundImage: `url(${bannerData.bgMedia})` }}
                ></div>
              )
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-orange-600 to-red-500 z-0"></div>
            )}
            <div className="absolute inset-0 bg-black/30 z-0"></div>

            <div className="z-10 space-y-0.5">
              <span className="bg-yellow-400 text-red-900 text-[8px] font-black px-1.5 py-0.5 rounded uppercase font-mono">
                {bannerData.tag || 'SPECIAL OFFER'}
              </span>
              <h2 className="text-xs font-black tracking-tight">
                {bannerData.title || 'Super Delicious Meals Delivered Fresh'}
              </h2>
              <p className="text-[10px] text-orange-50">
                {bannerData.subtitle || 'Order from top rated local partner hotels'}
              </p>
            </div>

            <div className="z-10 text-right bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10">
              <p className="text-[8px] text-orange-300 font-bold uppercase">Delivery</p>
              <p className="text-xs font-black text-white">
                {bannerData.Delivery || 'Free'}
              </p>
            </div>
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedHotel(null);
                }}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border cursor-pointer ${
                  selectedCategory === cat.id && !selectedHotel
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                    : 'bg-orange-50 text-slate-700 border-orange-100 hover:bg-orange-100'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-orange-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder={
              selectedHotel
                ? `Search dishes or hotel in ${selectedHotel.name || 'hotel'}...`
                : 'Search food, dish name, or hotel...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-orange-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 shadow-sm"
          />
        </div>

        {!selectedHotel && selectedCategory === 'all' && searchQuery === '' && hotelsList.length > 0 && (
          <div className="space-y-2.5 py-1">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-xs flex items-center space-x-1">
                <span>⭐</span>
                <span>Featured Partner Hotels & Promotions</span>
              </h3>
              <span className="text-[10px] text-orange-600 font-bold">Swipe →</span>
            </div>

            <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none">
              {hotelsList.map((hotel) => {
                const hId = hotel._id || hotel.id;
                const hName = hotel.name || hotel.hotelName || hotel.restaurantName || 'Partner Hotel';
                const hImg = hotel.image || hotel.logo || hotel.hotelImage || '';
                const dbHotelObj = getDbHotelRecord(hName, restaurantDetailsMap, hotel);
                const isOpen = checkIfStoreIsOpen(dbHotelObj);
                const timingStr = getTodayTimingString(dbHotelObj);

                return (
                  <div
                    key={hId}
                    onClick={() => setSelectedHotel(hotel)}
                    className="min-w-[210px] max-w-[210px] bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-3 text-white shadow-md relative overflow-hidden shrink-0 cursor-pointer active:scale-95 transition"
                  >
                    {hImg && (
                      <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${hImg})` }}></div>
                    )}
                    <div className="relative z-10 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="bg-white/20 backdrop-blur-md text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                          Featured 🔥
                        </span>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${isOpen ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                          {isOpen ? '🟢 Open Now' : '🔴 Closed'}
                        </span>
                      </div>
                      <h4 className="font-black text-sm truncate">{hName}</h4>
                      <p className="text-[10px] text-orange-100 truncate">⏰ {timingStr}</p>
                      <button className="bg-white text-orange-700 text-[10px] font-black px-3 py-1 rounded-xl shadow-sm mt-1">
                        Order Now ➔
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {promoBanner && promoBanner.media && !selectedHotel && selectedCategory === 'all' && searchQuery === '' && (
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-md border border-orange-200">
            <div className="absolute top-2 right-2 z-20">
              <button 
                onClick={() => setPromoBanner(null)} 
                className="bg-black/60 hover:bg-black text-white text-[10px] px-2 py-0.5 rounded-full font-bold transition cursor-pointer"
                title="Remove promotional banner"
              >
                ✕ Dismiss
              </button>
            </div>
            {promoBanner.type === 'video' || promoBanner.media.endsWith('.mp4') ? (
              <video autoPlay loop muted playsInline className="w-full h-36 object-cover opacity-80">
                <source src={promoBanner.media} />
              </video>
            ) : (
              <div className="w-full h-32 bg-cover bg-center opacity-80" style={{ backgroundImage: `url(${promoBanner.media})` }}></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3 text-white">
              <span className="bg-orange-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full w-max uppercase mb-1">
                Featured Brand Promotion
              </span>
              <h4 className="text-xs font-black">{promoBanner.title}</h4>
              <p className="text-[10px] text-orange-200">{promoBanner.subtitle}</p>
            </div>
          </div>
        )}

        {selectedCategory === 'Hotels' && !selectedHotel ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-xs flex items-center space-x-1">
                <span>🏨</span>
                <span>Partner Restaurants (ಪಾಲುದಾರ ಹೋಟೆಲ್‌ಗಳು)</span>
              </h3>
              <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full border border-orange-200">
                {hotelsList.length} Total
              </span>
            </div>

            <div className="space-y-2.5">
              {hotelsList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-bold bg-white border border-orange-100 rounded-2xl">
                  No partner restaurants registered yet.
                </div>
              ) : (
                hotelsList.map((hotel) => {
                  const hotelId = hotel._id || hotel.id;
                  const hotelDisplayName =
                    hotel.name ||
                    hotel.hotelName ||
                    hotel.restaurantName ||
                    hotel.title ||
                    'Midari hotel';
                  const hotelAddress = hotel.address || hotel.location || 'Shivamogga Hub';
                  const cuisineList = Array.isArray(hotel.cuisine)
                    ? hotel.cuisine.join(', ')
                    : hotel.cuisine || 'Multi-Cuisine';
                  const hotelImg =
                    hotel.image ||
                    hotel.logo ||
                    hotel.hotelImage ||
                    hotel.restaurantImage ||
                    '';
                  const dbHotelObj = getDbHotelRecord(hotelDisplayName, restaurantDetailsMap, hotel);
                  const isOpen = checkIfStoreIsOpen(dbHotelObj);
                  const timingStr = getTodayTimingString(dbHotelObj);

                  return (
                    <div
                      key={hotelId}
                      onClick={() => setSelectedHotel(hotel)}
                      className="bg-white border border-orange-100 hover:border-orange-400 rounded-2xl p-3 shadow-sm flex items-center space-x-3 cursor-pointer transition active:scale-[0.99]"
                    >
                      {hotelImg ? (
                        <img
                          src={hotelImg}
                          alt={hotelDisplayName}
                          className="w-16 h-16 rounded-xl object-cover border border-orange-100"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center text-2xl border border-orange-100">
                          🏨
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-extrabold text-slate-900 text-xs">
                            {hotelDisplayName}
                          </h4>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {isOpen ? '🟢 Open Now' : '🔴 Closed'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                          📍 {hotelAddress}
                        </p>
                        <p className="text-[10px] text-orange-600 font-bold mt-0.5">
                          ⏰ Today: {timingStr}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          🍴 {cuisineList}
                        </p>
                        <p className="text-[9px] text-orange-600 font-bold mt-1">
                          Tap to view restaurant menu ➔
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xs flex items-center space-x-1">
                  <span>🔥</span>
                  <span>
                    {selectedHotel
                      ? `${selectedHotel.name || selectedHotel.hotelName || 'Midari hotel'} Menu`
                      : 'Most Ordered & Nearby Food Catalog (ಹೆಚ್ಚು ಆದೇಶಿಸಿದ ಆಹಾರ)'}
                  </span>
                </h3>
                {selectedHotel && (
                  <button
                    onClick={() => setSelectedHotel(null)}
                    className="text-[10px] text-orange-600 font-bold hover:underline mt-0.5 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>← Back to all restaurants</span>
                  </button>
                )}
              </div>
              <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full border border-orange-200">
                {filteredItems.length} Dishes
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {filteredItems.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-400 text-xs font-bold bg-white border border-orange-100 rounded-2xl">
                  {selectedHotel
                    ? 'No dishes found matching your search.'
                    : 'No food dishes found matching your search.'}
                </div>
              ) : (
                filteredItems.map((item) => {
                  const itemId = item._id || item.id;
                  const qty = cart[itemId] || 0;
                  const displayName =
                    item.englishName || item.name || item.dishName || 'Food Item';
                  const displayKannada = item.kannadaName || '';
                  const itemHotelName =
                    item.hotelName ||
                    item.restaurant ||
                    item.restaurantName ||
                    'Midari hotel';
                  const itemRating = item.rating || '4.8';

                  return (
                    <div
                      key={itemId}
                      className="bg-white border border-orange-100 rounded-2xl p-2.5 shadow-sm flex flex-col justify-between transition hover:shadow-md hover:border-orange-200"
                    >
                      <div>
                        <div className="relative h-20 rounded-xl overflow-hidden mb-1.5 bg-orange-50 border border-orange-100">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl bg-orange-50">
                              🍲
                            </div>
                          )}
                          <span className="absolute top-1 left-1 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow">
                            ⭐ Popular
                          </span>
                          <span className="absolute top-1 right-1 bg-black/70 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                            ★ {itemRating} / 5
                          </span>
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-[11px] line-clamp-1">
                          {displayName}
                        </h4>
                        {displayKannada && (
                          <p className="text-[9px] text-slate-400 font-medium truncate">
                            {displayKannada}
                          </p>
                        )}
                        <p className="text-[9px] text-orange-600 font-bold truncate mt-0.5">
                          🏨 {itemHotelName}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-orange-100 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-slate-900 text-xs">
                            ₹{item.price}
                          </span>
                          <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                            Nearby 📍
                          </span>
                        </div>

                        {qty === 0 ? (
                          <button
                            onClick={() => handleAddToCart(itemId)}
                            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold text-[10px] py-1.5 rounded-lg transition shadow-sm active:scale-95 cursor-pointer"
                          >
                            + Add
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg px-1.5 py-1 shadow-sm">
                            <button
                              onClick={() => handleRemoveFromCart(itemId)}
                              className="w-5 h-5 flex items-center justify-center font-black text-xs hover:bg-red-700 rounded transition cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-[10px] font-extrabold px-1">
                              {qty}
                            </span>
                            <button
                              onClick={() => handleAddToCart(itemId)}
                              className="w-5 h-5 flex items-center justify-center font-black text-xs hover:bg-red-700 rounded transition cursor-pointer"
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

      {totalItemsCount > 0 && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-[94%] max-w-[390px] bg-slate-950 text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between z-40 border border-orange-500/30">
          <div className="flex items-center space-x-2.5">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white w-8 h-8 rounded-xl flex items-center justify-center shadow font-black text-xs">
              {totalItemsCount}
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                TOTAL AMOUNT
              </p>
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
              onClick={() => {
                const token = localStorage.getItem('shopmatries_token');
                if (!token) {
                  setShowLoginPrompt(true);
                  return;
                }
                router.push('/cart');
              }}
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-extrabold text-[11px] px-3 py-2.5 rounded-xl transition shadow-md flex items-center space-x-1 active:scale-95 cursor-pointer"
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