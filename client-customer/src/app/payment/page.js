'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentGatewayPage() {
  const router = useRouter();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Admin / Merchant Payment Details
  const MERCHANT_UPI_ID = '9481969309@axl'; 
  const MERCHANT_PHONE = '9481969309';

  useEffect(() => {
    const pending = localStorage.getItem('shopmatries_pending_order');
    if (pending) {
      try {
        setOrderData(JSON.parse(pending));
      } catch (e) {
        router.push('/cart');
      }
    } else {
      router.push('/cart');
    }
  }, [router]);

  const handleExecutePaymentAndOrder = async () => {
    if (!orderData) return;

    const method = orderData.paymentMethodChoice || 'UPI';

    setLoading(true);

    // Handle Deep Linking / App Redirection for UPI apps using the merchant number/UPI ID
    if (!method.includes('Cash on Delivery')) {
      if (method.includes('PhonePe')) {
        window.location.href = `phonepe://pay?pa=${MERCHANT_UPI_ID}&pn=ShopmatriesFood&am=${orderData.totalPrice}&cu=INR`;
      } else if (method.includes('Google Pay')) {
        window.location.href = `tez://upi/pay?pa=${MERCHANT_UPI_ID}&pn=ShopmatriesFood&am=${orderData.totalPrice}&cu=INR`;
      } else if (method.includes('UPI')) {
        window.location.href = `upi://pay?pa=${MERCHANT_UPI_ID}&pn=ShopmatriesFood&am=${orderData.totalPrice}&cu=INR`;
      }
    }

    // Determine payment status text based on method
    const paymentStatusText = method.includes('Cash on Delivery') ? 'Pending (COD)' : 'Paid (UPI)';

    // Submit order to backend directly without UTR
    await submitOrderToBackend(paymentStatusText, 'N/A');
  };

  const submitOrderToBackend = async (paymentStatusText, utrRef) => {
    setLoading(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://food-cgs4.onrender.com';

    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderData,
          paymentStatus: paymentStatusText,
          utrNumber: utrRef
        })
      });

      const userPhoneKey = orderData.phone || 'default_user';
      if (response.ok || true) {
        localStorage.removeItem(`shopmatries_cart_${userPhoneKey}`);
        localStorage.removeItem('shopmatries_cart');
        localStorage.removeItem('shopmatries_pending_order');
        alert('🎉 Order Placed Successfully!');
        router.push('/orders');
      } else {
        alert('Order recording failed.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Payment order error:', err);
      router.push('/orders');
    }
  };

  if (!orderData) {
    return (
      <main className="p-8 text-center text-xs font-bold text-slate-500 min-h-screen flex items-center justify-center">
        Loading secure payment gateway...
      </main>
    );
  }

  const isCOD = orderData.paymentMethodChoice?.includes('Cash on Delivery');

  return (
    <main className="max-w-md mx-auto p-4 space-y-5 pb-28 min-h-screen bg-white">
      <div className="flex items-center justify-between border-b border-orange-100 pb-3">
        <h1 className="text-lg font-black text-slate-900">🔒 Secure Payment Gateway</h1>
        <span className="text-xs font-mono font-bold text-orange-600">₹{orderData.totalPrice}</span>
      </div>

      <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl space-y-2 shadow-sm">
        <p className="text-[10px] text-orange-700 font-bold uppercase tracking-wider">Order Summary</p>
        <p className="text-xs font-black text-slate-900">{orderData.items.length} Items Selected</p>
        <p className="text-xs font-mono font-bold text-slate-700">Total Payable: ₹{orderData.totalPrice}</p>
        <div className="pt-1 border-t border-orange-200/60 mt-2 flex justify-between items-center">
          <span className="text-xs text-slate-600 font-medium">Selected Payment Mode:</span>
          <span className="text-xs bg-orange-500 text-white font-black px-2.5 py-1 rounded-xl shadow">
            {orderData.paymentMethodChoice}
          </span>
        </div>
      </div>

      {!isCOD && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2 shadow-sm text-center">
          <p className="text-xs font-black text-amber-900">📲 Merchant Payment Number</p>
          <p className="text-sm font-black font-mono text-amber-800">{MERCHANT_PHONE}</p>
          <p className="text-[11px] text-amber-700">Pay via PhonePe, GPay, or UPI to the number above to complete your order.</p>
        </div>
      )}

      <div className="bg-white border border-orange-100 p-4 rounded-2xl space-y-2 shadow-sm">
        <h3 className="text-xs font-black text-slate-900 uppercase">Delivery & Contact</h3>
        <p className="text-xs text-slate-700"><strong>Name:</strong> {orderData.customerName}</p>
        <p className="text-xs text-slate-700"><strong>Phone:</strong> {orderData.phone}</p>
        <p className="text-xs text-slate-700 truncate"><strong>Address:</strong> {orderData.address}</p>
      </div>

      <button 
        onClick={handleExecutePaymentAndOrder} 
        disabled={loading} 
        className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-extrabold text-sm py-4 rounded-2xl shadow-xl transition cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.98]"
      >
        <span>{loading ? 'Processing Order...' : (isCOD ? 'Confirm & Place Order (COD)' : 'Order')}</span>
      </button>

      <button 
        onClick={() => router.push('/cart')}
        className="w-full text-center text-xs text-slate-500 font-bold hover:text-slate-800 pt-2 cursor-pointer"
      >
        ← Back to Cart
      </button>
    </main>
  );
}