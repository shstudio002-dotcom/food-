'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (phone.length !== 10 || isNaN(phone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone, 
        password 
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success || data.token) {
          if (data.token) {
            localStorage.setItem('shopmatries_token', data.token);
            localStorage.setItem('shopmatries_phone', phone);
            if (data.name) {
              localStorage.setItem('shopmatries_username', data.name);
            }
          }

          // Route based on role: Admin goes to the client-admin page layout, customer goes to storefront
          if (data.isAdmin) {
            localStorage.setItem('shopmatries_is_admin', 'true');
            window.location.href = 'http://192.168.56.1:3001'; // ⚡ Redirects to your client-admin folder route
          } else {
            localStorage.removeItem('shopmatries_is_admin');
            router.push('/');
          }
        } else {
          setError(data.error || data.message || 'Invalid mobile number or password');
        }
      })
      .catch((err) => {
        console.error('Login connection error:', err);
        // Fallback local storage login if backend is offline
        localStorage.setItem('shopmatries_token', 'local-token-' + Date.now());
        localStorage.setItem('shopmatries_phone', phone);
        localStorage.setItem('shopmatries_username', 'User ' + phone.slice(-4));
        router.push('/');
      });
  };

  return (
    <div className="space-y-6 py-8 px-4">
      
      {/* Header */}
      <div className="text-center space-y-1.5">
        <span className="w-12 h-12 bg-emerald-600 rounded-2xl inline-flex items-center justify-center text-white text-xl font-black shadow-lg shadow-emerald-600/30">⚡</span>
        <h1 className="text-lg font-black text-slate-950 tracking-tight">Customer Login</h1>
        <p className="text-xs text-slate-500">Sign in with your mobile number and password.</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold p-3 rounded-2xl text-center shadow-sm">
          {error}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
        
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600 uppercase">10-Digit Mobile Number</label>
          <input 
            type="tel" 
            maxLength={10}
            placeholder="9108626303"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-mono font-bold"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600 uppercase">Password</label>
          <input 
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
            required
          />
        </div>

        <button 
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition active:scale-95 mt-2"
        >
          Sign In ⚡
        </button>

      </form>

      {/* Footer Link */}
      <p className="text-center text-xs text-slate-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-emerald-600 font-bold hover:underline">
          Register here
        </Link>
      </p>

    </div>
  );
}