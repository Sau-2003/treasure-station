'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// SET YOUR UNTOUCHABLE MASTER ADMIN NUMBER HERE
const MASTER_ADMIN = "8889726554";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCheckingLogin, setIsCheckingLogin] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (localStorage.getItem('isAdmin') === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanPhone = phoneInput.trim();
    setIsCheckingLogin(true);

    // ✅ 1. MASTER ADMIN BYPASS: If it's the master number, log them in instantly
    if (cleanPhone === MASTER_ADMIN) {
      setIsAuthenticated(true);
      localStorage.setItem('isAdmin', 'true');
      setIsCheckingLogin(false);
      return;
    }

    // ✅ 2. DATABASE CHECK: For all other admins
    const { data, error } = await supabase
      .from('admin_numbers')
      .select('phone_number')
      .eq('phone_number', cleanPhone)
      .single();

    if (data) {
      setIsAuthenticated(true);
      localStorage.setItem('isAdmin', 'true');
    } else {
      alert('Unauthorized phone number.');
      setPhoneInput('');
    }
    
    setIsCheckingLogin(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    setIsAuthenticated(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <form onSubmit={handleLogin} className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Login</h1>
          <input
            type="tel"
            placeholder="Enter Admin Phone Number"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            className="w-full border p-3 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
            required
            disabled={isCheckingLogin}
          />
          <button 
            type="submit" 
            disabled={isCheckingLogin}
            className="w-full bg-blue-900 text-white p-3 rounded font-semibold hover:bg-blue-800 transition disabled:opacity-50"
          >
            {isCheckingLogin ? 'Checking...' : 'Unlock Admin Panel'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <div className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center shadow-md z-40">
        <div className="font-bold text-lg tracking-wide">Treasure Hunt</div>
        <button onClick={() => setIsSidebarOpen(true)} className="text-white focus:outline-none p-1">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col shadow-xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 text-xl font-bold border-b border-gray-800 tracking-wide flex justify-between items-center">
          <span>Admin</span>
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/admin" className={`block p-3 rounded transition-colors ${pathname === '/admin' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>Manage Guests</Link>
          <Link href="/admin/phones" className={`block p-3 rounded transition-colors ${pathname === '/admin/phones' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>Manage Admins</Link>
        </nav>
        
        <div className="p-4 border-t border-gray-800 flex flex-col gap-3">
          <Link href="/" className="w-full text-center bg-gray-700 hover:bg-gray-600 text-white p-2.5 rounded transition font-medium">Back to Main Page</Link>
          <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white p-2.5 rounded transition font-medium">Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}