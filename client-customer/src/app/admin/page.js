'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Import or embed your admin dashboard content here
import AdminLiveOrders from '../../../client/admin/src/app/page.js'; // Adjust relative path to your nested folder

export default function AdminPageWrapper() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const isAdmin = localStorage.getItem('shopmatries_is_admin') === 'true';
    const token = localStorage.getItem('shopmatries_token');

    if (!token) {
      router.push('/login');
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Renders your exact admin panel seamlessly on the /admin link */}
      <AdminLiveOrders />
    </div>
  );
}