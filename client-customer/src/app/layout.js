'use client';
import './globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }) {
  const pathname = usePathname();

  // Hide bottom navigation bar on login, register, and admin pages
  const isAdminRoute = pathname?.startsWith('/admin');
  const hideNavBar = pathname === '/login' || pathname === '/register' || isAdminRoute;

  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <title>Shopmatries Food Delivery</title>
      </head>
      
      {/* Outer theatrical background wrapper */}
      <body className="bg-slate-950 text-slate-900 h-dvh w-screen m-0 p-0 flex justify-center items-center antialiased overflow-hidden selection:bg-emerald-500 selection:text-white">
        
        {isAdminRoute ? (
          /* ⚡ Full Screen Independent Layout for Admin Dashboard */
          <main className="w-full h-full bg-white overflow-y-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {children}
          </main>
        ) : (
          /* Responsive App Frame Container */
          <div className="w-full h-full sm:h-[92vh] sm:max-h-[880px] sm:w-[410px] sm:rounded-[40px] bg-white shadow-2xl relative flex flex-col justify-between border-0 sm:border-[8px] border-slate-900 overflow-hidden">
            
            {/* Scrollable Content Area */}
            <main className="flex-1 overflow-y-auto relative bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {children}
            </main>

            {/* Stationary Bottom Function & Navigation Bar (Hidden on Login & Register) */}
            {!hideNavBar && (
              <nav 
                id="bottom-nav-bar"
                className="shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-100 flex justify-around items-center py-2 px-2 z-35 shadow-lg transition-all duration-300"
              >
                <Link 
                  href="/" 
                  className={`flex flex-col items-center py-1 px-4 rounded-xl transition ${pathname === '/' ? 'text-emerald-600 font-bold scale-105' : 'text-slate-400 font-medium hover:text-slate-600'}`}
                >
                  <span className="text-base">🏠</span>
                  <span className="text-[10px]">Home</span>
                </Link>

                <Link 
                  href="/orders" 
                  className={`flex flex-col items-center py-1 px-4 rounded-xl transition ${pathname === '/orders' ? 'text-emerald-600 font-bold scale-105' : 'text-slate-400 font-medium hover:text-slate-600'}`}
                >
                  <span className="text-base">📦</span>
                  <span className="text-[10px]">Orders</span>
                </Link>

                <Link 
                  href="/profile" 
                  className={`flex flex-col items-center py-1 px-4 rounded-xl transition ${pathname === '/profile' ? 'text-emerald-600 font-bold scale-105' : 'text-slate-400 font-medium hover:text-slate-600'}`}
                >
                  <span className="text-base">👤</span>
                  <span className="text-[10px]">Profile</span>
                </Link>
              </nav>
            )}

          </div>
        )}

      </body>
    </html>
  );
}