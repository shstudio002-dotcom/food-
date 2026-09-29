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
  
  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'COD', 'UPI', 'Card', 'NetBanking'
  const [upiProvider, setUpiProvider] = useState('PhonePe'); // 'PhonePe', 'Google Pay', 'Other UPI'

  const [gpsCoordinates, setGpsCoordinates] = useState({ lat: null, lng: null });
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [backendDeliveryFee, setBackendDeliveryFee] = useState(30);
  
  // Geo-Fence validation states
  const [geoZone, setGeoZone] = useState(null);
  const [isOutsideGeoFence, setIsOutsideGeoFence] = useState(false);
  const [geoFenceMessage, setGeoFenceMessage] = useState('');

  // Haversine distance formula to calculate distance in meters
  const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
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

  // Haversine distance formula to calculate distance in KM from Shivamogga Hub (13.9299, 75.5681)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  };

  // Validate current GPS location against backend Geo-Fence zone
  const validateGeoFence = (lat, lng, zone) => {
    if (!zone) return;
    const distanceMeters = calculateDistanceMeters(lat, lng, zone.centerLat, zone.centerLng);
    if (distanceMeters > zone.radiusMeters) {
      setIsOutsideGeoFence(true);
      setGeoFenceMessage(`⚠️ Sorry! Your location is outside our delivery service zone (~${(distanceMeters / 1000).toFixed(1)} km away). Maximum allowed range is ${Math.round(zone.radiusMeters / 1000)} km.`);
    } else {
      setIsOutsideGeoFence(false);
      setGeoFenceMessage('');
    }
  };

  const handleAutoDetectGPS = () => {
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
        const dist = calculateDistance(13.9299, 75.5681, latitude, longitude);
        const roundedDist = Math.max(1, parseFloat(dist.toFixed(1)));
        const calculatedFee = Math.round(roundedDist * 0.5); // 1km = ₹5 rule
        setBackendDeliveryFee(calculatedFee);
        setIsDetectingGPS(false);

        if (geoZone) {
          validateGeoFence(latitude, longitude, geoZone);
        }
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

    // Fetch Geo-Fence settings from backend
    fetch(`${API_URL}/api/settings/geofence`)
      .then(res => res.json())
      .then(zoneData => {
        if (zoneData && zoneData.radiusMeters) {
          setGeoZone(zoneData);
          const savedLat = localStorage.getItem('shopmatries_lat');
          const savedLng = localStorage.getItem('shopmatries_lng');
          if (savedLat && savedLng) {
            validateGeoFence(parseFloat(savedLat), parseFloat(savedLng), zoneData);
          }
        }
      })
      .catch(() => {});

    const savedLat = localStorage.getItem('shopmatries_lat');
    const savedLng = localStorage.getItem('shopmatries_lng');
    if (savedLat && savedLng) {
      const lat = parseFloat(savedLat);
      const lng = parseFloat(savedLng);
      setGpsCoordinates({ lat, lng });
      const dist = calculateDistance(13.9299, 75.5681, lat, lng);
      const roundedDist = Math.max(1, parseFloat(dist.toFixed(1)));
      setBackendDeliveryFee(Math.round(roundedDist * 3));
    } else {
      handleAutoDetectGPS();
    }

    const userPhoneKey = savedPhone || 'default_user';

    fetch(`${API_URL}/api/foods`)
      .then(res => res.json())
      .then(productsData => {
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

            return product ? { 
              id: String(product._id || product.id),
              name: resolvedName,
              price: product.price || 0,
              image: product.image || '',
              hotelId: product.hotelId || '60c72b2f9b1d8b2f98e01234',
              quantity 
            } : null;
          }).filter(Boolean);
         
          setCartItems(items);
        } else {
          setCartItems([]);
        }
      })
      .catch(() => setCartItems([]));
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
              <button onClick={handleAutoDetectGPS} disabled={isDetectingGPS} className="bg-white text-orange-700 border border-orange-200 hover:bg-orange-100 text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition cursor-pointer">
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

              <label className="flex items-center space-x-2.5 text-xs font-bold text-slate-800 cursor-pointer">
                <input 
                  type="radio" 
                  name="payment" 
                  checked={paymentMethod === 'Card'} 
                  onChange={() => setPaymentMethod('Card')}
                  className="accent-orange-500 w-4 h-4"
                />
                <span>Card (Credit / Debit)</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs font-bold text-slate-800 cursor-pointer">
                <input 
                  type="radio" 
                  name="payment" 
                  checked={paymentMethod === 'NetBanking'} 
                  onChange={() => setPaymentMethod('NetBanking')}
                  className="accent-orange-500 w-4 h-4"
                />
                <span>Net Banking</span>
              </label>
            </div>
          </div>

          <div className="bg-white border border-orange-100 p-4 rounded-2xl space-y-3 shadow-sm">
            <h4 className="font-bold text-slate-900 text-sm border-b border-orange-100 pb-2">Bill Details</h4>
            <div className="flex justify-between text-xs text-slate-600"><span>Item Total</span><span className="font-semibold text-slate-800">₹{subtotal}</span></div>
            <div className="flex justify-between text-xs text-slate-600"><span>Delivery Fee (Distance-Based)</span><span className="font-semibold text-slate-800">₹{deliveryFee}</span></div>
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
            <span>{isOutsideGeoFence ? '🚫 Outside Delivery Zone' : `Proceed to Secure Payment (₹{total}) ⚡`}</span>
          </button>
        </>
      )}
    </main>
  );
}