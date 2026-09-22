'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState({ name: 'Valued Customer', phone: '9108626303' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        fetch('http://localhost:5000/api/auth/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
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
    <main className="p-4 space-y-6 pb-28 bg-white min-h-screen">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h1 className="text-xl font-black text-slate-900">👤 User Profile</h1>
        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
          Verified Account
        </span>
      </div>

      {/* Profile Card displaying strictly Name and Number */}
      <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl space-y-5 shadow-sm text-center">
        <div className="w-20 h-20 bg-emerald-600 text-white text-3xl font-black rounded-full flex items-center justify-center mx-auto shadow-lg">
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>

        <div className="space-y-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Registered Name</p>
          <h2 className="text-lg font-black text-slate-900">{loading ? 'Loading...' : user.name}</h2>
        </div>

        <div className="space-y-1 pt-2 border-t border-slate-200/60">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone Number</p>
          <p className="text-sm font-bold text-slate-700 font-mono">{loading ? 'Loading...' : user.phone}</p>
        </div>
      </div>

      {/* Account Info Notice */}
      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-center space-y-1">
        <p className="text-xs font-bold text-emerald-900">🔒 Secure Account Credentials</p>
        <p className="text-[11px] text-emerald-700">Your name and number are automatically synced from your account registration.</p>
      </div>

      {/* Navigation Actions */}
      <div className="space-y-2 pt-4">
        <button
          onClick={() => router.push('/orders')}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow transition flex items-center justify-center space-x-2 active:scale-95"
        >
          <span>📦 View My Orders & Tracking</span>
        </button>

        <button
          onClick={() => {
            localStorage.removeItem('shopmatries_token');
            localStorage.removeItem('shopmatries_username');
            localStorage.removeItem('shopmatries_phone');
            router.push('/login');
          }}
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-xs py-3.5 rounded-2xl transition border border-red-200 active:scale-95"
        >
          🚪 Log Out
        </button>
      </div>
    </main>
  );
}