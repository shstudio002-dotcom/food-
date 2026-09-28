'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import foodexpressLogo from './images/foodexpress-logo.jpeg';
import foodexpressBottom from './images/foodexpress-bottom.jpeg';

export default function AdminRegisterPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const router = useRouter();

  const handleRegister = (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (phone.length !== 10 || isNaN(phone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      'https://food-cgs4.onrender.com';

    fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        phone,
        password,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        localStorage.setItem('shopmatries_username', name);
        localStorage.setItem('shopmatries_phone', phone);
        localStorage.setItem(
          'shopmatries_token',
          data.token || 'token-' + Date.now()
        );

        setMessage('Account created successfully! Redirecting...');

        setTimeout(() => {
          router.push('/login');
        }, 2000);
      })
      .catch((err) => {
        console.error('Registration connection error:', err);

        localStorage.setItem('shopmatries_username', name);
        localStorage.setItem('shopmatries_phone', phone);
        localStorage.setItem(
          'shopmatries_token',
          'local-token-' + Date.now()
        );

        setMessage('Account created locally! Redirecting...');

        setTimeout(() => {
          router.push('/login');
        }, 2000);
      });
  };

  return (
    <main className="min-h-screen bg-white relative overflow-hidden">

      {/* =====================================================
          DECORATIVE TOP CORNER
      ====================================================== */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-orange-50 rounded-bl-[70px] pointer-events-none" />

      <div className="absolute top-24 left-0 w-16 h-16 bg-orange-50 rounded-r-full pointer-events-none" />

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <div className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col px-5 pt-7">

        {/* ===================================================
            FOOD EXPRESS LOGO
        ==================================================== */}
        <div className="flex justify-center mb-3">

          <img
            src={foodexpressLogo.src}
            alt="FoodExpress"
            className="w-[210px] h-auto object-contain"
          />

        </div>

        {/* ===================================================
            BRAND TAGLINE
        ==================================================== */}
        <div className="text-center mb-5">

          <p className="text-[11px] text-slate-500 font-medium tracking-wide">
            Good Food
            <span className="text-orange-500 mx-2">•</span>
            Fast Delivery
            <span className="text-orange-500 mx-2">•</span>
            Happy You
          </p>

        </div>

        {/* ===================================================
            PAGE TITLE
        ==================================================== */}
        <div className="text-center mb-5">

          <h1 className="text-[25px] leading-tight font-black text-slate-950 tracking-tight">
            Create Account
          </h1>

          <p className="text-xs text-slate-500 mt-2">
            Create your account and start ordering delicious food.
          </p>

        </div>

        {/* ===================================================
            ERROR MESSAGE
        ==================================================== */}
        {error && (
          <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold px-4 py-3 rounded-2xl text-center shadow-sm">
            {error}
          </div>
        )}

        {/* ===================================================
            SUCCESS MESSAGE
        ==================================================== */}
        {message && (
          <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold px-4 py-3 rounded-2xl text-center shadow-sm">
            {message}
          </div>
        )}

        {/* ===================================================
            REGISTER FORM
        ==================================================== */}
        <form
          onSubmit={handleRegister}
          className="bg-white border border-orange-100 rounded-[26px] p-5 shadow-[0_8px_30px_rgba(234,88,12,0.08)] space-y-4"
        >

          {/* FULL NAME */}
          <div className="space-y-1.5">

            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wide">
              Full Name
            </label>

            <div className="relative">

              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-500 text-sm">
                👤
              </span>

              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-orange-50/30 border border-orange-200 text-slate-900 text-xs rounded-xl py-3.5 pl-10 pr-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 font-semibold transition"
                required
              />

            </div>

          </div>

          {/* MOBILE NUMBER */}
          <div className="space-y-1.5">

            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wide">
              10-Digit Mobile Number
            </label>

            <div className="relative">

              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-500 text-sm">
                📞
              </span>

              <input
                type="tel"
                maxLength={10}
                inputMode="numeric"
                placeholder="Enter mobile number"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, ''))
                }
                className="w-full bg-orange-50/30 border border-orange-200 text-slate-900 text-xs rounded-xl py-3.5 pl-10 pr-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 font-mono font-bold tracking-wide transition"
                required
              />

            </div>

          </div>

          {/* PASSWORD */}
          <div className="space-y-1.5">

            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wide">
              Password
            </label>

            <div className="relative">

              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-500 text-sm">
                🔒
              </span>

              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-orange-50/30 border border-orange-200 text-slate-900 text-xs rounded-xl py-3.5 pl-10 pr-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 font-semibold transition"
                required
              />

            </div>

          </div>

          {/* CONFIRM PASSWORD */}
          <div className="space-y-1.5">

            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wide">
              Confirm Password
            </label>

            <div className="relative">

              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-500 text-sm">
                🔐
              </span>

              <input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-orange-50/30 border border-orange-200 text-slate-900 text-xs rounded-xl py-3.5 pl-10 pr-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 font-semibold transition"
                required
              />

            </div>

          </div>

          {/* REGISTER BUTTON */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-sm font-black py-3.5 rounded-xl shadow-lg shadow-orange-500/25 transition-all duration-200 active:scale-[0.98] mt-2 cursor-pointer"
          >
            Create Account
            <span className="ml-2">→</span>
          </button>

        </form>

        {/* ===================================================
            LOGIN LINK
        ==================================================== */}
        <div className="text-center mt-5">

          <p className="text-xs text-slate-500">

            Already have an account?

            <Link
              href="/login"
              className="text-orange-600 font-black ml-1 hover:text-orange-700 hover:underline transition"
            >
              Sign In
            </Link>

          </p>

        </div>

        {/* ===================================================
            BOTTOM FOOD ILLUSTRATION
        ==================================================== */}
        <div className="relative mt-auto -mx-5 pt-4">

          <img
            src={foodexpressBottom.src}
            alt="FoodExpress food"
            className="w-full h-auto object-cover object-bottom"
          />

        </div>

      </div>

    </main>
  );
}