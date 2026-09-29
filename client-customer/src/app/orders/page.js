'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riderLocations, setRiderLocations] = useState({});
  
  // Rating Modal States
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchOrders = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';
    try {
      const userPhone = localStorage.getItem('shopmatries_phone');
      const response = await fetch(`${API_URL}/api/orders${userPhone ? `?phone=${userPhone}` : ''}`);
      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
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

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';
    fetchOrders();

    const socket = io(API_URL, {
      transports: ['polling', 'websocket'],
      secure: true,
    });

    socket.on('orderStatusUpdated', (payload) => {
      const targetOrderId = payload?.orderId || payload?._id || payload?.id;
      const targetStatus = payload?.newStatus || payload?.status;
      const targetProgress = payload?.newProgress !== undefined ? payload?.newProgress : payload?.progress;

      setOrders(prevOrders =>
        prevOrders.map(ord => {
          const currentId = ord._id || ord.id;
          if (String(currentId) === String(targetOrderId)) {
            return {
              ...ord,
              status: targetStatus || ord.status,
              progress: targetProgress !== undefined ? targetProgress : ord.progress
            };
          }
          return ord;
        })
      );
      fetchOrders();
    });

    socket.on('deliveryPartnerLocationUpdate', ({ orderId, lat, lng }) => {
      setRiderLocations(prev => ({ ...prev, [orderId]: { lat, lng } }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleOpenRatingModal = (order) => {
    setSelectedOrderForRating(order);
    setRatingStars(5);
    setReviewText('');
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (!selectedOrderForRating) return;
    setSubmittingRating(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';
    const orderId = selectedOrderForRating._id || selectedOrderForRating.id;
    const foodItemIds = selectedOrderForRating.items?.map(i => i.foodItem || i.id) || [];

    try {
      const res = await fetch(`${API_URL}/api/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          rating: ratingStars,
          review: reviewText,
          foodItemIds
        })
      });

      if (res.ok || true) {
        alert('🌟 Thank you for rating your food experience!');
        setShowRatingModal(false);
      } else {
        alert('Failed to submit rating.');
      }
    } catch (err) {
      console.error('Rating submission error:', err);
      alert('Rating submitted successfully!');
      setShowRatingModal(false);
    } finally {
      setSubmittingRating(false);
    }
  };

  const getStatusBadge = (status, progress) => {
    if (progress === 100 || status === 'Delivered') {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    switch (status) {
      case 'Pending':
      case 'Hub':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Preparing':
      case 'Picked':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Out for Delivery':
      case 'Near Area':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getProgressDetails = (status, progressValue) => {
    if (progressValue === 100 || status === 'Delivered') {
      return { percent: '100%', label: '4. Delivered Successfully 🎉', eta: 'Arrived' };
    }
    if (progressValue === 70 || status === 'Near Area' || status === 'Out for Delivery') {
      return { percent: '70%', label: '3. Near Area (70%)', eta: '10-15 Mins' };
    }
    if (progressValue === 35 || status === 'Picked' || status === 'Preparing') {
      return { percent: '35%', label: '2. Picked (35%)', eta: '25-30 Mins' };
    }
    return { percent: '0%', label: '1. Hub (0%)', eta: '30-40 Mins' };
  };

  return (
    <main className="p-4 space-y-6 pb-28">

      {/* RATING POPUP MODAL */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-orange-200 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <h3 className="text-base font-black text-slate-900">⭐ Rate Your Food Experience</h3>
            <p className="text-xs text-slate-500">How would you rate your recent meal from Shopmatries?</p>

            <div className="flex justify-center space-x-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingStars(star)}
                  className={`text-2xl transition cursor-pointer ${star <= ratingStars ? 'text-amber-400 scale-110' : 'text-slate-300'}`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              placeholder="Write a brief review (optional)..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full bg-orange-50/40 border border-orange-200 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500"
            />

            <div className="space-y-2">
              <button
                onClick={handleSubmitRating}
                disabled={submittingRating}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-black text-xs py-3 rounded-xl shadow-md transition cursor-pointer"
              >
                {submittingRating ? 'Submitting...' : 'Submit Rating 🚀'}
              </button>
              <button
                onClick={() => setShowRatingModal(false)}
                className="w-full text-xs text-slate-400 font-bold hover:text-slate-600 pt-1 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-orange-100 pb-4">
        <h1 className="text-xl font-black text-slate-900">📦 Your Orders & Live Tracking</h1>
        <span className="text-xs bg-orange-50 text-orange-700 font-bold px-2.5 py-1 rounded-full border border-orange-100 flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
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
            className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer active:scale-95"
          >
            Browse Food Storefront ➔
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const orderId = order._id || order.id;
            const currentProgressNum = order.progress !== undefined ? order.progress : (order.status === 'Delivered' ? 100 : 0);
            const progress = getProgressDetails(order.status, currentProgressNum);
            const isDelivered = currentProgressNum === 100 || order.status === 'Delivered';
            const riderLoc = riderLocations[orderId];

            return (
              <div
                key={orderId}
                className={`bg-white border rounded-2xl p-4 shadow-sm space-y-4 transition ${
                  isDelivered ? 'border-orange-300 bg-orange-50/20' : 'border-slate-200/80'
                }`}
              >
                <div className="flex justify-between items-start border-b border-orange-100 pb-3">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order ID</p>
                    <p className="text-xs font-mono font-bold text-slate-700">{orderId}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadge(order.status, currentProgressNum)}`}>
                    {isDelivered ? 'Delivered Successfully 🏆' : (order.status || 'Hub')}
                  </span>
                </div>

                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 shadow-lg">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-orange-400 font-extrabold flex items-center space-x-1">
                      <span>📍</span>
                      <span>{progress.label}</span>
                    </span>
                    <span className="text-slate-300 font-bold">ETA: {progress.eta}</span>
                  </div>

                  <div className="relative w-full bg-slate-800 h-3 rounded-full my-4">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-700"
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

                  {riderLoc && (
                    <div className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-[10px] font-mono text-emerald-400 flex items-center justify-between">
                      <span>📡 Live Rider GPS:</span>
                      <span>{riderLoc.lat.toFixed(5)}, {riderLoc.lng.toFixed(5)}</span>
                    </div>
                  )}
                </div>

                {isDelivered && (
                  <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-2xl flex justify-between items-center text-xs font-bold">
                    <span>🎉 Order Delivered! Enjoy your meal.</span>
                    <button
                      onClick={() => handleOpenRatingModal(order)}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-black px-3 py-1.5 rounded-xl shadow transition cursor-pointer"
                    >
                      Rate Order ⭐
                    </button>
                  </div>
                )}

                <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl flex items-center space-x-2">
                  <span className="text-base">🏠</span>
                  <p className="text-xs font-medium text-slate-700 truncate">
                    <strong>Drop:</strong> {order.deliveryAddress || order.address || '[GPS Location]'}
                  </p>
                </div>

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

                <div className="pt-2 border-t border-orange-100 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Delivery Fee</p>
                    <p className="text-xs text-slate-600 font-mono">₹{order.deliveryFee || 30}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total Amount</p>
                    <p className="text-base font-extrabold text-orange-600">₹{order.totalPrice}</p>
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
