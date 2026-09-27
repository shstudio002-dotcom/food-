'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import foodexpressLogo from '../register/images/foodexpress-logo.jpeg';
import foodexpressBottom from '../register/images/foodexpress-bottom.jpeg';

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

    // DO NOT CHANGE THIS API URL
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      'https://food-ohea.onrender.com';

    fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        password,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success || data.token) {
          if (data.token) {
            localStorage.setItem(
              'shopmatries_token',
              data.token
            );

            localStorage.setItem(
              'shopmatries_phone',
              phone
            );

            if (data.name) {
              localStorage.setItem(
                'shopmatries_username',
                data.name
              );
            }
          }

          // Keep existing admin/customer routing
          if (data.isAdmin) {
            localStorage.setItem(
              'shopmatries_is_admin',
              'true'
            );

            router.push('/admin');
          } else {
            localStorage.removeItem(
              'shopmatries_is_admin'
            );

            router.push('/');
          }
        } else {
          setError(
            data.error ||
              data.message ||
              'Invalid mobile number or password'
          );
        }
      })
      .catch((err) => {
        console.error('Login connection error:', err);

        setError(
          'Unable to connect to the server. Please check your network.'
        );
      });
  };

  return (
    <main className="min-h-screen bg-white relative overflow-hidden">

      {/* =====================================================
          DECORATIVE BACKGROUND
      ====================================================== */}

      <div className="absolute -top-8 -right-8 w-32 h-32 bg-orange-50 rounded-full pointer-events-none" />

      <div className="absolute top-32 -left-10 w-20 h-20 bg-orange-50 rounded-full pointer-events-none" />

      <div className="absolute top-24 right-16 w-3 h-3 bg-orange-400 rounded-full pointer-events-none" />


      {/* =====================================================
          MAIN CONTAINER
      ====================================================== */}

      <div className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col px-5 pt-8">


        {/* ===================================================
            FOOD EXPRESS LOGO
        ==================================================== */}

        <div className="flex justify-center mb-2">

          <img
            src={foodexpressLogo.src}
            alt="FoodExpress"
            className="w-[205px] h-auto object-contain"
          />

        </div>


        {/* ===================================================
            TAGLINE
        ==================================================== */}

        <div className="text-center mb-6">

          <p className="text-[11px] text-slate-500 font-medium tracking-wide">

            Good Food

            <span className="text-orange-500 mx-2">
              •
            </span>

            Fast Delivery

            <span className="text-orange-500 mx-2">
              •
            </span>

            Happy You

          </p>

        </div>


        {/* ===================================================
            WELCOME MESSAGE
        ==================================================== */}

        <div className="text-center mb-5">

          <h1 className="text-[26px] leading-tight font-black text-slate-950 tracking-tight">
            Welcome Back!
          </h1>

          <p className="text-xs text-slate-500 mt-2">
            Sign in with your mobile number and password.
          </p>

        </div>


        {/* ===================================================
            ERROR MESSAGE
        ==================================================== */}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-4 py-3 rounded-2xl text-center shadow-sm">
            {error}
          </div>
        )}


        {/* ===================================================
            LOGIN FORM
        ==================================================== */}

        <form
          onSubmit={handleLogin}
          className="bg-white border border-slate-200 rounded-[26px] p-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)] space-y-5"
        >

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
                  setPhone(
                    e.target.value.replace(/\D/g, '')
                  )
                }
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl py-3.5 pl-10 pr-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 font-mono font-bold tracking-wide transition"
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
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl py-3.5 pl-10 pr-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 font-semibold transition"
                required
              />

            </div>

          </div>


          {/* =================================================
              SIGN IN BUTTON
          ================================================== */}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-sm font-black py-3.5 rounded-xl shadow-lg shadow-orange-500/25 transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            Sign In

            <span className="ml-2">
              →
            </span>

          </button>

        </form>


        {/* ===================================================
            OR DIVIDER
        ==================================================== */}

        <div className="flex items-center gap-3 my-5">

          <div className="h-px bg-slate-200 flex-1" />

          <span className="text-[11px] text-slate-400 font-bold">
            OR
          </span>

          <div className="h-px bg-slate-200 flex-1" />

        </div>


        {/* ===================================================
            REGISTER LINK
        ==================================================== */}

        <p className="text-center text-xs text-slate-500">

          Don&apos;t have an account?

          <Link
            href="/register"
            className="text-red-500 font-black ml-1 hover:text-orange-500 hover:underline transition"
          >
            Register here
          </Link>

        </p>


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