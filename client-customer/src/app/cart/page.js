'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();
 
  const [cartItems, setCartItems] = useState([]);
  
  // Detailed Address Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Shivamogga');
  const [area, setArea] = useState('');
  const [street, setStreet] = useState('');
  
  // Payment Method State (Card & NetBanking removed)
  const [paymentMethod, setPaymentMethod] = useState('UPI'); 
  const [upiProvider, setUpiProvider] = useState('PhonePe'); 

  const [gpsCoordinates, setGpsCoordinates] = useState({ lat: null, lng: null });
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [backendDeliveryFee, setBackendDeliveryFee] = useState(30);
  
  // Admin Delivery Fee Settings & Geo-Fence validation states
  const [adminRatePerKm, setAdminRatePerKm] = useState(5);
  const [adminBaseFee, setAdminBaseFee] = useState(30);
  const [geoZone, setGeoZone] = useState(null);
  const [isOutsideGeoFence, setIsOutsideGeoFence] = useState(false);
  const [geoFenceMessage, setGeoFenceMessage] = useState('');
  
  // Restaurant GPS Lookup Map stored in state
  const [restaurantGpsMap, setRestaurantGpsMap] = useState({});

  // Helper to extract GPS coordinates from hotel address string, array, or object
  const extractGps = (addr) => {
    if (!addr) return null;
    if (typeof addr === 'object' && addr.lat !== undefined && addr.lng !== undefined) {
      return { lat: parseFloat(addr.lat), lng: parseFloat(addr.lng) };
    }
    if (Array.isArray(addr) && addr.length > 0) {
      return extractGps(addr[0]);
    }
    if (typeof addr === 'string') {
      const match = addr.match(/\[GPS:\s*([0-9.-]+),\s*([0-9.-]+)\]/);
      if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }
    }
    return null;
  };

  // Haversine distance formula to calculate distance in meters
  const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; 
    const latRad1 = (lat1 * Math.PI) / 180;
    const latRad2 = (lat2 * Math.PI) / 180;
    const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLng = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(latRad1) * Math.cos(latRad2) *
      Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Haversine distance formula to calculate distance in KM
  const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  };

  // Recalculate delivery fee based on specific Hotel GPS from /api/foods/restaurants -> Customer Location
  const updateDeliveryFeeBasedOnHotel = (custLat, custLng, itemsList, zoneData, currentRatePerKm, currentBaseFee, restMap) => {
    const base = currentBaseFee > 0 ? currentBaseFee : 30;
    setBackendDeliveryFee(base);

    if (!itemsList || itemsList.length === 0) return;

    if (zoneData && custLat && custLng) {
      const distFromZoneCenter = calculateDistanceMeters(custLat, custLng, zoneData.centerLat, zoneData.centerLng);
      if (distFromZoneCenter > zoneData.radiusMeters) {
        setIsOutsideGeoFence(true);
        setGeoFenceMessage(`⚠️ Sorry! Your delivery location is outside our allowed service zone (~${(distFromZoneCenter / 1000).toFixed(1)} km away).`);
        return;
      } else {
        setIsOutsideGeoFence(false);
        setGeoFenceMessage('');
      }
    }
    
    // Find specific hotel GPS for items in cart using restaurant metadata map or item address
    let hotelGps = null; 
    for (const item of itemsList) {
      // 1. Check restaurant GPS map by hotelName / restaurant name
      const rKey = (item.hotelName || item.restaurant || '').toLowerCase().trim();
      if (rKey && restMap && restMap[rKey]) {
        const found = extractGps(restMap[rKey].location || restMap[rKey].address || restMap[rKey].gps || restMap[rKey].hotelLocation || restMap[rKey].hotelAddress);
        if (found) {
          hotelGps = found;
          break;
        }
      }
      // 2. Check item-level hotelAddress or address
      const extractedGps = extractGps(item.hotelAddress) || extractGps(item.address) || extractGps(item.hotelLocation);
      if (extractedGps) {
        hotelGps = extractedGps;
        break;
      }
    }

    if (hotelGps && custLat && custLng) {
      const hotelToCustKm = calculateDistanceKm(hotelGps.lat, hotelGps.lng, custLat, custLng);
      const calculatedFee = Math.round(Math.max(1, hotelToCustKm) * currentRatePerKm);
      setBackendDeliveryFee(Math.max(base, calculatedFee));
    } else {
      setBackendDeliveryFee(base);
    }
  };

  const handleAutoDetectGPS = (currentItems, zoneData, currentRatePerKm, currentBaseFee, restMap) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGpsCoordinates({ lat: latitude, lng: longitude });
        localStorage.setItem('shopmatries_lat', latitude);
        localStorage.setItem('shopmatries_lng', longitude);
        setIsDetectingGPS(false);

        updateDeliveryFeeBasedOnHotel(latitude, longitude, currentItems, zoneData, currentRatePerKm, currentBaseFee, restMap);
      },
      () => {
        setIsDetectingGPS(false);
        alert('⚠️ Please enable exact GPS location permissions in your browser settings.');
      },
      { timeout: 20000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  useEffect(() => {
    const token = localStorage.getItem('shopmatries_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const savedName = localStorage.getItem('shopmatries_username') || '';
    const savedPhone = localStorage.getItem('shopmatries_phone') || '';
    if (savedName) setFullName(savedName);
    if (savedPhone) setPhone(savedPhone);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';
    const userPhoneKey = savedPhone || 'default_user';

    // Fetch Delivery Fee Settings, Geo-Fence, Foods, and Restaurant GPS data simultaneously
    Promise.all([
      fetch(`${API_URL}/api/settings/delivery-fee`).then(res => res.json()).catch(() => ({})),
      fetch(`${API_URL}/api/settings/geofence`).then(res => res.json()).catch(() => ({})),
      fetch(`${API_URL}/api/foods`).then(res => res.json()).catch(() => ([])),
      fetch(`${API_URL}/api/foods/restaurants`).then(res => res.json()).catch(() => ([]))
    ]).then(([feeData, zoneData, productsData, restaurantsData]) => {
      let currentRate = 5;
      let currentBase = 30;
      if (feeData) {
        if (feeData.ratePerKm !== undefined) {
          currentRate = Number(feeData.ratePerKm);
          setAdminRatePerKm(currentRate);
        }
        if (feeData.deliveryFee !== undefined) {
          currentBase = Number(feeData.deliveryFee);
          setAdminBaseFee(currentBase);
          setBackendDeliveryFee(currentBase);
        }
      }

      let activeZone = null;
      if (zoneData && zoneData.radiusMeters) {
        activeZone = zoneData;
        setGeoZone(zoneData);
      }

      const restMap = {};
      if (Array.isArray(restaurantsData)) {
        restaurantsData.forEach(r => {
          const name = r.name || r.hotelName || r.restaurantName;
          if (name) {
            restMap[name.toLowerCase().trim()] = r;
          }
        });
        setRestaurantGpsMap(restMap);
      }

      const catalog = Array.isArray(productsData) ? productsData : [];
      let customDetails = {};
      try {
        customDetails = JSON.parse(localStorage.getItem(`shopmatries_custom_details_${userPhoneKey}`) || '{}');
      } catch (e) {}

      const savedCart = localStorage.getItem(`shopmatries_cart_${userPhoneKey}`) || localStorage.getItem('shopmatries_cart');
     
      if (savedCart) {
        const cartObj = JSON.parse(savedCart);
        const items = Object.entries(cartObj).map(([id, quantity]) => {
          const product = catalog.find(item => String(item._id || item.id) === String(id)) || customDetails[id];
          const resolvedName = product?.englishName || product?.name || product?.dishName || 'Food Item';
          const resolvedHotelName = product?.hotelName || product?.restaurant || product?.restaurantName || '';

          return product ? { 
            id: String(product._id || product.id),
            name: resolvedName,
            price: product.price || 0,
            image: product.image || '',
            hotelId: product.hotelId || '60c72b2f9b1d8b2f98e01234',
            hotelName: resolvedHotelName,
            hotelAddress: product.hotelAddress || product.address || product.hotelLocation || '',
            quantity 
          } : null;
        }).filter(Boolean);
       
        setCartItems(items);

        const savedLat = localStorage.getItem('shopmatries_lat');
        const savedLng = localStorage.getItem('shopmatries_lng');
        if (savedLat && savedLng) {
          const lat = parseFloat(savedLat);
          const lng = parseFloat(savedLng);
          setGpsCoordinates({ lat, lng });
          updateDeliveryFeeBasedOnHotel(lat, lng, items, activeZone, currentRate, currentBase, restMap);
        } else {
          handleAutoDetectGPS(items, activeZone, currentRate, currentBase, restMap);
        }
      } else {
        setCartItems([]);
      }
    });
  }, [router]);

  const updateQuantity = (id, delta) => {
    const updated = cartItems.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean);

    setCartItems(updated);
   
    const cartObj = {};
    updated.forEach(i => { cartObj[i.id] = i.quantity; });
   
    const userPhoneKey = localStorage.getItem('shopmatries_phone') || 'default_user';
    localStorage.setItem(`shopmatries_cart_${userPhoneKey}`, JSON.stringify(cartObj));
    localStorage.setItem('shopmatries_cart', JSON.stringify(cartObj));

    if (gpsCoordinates.lat && gpsCoordinates.lng) {
      updateDeliveryFeeBasedOnHotel(gpsCoordinates.lat, gpsCoordinates.lng, updated, geoZone, adminRatePerKm, adminBaseFee, restaurantGpsMap);
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = subtotal > 0 ? backendDeliveryFee : 0;
  const total = subtotal + deliveryFee;

  const handleProceedToPayment = () => {
    if (cartItems.length === 0) return alert('Your cart is empty!');
    if (isOutsideGeoFence) {
      return alert('⚠️ Cannot place order: Your delivery location is outside our allowed service zone boundary.');
    }
    if (!fullName.trim() || !phone.trim() || !city.trim() || !area.trim() || !street.trim()) {
      return alert('Please fill in all address details (Name, Phone, City, Area, Street)!');
    }

    const mapsGeoLink = gpsCoordinates.lat && gpsCoordinates.lng 
      ? `[GPS: ${gpsCoordinates.lat}, ${gpsCoordinates.lng}] `
      : '';
    
    const structuredAddress = `${mapsGeoLink}Street: ${street}, Area: ${area}, City: ${city}`;
    const primaryRestaurantId = cartItems.length > 0 && cartItems[0].hotelId ? cartItems[0].hotelId : '60c72b2f9b1d8b2f98e01234';

    const pendingOrder = {
      customerName: fullName,
      phone: phone,
      restaurantId: primaryRestaurantId,
      items: cartItems.map(i => ({ foodItem: i.id, name: i.name, quantity: i.quantity, price: i.price })),
      totalPrice: total,
      deliveryFee: deliveryFee,
      ratePerKm: adminRatePerKm,
      address: structuredAddress,
      fulfillmentType: 'delivery',
      paymentMethodChoice: paymentMethod === 'UPI' ? `UPI (${upiProvider})` : paymentMethod
    };

    localStorage.setItem('shopmatries_pending_order', JSON.stringify(pendingOrder));
    router.push('/payment');
  };

  return (
    <main className="p-4 space-y-5 pb-28">
      <div className="flex items-center justify-between border-b border-orange-100 pb-3">
        <h1 className="text-xl font-black text-slate-900">🛒 Your Food Cart</h1>
        <span className="text-xs bg-orange-100 text-orange-800 font-bold px-2.5 py-1 rounded-full">
          {cartItems.reduce((a, b) => a + b.quantity, 0)} items
        </span>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <p className="text-4xl">🛒</p>
          <p className="text-slate-500 font-medium">Your cart is currently empty.</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md hover:from-red-600 hover:to-orange-600 transition cursor-pointer"
          >
            Browse Food Items
          </button>
        </div>
      ) : (
        <>
          {geoFenceMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3 rounded-2xl text-center shadow-sm">
              {geoFenceMessage}
            </div>
          )}

          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white border border-orange-100 p-3 rounded-2xl shadow-sm">
                <div className="flex items-center space-x-3">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover border" />
                  ) : (
                    <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center text-xl">🍲</div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                    <p className="text-orange-600 font-extrabold text-xs mt-1">₹{item.price}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl p-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-slate-700 font-bold shadow-sm cursor-pointer">-</button>
                  <span className="text-xs font-bold px-2 text-slate-800">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-orange-500 text-white rounded-lg font-bold shadow-sm cursor-pointer">+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-orange-900 uppercase tracking-wide">📍 Delivery Address & Contact</label>
              <button onClick={() => handleAutoDetectGPS(cartItems, geoZone, adminRatePerKm, adminBaseFee, restaurantGpsMap)} disabled={isDetectingGPS} className="bg-white text-orange-700 border border-orange-200 hover:bg-orange-100 text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition cursor-pointer">
                <span>{isDetectingGPS ? '🛰️ Capturing Exact Pin...' : '📡 Refresh Exact GPS'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                placeholder="Full Name" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:outline-none"
                required
              />
              <input 
                type="tel" 
                placeholder="Phone Number" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono font-bold focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                placeholder="City (e.g. Shivamogga)"
                value={city} 
                onChange={(e) => setCity(e.target.value)} 
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:outline-none"
                required
              />
              <input 
                type="text" 
                placeholder="Area / Locality" 
                value={area} 
                onChange={(e) => setArea(e.target.value)} 
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:outline-none"
                required
              />
            </div>

            <input 
              type="text" 
              placeholder="Street Address / House No / Landmark" 
              value={street} 
              onChange={(e) => setStreet(e.target.value)} 
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:outline-none"
              required
            />

            {gpsCoordinates.lat && !isOutsideGeoFence && (
              <p className="text-[10px] text-emerald-700 font-mono font-bold">
                ✓ Exact GPS Pin Secured & Within Service Zone: {gpsCoordinates.lat.toFixed(6)}, {gpsCoordinates.lng.toFixed(6)}
              </p>
            )}
          </div>

          <div className="bg-white border border-orange-100 p-4 rounded-2xl space-y-3 shadow-sm">
            <h4 className="font-bold text-slate-900 text-sm border-b border-orange-100 pb-2">💳 Payment Method</h4>
            
            <div className="space-y-2.5">
              <label className="flex items-center space-x-2.5 text-xs font-bold text-slate-800 cursor-pointer">
                <input 
                  type="radio" 
                  name="payment" 
                  checked={paymentMethod === 'COD'} 
                  onChange={() => setPaymentMethod('COD')}
                  className="accent-orange-500 w-4 h-4"
                />
                <span>Cash on Delivery</span>
              </label>

              <div className="space-y-2">
                <label className="flex items-center space-x-2.5 text-xs font-bold text-slate-800 cursor-pointer">
                  <input 
                    type="radio" 
                    name="payment" 
                    checked={paymentMethod === 'UPI'} 
                    onChange={() => setPaymentMethod('UPI')}
                    className="accent-orange-500 w-4 h-4"
                  />
                  <span>UPI / Online Payment</span>
                </label>

                {paymentMethod === 'UPI' && (
                  <div className="ml-6 pl-3 border-l-2 border-orange-200 flex gap-2">
                    {['PhonePe', 'Google Pay', 'Other UPI'].map((provider) => (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => setUpiProvider(provider)}
                        className={`text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                          upiProvider === provider
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-orange-50 text-slate-700 border-orange-200'
                        }`}
                      >
                        {provider}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-orange-100 p-4 rounded-2xl space-y-3 shadow-sm">
            <h4 className="font-bold text-slate-900 text-sm border-b border-orange-100 pb-2">Bill Details</h4>
            <div className="flex justify-between text-xs text-slate-600"><span>Item Total</span><span className="font-semibold text-slate-800">₹{subtotal}</span></div>
            <div className="flex justify-between text-xs text-slate-600"><span>Delivery Fee (Hotel to Customer @ ₹{adminRatePerKm}/km)</span><span className="font-semibold text-slate-800">₹{deliveryFee}</span></div>
            <div className="flex justify-between text-sm font-black text-slate-900 border-t border-orange-100 pt-3"><span>Total Amount</span><span className="text-orange-600">₹{total}</span></div>
          </div>

          <button 
            onClick={handleProceedToPayment} 
            disabled={isOutsideGeoFence}
            className={`w-full text-white font-extrabold text-sm py-4 rounded-2xl shadow-xl transition flex items-center justify-center space-x-2 ${
              isOutsideGeoFence 
                ? 'bg-slate-300 cursor-not-allowed' 
                : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 cursor-pointer'
            }`}
          >
            <span>{isOutsideGeoFence ? '🚫 Outside Delivery Zone' : 'Order Item ⚡'}</span>
          </button>
        </>
      )}
    </main>
  );
}