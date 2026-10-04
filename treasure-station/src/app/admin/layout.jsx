'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// 👑 FIXED: Number is now exactly 8889726554
const MASTER_ADMIN = "8889726554";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const capitalizeName = (str) => {
  if (!str) return '';
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

export default function AdminLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState({ name: '', phone: '' }); 
  
  const [nameInput, setNameInput] = useState('');   
  const [phoneInput, setPhoneInput] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [isCheckingLogin, setIsCheckingLogin] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const isAuth = localStorage.getItem('isAdmin') === 'true';
    if (isAuth) {
      setIsAuthenticated(true);
      setAdminData({
        name: localStorage.getItem('adminName') || 'Admin',
        phone: localStorage.getItem('adminPhone') || 'Unknown'
      });
    }
    setLoading(false);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanPhone = phoneInput.trim();
    const cleanName = capitalizeName(nameInput.trim()) || 'Admin'; 
    setIsCheckingLogin(true);

    if (cleanPhone === MASTER_ADMIN) {
      setIsAuthenticated(true);
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('adminName', cleanName); 
      localStorage.setItem('adminPhone', cleanPhone);
      setAdminData({ name: cleanName, phone: cleanPhone });
      setIsCheckingLogin(false);
      return;
    }

    const { data, error } = await supabase
      .from('admin_numbers')
      .select('phone_number, name')
      .eq('phone_number', cleanPhone)
      .single();

    if (data) {
      const finalName = nameInput.trim() ? cleanName : capitalizeName(data.name || 'Volunteer Admin');
      
      setIsAuthenticated(true);
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('adminName', finalName);
      localStorage.setItem('adminPhone', data.phone_number);
      setAdminData({ name: finalName, phone: data.phone_number });
    } else {
      alert('Unauthorized phone number.');
      setPhoneInput('');
    }
    
    setIsCheckingLogin(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setAdminData({ name: '', phone: '' });
    setNameInput(''); 
    setPhoneInput('');
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <form onSubmit={handleLogin} className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Login</h1>
          
          <div className="flex flex-col gap-4 mb-6">
            <input
              type="text"
              placeholder="Name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg"
              required
              disabled={isCheckingLogin}
            />

            <input
              type="tel"
              placeholder="Number"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
              required
              disabled={isCheckingLogin}
            />
          </div>

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
        <button onClick={() => setIsSidebarOpen(true)} className="text-white p-1">☰</button>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col shadow-xl transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 text-xl font-bold border-b border-gray-800 flex justify-between items-center">
          <span>Admin Panel</span>
          <button className="md:hidden text-gray-400" onClick={() => setIsSidebarOpen(false)}>✕</button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="block p-3 rounded hover:bg-gray-800">Manage Guests</Link>
          <Link href="/admin/phones" className="block p-3 rounded hover:bg-gray-800">Manage Admins</Link>
        </nav>
        
        <div className="p-4 border-t border-gray-800">
          <div className="bg-gray-800 p-3 rounded mb-3">
            <p className="text-gray-400 text-xs font-bold mb-1">LOGGED IN AS</p>
            <p className="font-bold text-white">{adminData.name}</p>
            <p className="text-gray-400 text-sm">{adminData.phone}</p>
          </div>
          <Link href="/" className="block text-center bg-gray-700 hover:bg-gray-600 text-white p-2 mb-2 rounded font-medium">Main Page</Link>
          <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white p-2 rounded font-medium">Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}