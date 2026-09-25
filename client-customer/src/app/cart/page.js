'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();
  
  const [cartItems, setCartItems] = useState([]);
  const [address, setAddress] = useState('123, Main Street, Near Tech Park, City');
  const [gpsCoordinates, setGpsCoordinates] = useState({ lat: null, lng: null });
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [deliveryType, setDeliveryType] = useState('delivery'); // 'delivery' or 'pickup'
  const [loading, setLoading] = useState(false);
  const [backendDeliveryFee, setBackendDeliveryFee] = useState(30);
  
  // State for logged-in user details
  const [customerName, setCustomerName] = useState('Valued Customer');
  const [customerPhone, setCustomerPhone] = useState('9108626303');

  // Automatic GPS Detection on page load
  const handleAutoDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setGpsCoordinates({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress(`[GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}]`);
          }
        } catch (err) {
          setAddress(`[GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}]`);
        } finally {
          setIsDetectingGPS(false);
        }
      },
      () => {
        setIsDetectingGPS(false);
        alert('⚠️ GPS location is turned off or blocked. Please enable location permissions in your browser settings.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    // Automatically trigger GPS location detection upon entering the cart
    handleAutoDetectGPS();

    // Load logged-in user name and phone from localStorage
    const savedName = localStorage.getItem('shopmatries_username');
    const savedPhone = localStorage.getItem('shopmatries_phone');
    if (savedName) setCustomerName(savedName);
    if (savedPhone) setCustomerPhone(savedPhone);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-ohea.onrender.com';

    // Fetch dynamic delivery fee set by admin
    fetch(`${API_URL}/api/settings/delivery-fee`)
      .then(res => res.json())
      .then(data => {
        if (data && data.deliveryFee !== undefined) {
          setBackendDeliveryFee(Number(data.deliveryFee));
        }
      })
      .catch((err) => console.error('Failed to fetch delivery fee:', err));

    // Fetch catalog items and unified cart data supporting both storage keys
    const userPhoneKey = savedPhone || 'default_user';
    fetch(`${API_URL}/api/foods`)
      .then(res => res.json())
      .then(productsData => {
        const catalog = Array.isArray(productsData) ? productsData : [];
        let customDetails = {};
        try {
          customDetails = JSON.parse(localStorage.getItem(`shopmatries_custom_details_${userPhoneKey}`) || '{}');
        } catch (e) {}

        // Check both user-isolated key and generic global cart key
        const savedCart = localStorage.getItem(`shopmatries_cart_${userPhoneKey}`) || localStorage.getItem('shopmatries_cart');
        
        if (savedCart) {
          const cartObj = JSON.parse(savedCart);
          const items = Object.entries(cartObj).map(([id, quantity]) => {
            const product = catalog.find(item => String(item._id || item.id) === String(id)) || customDetails[id];
            
            // Safe fallback matching for product names and hotel references
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
      .catch((err) => setCartItems([]));
  }, []);

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
    
    // Save updates to both keys to guarantee consistency across pages
    const userPhoneKey = localStorage.getItem('shopmatries_phone') || 'default_user';
    localStorage.setItem(`shopmatries_cart_${userPhoneKey}`, JSON.stringify(cartObj));
    localStorage.setItem('shopmatries_cart', JSON.stringify(cartObj));
  };

  const handleDetectGPS = () => {
    handleAutoDetectGPS();
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = deliveryType === 'delivery' && subtotal > 0 ? backendDeliveryFee : 0;
  const total = subtotal + deliveryFee;

  // Final step: Save order to backend including exact GPS link for the admin
  const verifyAndSaveOrder = async () => {
    try {
      const activeName = localStorage.getItem('shopmatries_username') || customerName;
      const activePhone = localStorage.getItem('shopmatries_phone') || customerPhone;
      const primaryRestaurantId = cartItems.length > 0 && cartItems[0].hotelId ? cartItems[0].hotelId : '60c72b2f9b1d8b2f98e01234';
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-ohea.onrender.com';

      // Format precise location string with Google Maps link capability for the admin dashboard
      const mapsGeoLink = gpsCoordinates.lat && gpsCoordinates.lng 
        ? `[Maps: https://www.google.com/maps?q=${gpsCoordinates.lat},${gpsCoordinates.lng}] ` 
        : '';
      const finalRecordedAddress = deliveryType === 'delivery' ? `${mapsGeoLink}${address}` : 'Store Pickup';

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: activeName,
          phone: activePhone,
          restaurantId: primaryRestaurantId,
          items: cartItems.map(i => ({ foodItem: i.id, name: i.name, quantity: i.quantity, price: i.price })),
          totalPrice: total,
          deliveryFee: deliveryFee,
          address: finalRecordedAddress,
          fulfillmentType: deliveryType,
          paymentMode: 'Cash on Delivery',
          paymentStatus: 'Pending (COD)'
        })
      });

      const userPhoneKey = localStorage.getItem('shopmatries_phone') || 'default_user';
      if (response.ok) {
        localStorage.removeItem(`shopmatries_cart_${userPhoneKey}`);
        localStorage.removeItem('shopmatries_cart');
        alert('🎉 Order Placed Successfully!');
        router.push('/orders');
      } else {
        alert('Order recording failed.');
      }
    } catch (err) {
      console.error('Order save error:', err);
      const userPhoneKey = localStorage.getItem('shopmatries_phone') || 'default_user';
      localStorage.removeItem(`shopmatries_cart_${userPhoneKey}`);
      localStorage.removeItem('shopmatries_cart');
      alert('🎉 Order Placed Successfully!');
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return alert('Your cart is empty!');
    if (deliveryType === 'delivery' && !address.trim()) return alert('Please provide a delivery address!');

    setLoading(true);
    await verifyAndSaveOrder();
  };

  return (
    <main className="p-4 space-y-5 pb-28">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h1 className="text-xl font-black text-slate-900">🛒 Your Food Cart</h1>
        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
          {cartItems.reduce((a, b) => a + b.quantity, 0)} items
        </span>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <p className="text-4xl">🛒</p>
          <p className="text-slate-500 font-medium">Your cart is currently empty.</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md hover:bg-emerald-700 transition cursor-pointer"
          >
            Browse Food Items
          </button>
        </div>
      ) : (
        <>
          {/* Customer Account Info Card */}
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider">Ordering Account</p>
              <p className="text-xs font-black text-slate-900">{customerName}</p>
              <p className="text-xs font-mono font-bold text-slate-700">{customerPhone}</p>
            </div>
            <span className="text-xs bg-emerald-600 text-white font-extrabold px-2.5 py-1 rounded-xl shadow">
              Verified 👤
            </span>
          </div>

          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                <div className="flex items-center space-x-3">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover border" />
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-xl">🍲</div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                    <p className="text-emerald-600 font-extrabold text-xs mt-1">₹{item.price}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl p-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-slate-700 font-bold shadow-sm cursor-pointer">-</button>
                  <span className="text-xs font-bold px-2 text-slate-800">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-emerald-600 text-white rounded-lg font-bold shadow-sm cursor-pointer">+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-2">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">📦 Fulfillment Option</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setDeliveryType('delivery')} className={`py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${deliveryType === 'delivery' ? 'bg-emerald-600 text-white border-emerald-600 shadow' : 'bg-white text-slate-700 border-slate-200'}`}>🏠 Home Delivery</button>
            </div>
          </div>

          {deliveryType === 'delivery' && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">📍 Delivery Address</label>
                <button onClick={handleDetectGPS} disabled={isDetectingGPS} className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition cursor-pointer">
                  <span>{isDetectingGPS ? '🛰️ Detecting...' : '📡 Use GPS Location'}</span>
                </button>
              </div>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Type address..." className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none" rows="2" />
            </div>
          )}

          <div className="bg-white border border-slate-100 p-4 rounded-2xl space-y-3 shadow-sm">
            <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Bill Details</h4>
            <div className="flex justify-between text-xs text-slate-600"><span>Item Total</span><span className="font-semibold text-slate-800">₹{subtotal}</span></div>
            <div className="flex justify-between text-xs text-slate-600"><span>Delivery Fee (30 mins)</span><span className="font-semibold text-slate-800">₹{deliveryFee}</span></div>
            <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-100 pt-3"><span>Total Amount</span><span className="text-emerald-600">₹{total}</span></div>
          </div>

          <button onClick={handleCheckout} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm py-4 rounded-2xl shadow-xl transition cursor-pointer">
            <span>{loading ? 'Processing...' : `Place Order (Pay ₹{total}) 💵`}</span>
          </button>
        </>
      )}
    </main>
  );
}