'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: 'Valued Customer',
    phone: '9108626303'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      'https://food-cgs4.onrender.com';

    try {
      const savedName = localStorage.getItem('shopmatries_username');
      const savedPhone = localStorage.getItem('shopmatries_phone');

      if (savedName || savedPhone) {
        setUser({
          name: savedName || 'Valued Customer',
          phone: savedPhone || '9108626303'
        });

        setLoading(false);
      } else {
        // Fallback fetch from backend if localStorage is empty
        const token = localStorage.getItem('shopmatries_token');

        fetch(`${API_URL}/api/auth/profile`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {})
          }
        })
          .then(res => res.json())
          .then(data => {
            if (data && (data.name || data.phone)) {
              setUser({
                name: data.name || 'Valued Customer',
                phone: data.phone || '9108626303'
              });
            }
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    } catch (e) {
      setLoading(false);
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white p-4 pb-28 space-y-5">

      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-orange-100 pb-4">

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
            <span className="text-lg">👤</span>
          </div>

          <div>
            <h1 className="text-lg font-black text-slate-900">
              User Profile
            </h1>

            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Account Information
            </p>
          </div>
        </div>

        <span className="text-[10px] bg-orange-100 text-orange-700 font-extrabold px-3 py-1.5 rounded-full border border-orange-200">
          ✓ Verified Account
        </span>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-orange-100 p-6 rounded-[28px] shadow-sm text-center relative overflow-hidden">

        {/* Decorative background */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-orange-100/50 rounded-full" />

        <div className="absolute -bottom-20 -left-16 w-40 h-40 bg-orange-50 rounded-full" />

        {/* Avatar */}
        <div className="relative">

          <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 text-white text-4xl font-black rounded-full flex items-center justify-center mx-auto shadow-lg shadow-orange-200 border-4 border-white">
            {user.name
              ? user.name.charAt(0).toUpperCase()
              : 'U'}
          </div>

          {/* Verified badge */}
          <div className="absolute bottom-0 left-1/2 translate-x-7 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow">
            <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-[8px] font-black">
                ✓
              </span>
            </div>
          </div>

        </div>

        {/* Name */}
        <div className="mt-5 space-y-1">

          <p className="text-[10px] text-orange-500 font-extrabold uppercase tracking-widest">
            Registered Name
          </p>

          <h2 className="text-xl font-black text-slate-900">
            {loading ? 'Loading...' : user.name}
          </h2>

        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 my-5" />

        {/* Phone */}
        <div className="space-y-1">

          <p className="text-[10px] text-orange-500 font-extrabold uppercase tracking-widest">
            Phone Number
          </p>

          <p className="text-sm font-black text-slate-700 font-mono tracking-wide">
            {loading ? 'Loading...' : user.phone}
          </p>

        </div>

      </div>

      {/* Secure Account Notice */}
      <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl text-center shadow-sm">

        <div className="flex items-center justify-center gap-2 mb-1">

          <span className="text-sm">
            🔒
          </span>

          <p className="text-xs font-black text-orange-900">
            Secure Account Credentials
          </p>

        </div>

        <p className="text-[10px] leading-4 text-orange-700">
          Your name and number are automatically synced from your account registration.
        </p>

      </div>

      {/* Account Actions */}
      <div className="space-y-3 pt-1">

        {/* Orders */}
        <button
          onClick={() => router.push('/orders')}
          className="w-full bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs py-4 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <span className="text-base">
            📦
          </span>

          <span>
            View My Orders & Tracking
          </span>

          <span className="text-slate-400">
            ›
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={() => {
            localStorage.removeItem('shopmatries_token');
            localStorage.removeItem('shopmatries_username');
            localStorage.removeItem('shopmatries_phone');
            router.push('/login');
          }}
          className="w-full bg-white hover:bg-orange-50 text-orange-600 font-extrabold text-xs py-4 rounded-2xl transition border border-orange-200 shadow-sm active:scale-[0.98]"
        >
          <span className="text-base mr-2">
            🚪
          </span>

          Log Out
        </button>

      </div>

      {/* Bottom Account Status */}
      <div className="text-center pt-1">

        <p className="text-[9px] text-slate-400 font-medium">
          Your account information is securely managed.
        </p>

      </div>

    </main>
  );
}