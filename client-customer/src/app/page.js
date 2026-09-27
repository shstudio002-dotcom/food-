'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  const [bannerData, setBannerData] = useState({
    title: '',
    subtitle: '',
    Delivery: '',
    deliveryFee: '',
    bgMedia: '',
    mediaType: '',
  });
  const [cart, setCart] = useState({});
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 🔒 Security Check: Ensure user is logged in before showing the storefront
    const token =
      localStorage.getItem('shopmatries_token') ||
      localStorage.getItem('shopmatries_admin_token');

    if (!token) {
      router.push('/login');
      return;
    }

    setIsAuthorized(true);

    // DO NOT CHANGE API URL
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      'https://food-ohea.onrender.com';

    // Fetch live banner/offer data from backend
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
        }
      })
      .catch(() => {});

    // Function to load fresh restaurant and food catalogs from backend
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
        console.error(
          'Failed to fetch restaurants:',
          err
        );
      }

      try {
        const foodRes = await fetch(
          `${API_URL}/api/foods`
        );

        const foodData = await foodRes.json();

        if (Array.isArray(foodData)) {
          setFoodItemsList(foodData);

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

                // Keep hotel store logo/image
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

                  // Use hotel-specific image fields
                  image:
                    item.hotelImage ||
                    item.restaurantImage ||
                    '',

                  address:
                    item.address ||
                    'Shivamogga Hub',

                  isOpen: true,

                  cuisine: item.category
                    ? [item.category]
                    : ['Multi-Cuisine'],
                };
              } else if (
                !hotelMap[key].image &&
                (item.hotelImage ||
                  item.restaurantImage)
              ) {
                hotelMap[key].image =
                  item.hotelImage ||
                  item.restaurantImage;
              }
            }
          });

          setHotelsList(
            Object.values(hotelMap)
          );
        } else {
          setHotelsList(fetchedHotels);
        }
      } catch (err) {
        console.error(
          'Failed to fetch food catalog:',
          err
        );

        setHotelsList(fetchedHotels);
      }
    };

    loadCatalogData();

    try {
      const savedCart =
        localStorage.getItem(
          'shopmatries_cart'
        );

      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error(
        'Failed to load cart from storage',
        e
      );
    }
  }, [router]);

  const updateCartStorage = (newCart) => {
    setCart(newCart);

    try {
      localStorage.setItem(
        'shopmatries_cart',
        JSON.stringify(newCart)
      );
    } catch (e) {
      console.error(
        'Failed to save cart to storage',
        e
      );
    }
  };

  const handleAddToCart = (id) => {
    const stringId = String(id);

    const updated = {
      ...cart,
      [stringId]:
        (cart[stringId] || 0) + 1,
    };

    updateCartStorage(updated);
  };

  const handleRemoveFromCart = (id) => {
    const stringId = String(id);
    const currentQty =
      cart[stringId] || 0;

    const updated = {
      ...cart,
    };

    if (currentQty <= 1) {
      delete updated[stringId];
    } else {
      updated[stringId] =
        currentQty - 1;
    }

    updateCartStorage(updated);
  };

  const handleClearCart = () => {
    updateCartStorage({});
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
        <p className="text-xs font-bold text-slate-500 animate-pulse">
          🔒 Verifying secure session & redirecting to login...
        </p>
      </div>
    );
  }

  const totalItemsCount =
    Object.values(cart).reduce(
      (a, b) => a + b,
      0
    );

  const totalPrice =
    Object.entries(cart).reduce(
      (sum, [id, qty]) => {
        const item =
          foodItemsList.find(
            (i) =>
              String(
                i._id || i.id
              ) === String(id)
          );

        return (
          sum +
          (item
            ? item.price * qty
            : 0)
        );
      },
      0
    );

  // 🔍 Advanced Multi-Term Search & Filter Logic
  const filteredItems =
    foodItemsList.filter((item) => {
      const hotelRefId =
        item.hotelId;

      const hotelNameField =
        item.hotelName ||
        item.restaurant ||
        item.restaurantName ||
        '';

      const itemName =
        item.englishName ||
        item.name ||
        item.dishName ||
        '';

      const kannadaName =
        item.kannadaName || '';

      const itemCategory =
        item.category || '';

      const query =
        searchQuery
          ? searchQuery
              .toLowerCase()
              .trim()
          : '';

      const searchTerms =
        query.split(/\s+/);

      const matchesSearch =
        query === '' ||
        searchTerms.every(
          (term) =>
            itemName
              .toLowerCase()
              .includes(term) ||
            kannadaName
              .toLowerCase()
              .includes(term) ||
            hotelNameField
              .toLowerCase()
              .includes(term) ||
            itemCategory
              .toLowerCase()
              .includes(term)
        );

      if (selectedHotel) {
        const hotelDisplayName =
          selectedHotel.name ||
          selectedHotel.hotelName ||
          selectedHotel.restaurantName ||
          '';

        const matchesHotelId =
          hotelRefId &&
          String(hotelRefId) ===
            String(
              selectedHotel._id ||
                selectedHotel.id
            );

        const matchesHotelName =
          hotelNameField &&
          hotelDisplayName &&
          hotelNameField
            .toLowerCase() ===
            hotelDisplayName.toLowerCase();

        return (
          (matchesHotelId ||
            matchesHotelName) &&
          matchesSearch
        );
      }

      if (
        selectedCategory ===
        'Hotels'
      ) {
        return matchesSearch;
      }

      const matchesCategory =
        selectedCategory ===
          'all' ||
        itemCategory
          .toLowerCase() ===
          selectedCategory.toLowerCase();

      return (
        matchesCategory &&
        matchesSearch
      );
    });

  return (
    <div className="relative pb-36 bg-[#fffaf7] min-h-screen">

      {/* =====================================================
          STICKY TOP CONTAINER
      ====================================================== */}

      <div className="sticky top-0 bg-white z-40 shadow-sm">

        {/* ===================================================
            TOP ORANGE DELIVERY BAR
        ==================================================== */}

        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[11px] px-3 py-2 flex justify-between items-center font-medium shadow-sm">

          <div className="flex items-center space-x-1.5 truncate">

            <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse"></span>

            <span className="truncate">
              Get food in 30 mins • Under 30 min guarantee
            </span>

          </div>

          <div className="shrink-0 bg-red-600/70 px-2 py-0.5 rounded-lg text-[10px] border border-orange-300/40">
            📍 Shivamogga Hub
          </div>

        </div>


        {/* ===================================================
            HEADER
        ==================================================== */}

        <div className="px-4 pt-3 pb-2 space-y-2.5 border-b border-orange-100">

          <div className="flex justify-between items-center">

            {/* Existing Shopmatries Logo */}
            <div className="flex items-center space-x-2">

              <svg
                className="w-7 h-7 text-orange-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect
                  x="2"
                  y="6"
                  width="20"
                  height="14"
                  rx="2"
                />

                <line
                  x1="10"
                  y1="10"
                  x2="10"
                  y2="20"
                />

                <line
                  x1="2"
                  y1="10"
                  x2="22"
                  y2="10"
                />

                <path d="M10 6V4a2 2 0 0 1 4 0v2" />
              </svg>

              <h1 className="text-lg font-black tracking-tight text-slate-900">
                Shop
                <span className="text-orange-500">
                  matries
                </span>
              </h1>

            </div>


            {/* Quick Menu */}
            <button
              onClick={() =>
                router.push(
                  '/quick-menu'
                )
              }
              className="border border-orange-200 bg-orange-50 text-orange-600 text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-sm hover:bg-orange-100 transition active:scale-95 cursor-pointer"
            >
              ⚡ Quick Menu
            </button>

          </div>


          {/* =================================================
              DYNAMIC BACKEND OFFERS BANNER
          ================================================== */}

          <div className="relative rounded-2xl p-3 text-white shadow-md overflow-hidden bg-slate-900 min-h-[90px] flex justify-between items-center">

            {bannerData.bgMedia ? (
              bannerData.mediaType ===
              'video' ? (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
                >
                  <source
                    src={
                      bannerData.bgMedia
                    }
                  />
                </video>
              ) : (
                <div
                  className="absolute inset-0 w-full h-full bg-cover bg-center z-0 opacity-50"
                  style={{
                    backgroundImage: `url(${bannerData.bgMedia})`,
                  }}
                ></div>
              )
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-orange-600 to-red-500 z-0"></div>
            )}

            <div className="absolute inset-0 bg-black/30 z-0"></div>


            {/* Offer Text */}
            <div className="z-10 space-y-0.5">

              <span className="bg-yellow-400 text-red-900 text-[8px] font-black px-1.5 py-0.5 rounded uppercase font-mono">
                {bannerData.tag}
              </span>

              <h2 className="text-xs font-black tracking-tight">
                {bannerData.title}
              </h2>

              <p className="text-[10px] text-orange-50">
                {bannerData.subtitle}
              </p>

            </div>


            {/* Delivery */}
            <div className="z-10 text-right bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10">

              <p className="text-[8px] text-orange-300 font-bold uppercase">
                Delivery
              </p>

              <p className="text-xs font-black text-white">
                {bannerData.Delivery ||
                  'Free'}
              </p>

            </div>

          </div>


          {/* =================================================
              CATEGORY FILTER PILLS
          ================================================== */}

          <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">

            {categories.map(
              (cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(
                      cat.id
                    );
                    setSelectedHotel(
                      null
                    );
                  }}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border cursor-pointer ${
                    selectedCategory ===
                      cat.id &&
                    !selectedHotel
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                      : 'bg-orange-50 text-slate-700 border-orange-100 hover:bg-orange-100'
                  }`}
                >
                  <span>
                    {cat.icon}
                  </span>

                  <span>
                    {cat.name}
                  </span>
                </button>
              )
            )}

          </div>

        </div>

      </div>


      {/* =====================================================
          SCROLLABLE CONTENT
      ====================================================== */}

      <div className="p-4 space-y-4">

        {/* ===================================================
            SEARCH BAR
        ==================================================== */}

        <div className="relative">

          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-orange-400 text-sm">
            🔍
          </span>

          <input
            type="text"
            placeholder={
              selectedHotel
                ? `Search dishes or hotel in ${
                    selectedHotel.name ||
                    selectedHotel.hotelName ||
                    'Midari hotel'
                  }...`
                : 'Search food, dish name, or hotel...'
            }
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(
                e.target.value
              )
            }
            className="w-full pl-9 pr-3 py-2 bg-white border border-orange-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 shadow-sm"
          />

        </div>


        {/* ===================================================
            RESTAURANTS VIEW
        ==================================================== */}

        {selectedCategory ===
          'Hotels' &&
        !selectedHotel ? (

          <div className="space-y-3">

            <div className="flex justify-between items-center">

              <h3 className="font-extrabold text-slate-900 text-xs flex items-center space-x-1">

                <span>🏨</span>

                <span>
                  Partner Restaurants
                  (ಪಾಲುದಾರ ಹೋಟೆಲ್‌ಗಳು)
                </span>

              </h3>

              <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full border border-orange-200">
                {hotelsList.length}{' '}
                Open
              </span>

            </div>


            <div className="space-y-2.5">

              {hotelsList.length ===
              0 ? (

                <div className="text-center py-12 text-slate-400 text-xs font-bold bg-white border border-orange-100 rounded-2xl">
                  No partner
                  restaurants
                  registered yet.
                </div>

              ) : (

                hotelsList.map(
                  (hotel) => {
                    const hotelId =
                      hotel._id ||
                      hotel.id;

                    const hotelDisplayName =
                      hotel.name ||
                      hotel.hotelName ||
                      hotel.restaurantName ||
                      hotel.title ||
                      'Midari hotel';

                    const hotelAddress =
                      hotel.address ||
                      hotel.location ||
                      'Shivamogga Hub';

                    const cuisineList =
                      Array.isArray(
                        hotel.cuisine
                      )
                        ? hotel.cuisine.join(
                            ', '
                          )
                        : hotel.cuisine ||
                          'Multi-Cuisine';

                    const hotelImg =
                      hotel.image ||
                      hotel.logo ||
                      hotel.hotelImage ||
                      hotel.restaurantImage ||
                      '';

                    return (
                      <div
                        key={
                          hotelId
                        }
                        onClick={() =>
                          setSelectedHotel(
                            hotel
                          )
                        }
                        className="bg-white border border-orange-100 hover:border-orange-400 rounded-2xl p-3 shadow-sm flex items-center space-x-3 cursor-pointer transition active:scale-[0.99]"
                      >

                        {hotelImg ? (

                          <img
                            src={
                              hotelImg
                            }
                            alt={
                              hotelDisplayName
                            }
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
                              {
                                hotelDisplayName
                              }
                            </h4>

                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                hotel.isOpen !==
                                false
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {hotel.isOpen !==
                              false
                                ? '🟢 Open'
                                : '🔴 Closed'}
                            </span>

                          </div>

                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                            📍{' '}
                            {
                              hotelAddress
                            }
                          </p>

                          <p className="text-[9px] text-slate-400 mt-0.5">
                            🍴{' '}
                            {
                              cuisineList
                            }
                          </p>

                          <p className="text-[9px] text-orange-600 font-bold mt-1">
                            Tap to view
                            restaurant
                            menu ➔
                          </p>

                        </div>

                      </div>
                    );
                  }
                )

              )}

            </div>

          </div>

        ) : (

          /* =================================================
             FOOD ITEMS GRID VIEW
          ================================================== */

          <div className="space-y-3">

            <div className="flex justify-between items-center">

              <div>

                <h3 className="font-extrabold text-slate-900 text-xs flex items-center space-x-1">

                  <span>🍔</span>

                  <span>
                    {selectedHotel
                      ? `${
                          selectedHotel.name ||
                          selectedHotel.hotelName ||
                          'Midari hotel'
                        } Menu`
                      : 'Food Catalog (ಆಹಾರ ಪದಾರ್ಥಗಳು)'}
                  </span>

                </h3>

                {selectedHotel && (
                  <button
                    onClick={() =>
                      setSelectedHotel(
                        null
                      )
                    }
                    className="text-[10px] text-orange-600 font-bold hover:underline mt-0.5 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>
                      ← Back to all
                      restaurants
                    </span>
                  </button>
                )}

              </div>

              <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full border border-orange-200">
                {
                  filteredItems.length
                }{' '}
                Dishes
              </span>

            </div>


            {/* =================================================
                FOOD GRID
            ================================================== */}

            <div className="grid grid-cols-2 gap-2.5">

              {filteredItems.length ===
              0 ? (

                <div className="col-span-2 text-center py-12 text-slate-400 text-xs font-bold bg-white border border-orange-100 rounded-2xl">
                  {selectedHotel
                    ? 'No dishes found matching your search.'
                    : 'No food dishes found matching your search.'}
                </div>

              ) : (

                filteredItems.map(
                  (item) => {
                    const itemId =
                      item._id ||
                      item.id;

                    const qty =
                      cart[itemId] ||
                      0;

                    const displayName =
                      item.englishName ||
                      item.name ||
                      item.dishName ||
                      'Food Item';

                    const displayKannada =
                      item.kannadaName ||
                      '';

                    const itemHotelName =
                      item.hotelName ||
                      item.restaurant ||
                      item.restaurantName ||
                      'Midari hotel';

                    return (
                      <div
                        key={
                          itemId
                        }
                        className="bg-white border border-orange-100 rounded-2xl p-2.5 shadow-sm flex flex-col justify-between transition hover:shadow-md hover:border-orange-200"
                      >

                        <div>

                          <div className="relative h-20 rounded-xl overflow-hidden mb-1.5 bg-orange-50 border border-orange-100">

                            {item.image ? (

                              <img
                                src={
                                  item.image
                                }
                                alt={
                                  displayName
                                }
                                className="w-full h-full object-cover"
                              />

                            ) : (

                              <div className="w-full h-full flex items-center justify-center text-xl bg-orange-50">
                                🍲
                              </div>

                            )}

                          </div>


                          <h4 className="font-extrabold text-slate-900 text-[11px] line-clamp-1">
                            {
                              displayName
                            }
                          </h4>

                          {displayKannada && (
                            <p className="text-[9px] text-slate-400 font-medium truncate">
                              {
                                displayKannada
                              }
                            </p>
                          )}

                          <p className="text-[9px] text-orange-600 font-bold truncate mt-0.5">
                            🏨{' '}
                            {
                              itemHotelName
                            }
                          </p>

                        </div>


                        {/* =================================================
                            PRICE & CART
                        ================================================== */}

                        <div className="mt-2 pt-2 border-t border-orange-100 space-y-1.5">

                          <div className="flex justify-between items-center">

                            <span className="font-black text-slate-900 text-xs">
                              ₹
                              {
                                item.price
                              }
                            </span>

                            <span className="text-[9px] text-slate-400 bg-orange-50 px-1.5 py-0.5 rounded font-semibold">
                              Base
                            </span>

                          </div>


                          {qty ===
                          0 ? (

                            <button
                              onClick={() =>
                                handleAddToCart(
                                  itemId
                                )
                              }
                              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold text-[10px] py-1.5 rounded-lg transition shadow-sm active:scale-95 cursor-pointer"
                            >
                              + Add
                            </button>

                          ) : (

                            <div className="flex items-center justify-between bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg px-1.5 py-1 shadow-sm">

                              <button
                                onClick={() =>
                                  handleRemoveFromCart(
                                    itemId
                                  )
                                }
                                className="w-5 h-5 flex items-center justify-center font-black text-xs hover:bg-red-700 rounded transition cursor-pointer"
                              >
                                -
                              </button>

                              <span className="text-[10px] font-extrabold px-1">
                                {qty}
                              </span>

                              <button
                                onClick={() =>
                                  handleAddToCart(
                                    itemId
                                  )
                                }
                                className="w-5 h-5 flex items-center justify-center font-black text-xs hover:bg-red-700 rounded transition cursor-pointer"
                              >
                                +
                              </button>

                            </div>

                          )}

                        </div>

                      </div>
                    );
                  }
                )

              )}

            </div>

          </div>
        )}

      </div>


      {/* =====================================================
          FLOATING CHECKOUT BAR
      ====================================================== */}

      {totalItemsCount >
        0 && (

        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-[94%] max-w-[390px] bg-slate-950 text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between z-40 border border-orange-500/30 animate-slideUp">

          <div className="flex items-center space-x-2.5">

            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white w-8 h-8 rounded-xl flex items-center justify-center shadow font-black text-xs">
              {
                totalItemsCount
              }
            </div>

            <div>

              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                TOTAL AMOUNT
              </p>

              <p className="text-sm font-black text-white">
                ₹
                {
                  totalPrice
                }
              </p>

            </div>

          </div>


          <div className="flex items-center space-x-1.5">

            <button
              onClick={
                handleClearCart
              }
              title="Clear Cart"
              className="bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-white p-2 rounded-xl transition border border-slate-700 text-xs cursor-pointer"
            >
              🗑️
            </button>

            <button
              onClick={() =>
                router.push(
                  '/cart'
                )
              }
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-extrabold text-[11px] px-3 py-2.5 rounded-xl transition shadow-md flex items-center space-x-1 active:scale-95 cursor-pointer"
            >
              <span>
                View Cart &
                Checkout
              </span>

              <span>
                ➔
              </span>
            </button>

          </div>

        </div>
      )}

    </div>
  );
}