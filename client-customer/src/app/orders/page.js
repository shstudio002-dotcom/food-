'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riderLocations, setRiderLocations] = useState({});

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Retrieve the unique logged-in user phone number for account isolation
        const userPhone = localStorage.getItem('shopmatries_phone');
        
        const response = await fetch(`http://localhost:5000/api/orders${userPhone ? `?phone=${userPhone}` : ''}`);
        const data = await response.json();
        
        if (response.ok && Array.isArray(data)) {
          // Filter strictly by user phone to ensure account data isolation
          const isolatedOrders = userPhone 
            ? data.filter(ord => !ord.phone || ord.phone === userPhone)
            : data;
          setOrders(isolatedOrders);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error('Failed to fetch orders from backend:', err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    const socket = io('http://localhost:5000');

    socket.on('orderStatusUpdated', ({ orderId, newStatus }) => {
      setOrders(prevOrders => 
        prevOrders.map(ord => (ord._id === orderId || ord.id === orderId) ? { ...ord, status: newStatus } : ord)
      );
    });

    socket.on('deliveryPartnerLocationUpdate', ({ orderId, lat, lng }) => {
      setRiderLocations(prev => ({
        ...prev,
        [orderId]: { lat, lng }
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Preparing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Out for Delivery': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getProgressDetails = (status) => {
    switch (status) {
      case 'Pending': return { percent: '0%', label: '1. Hub (0%)', eta: '30-40 Mins' };
      case 'Accepted': 
      case 'Preparing': return { percent: '35%', label: '2. Picked (35%)', eta: '25-30 Mins' };
      case 'Out for Delivery': return { percent: '70%', label: '3. Near Area (70%)', eta: '10-15 Mins' };
      case 'Delivered': return { percent: '100%', label: '4. Delivered (100%)', eta: 'Arrived' };
      default: return { percent: '0%', label: 'Hub (0%)', eta: '30 Mins' };
    }
  };

  return (
    <main className="p-4 space-y-6 pb-28">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h1 className="text-xl font-black text-slate-900">📦 Your Orders & Live Tracking</h1>
        <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-100 flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live Socket Active</span>
        </span>
      </div>

      {loading ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-sm text-slate-500 font-bold animate-pulse">Loading your active orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <p className="text-4xl">📦</p>
          <p className="text-slate-500 font-medium text-xs">You have not placed any orders from this account yet.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition"
          >
            Browse Food Storefront ➔
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const orderId = order._id || order.id;
            const progress = getProgressDetails(order.status);

            return (
              <div key={orderId} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-4">
                
                {/* Order Header / ID & Status */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order ID</p>
                    <p className="text-xs font-mono font-bold text-slate-700">{orderId}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadge(order.status)}`}>
                    {order.status || 'Hub'}
                  </span>
                </div>

                {/* Straight Line Live Tracking Bar */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 shadow-lg">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-400 font-extrabold flex items-center space-x-1">
                      <span>📍</span>
                      <span>{progress.label}</span>
                    </span>
                    <span className="text-slate-300 font-bold">ETA: {progress.eta}</span>
                  </div>

                  {/* Straight Bar Track Container */}
                  <div className="relative w-full bg-slate-800 h-3 rounded-full my-4">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                      style={{ width: progress.percent }}
                    ></div>
                    
                    <div 
                      className="absolute -top-3.5 transition-all duration-700 -ml-3 flex flex-col items-center"
                      style={{ left: progress.percent }}
                    >
                      <span className="text-lg bg-amber-400 rounded-full p-1 shadow-md animate-bounce">🛵</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-[10px] font-bold text-slate-400 pt-1">
                    <span>Hub (0%)</span>
                    <span>Picked (35%)</span>
                    <span>Near Area (70%)</span>
                    <span>Delivered (100%)</span>
                  </div>
                </div>

                {/* Drop Address Box */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center space-x-2">
                  <span className="text-base">🏠</span>
                  <p className="text-xs font-medium text-slate-700 truncate">
                    <strong>Drop:</strong> {order.deliveryAddress || order.address || '[GPS Location]'}
                  </p>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Ordered Items</p>
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                    {order.items && order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-700">
                        <span>{item.quantity || 1}x {item.foodItem?.name || item.name || 'Food Item'}</span>
                        <span className="font-semibold text-slate-900">₹{(item.price || 0) * (item.quantity || 1)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Fee & Total */}
                <div className="pt-2 border-t border-slate-100 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Delivery Fee</p>
                    <p className="text-xs text-slate-600 font-mono">₹{order.deliveryFee || 30}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total Amount</p>
                    <p className="text-base font-extrabold text-emerald-600">₹{order.totalPrice}</p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}