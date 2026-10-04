'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

//  SET YOUR UNTOUCHABLE MASTER ADMIN NUMBER HERE TOO
const MASTER_ADMIN = "8889726554";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ManagePhones() {
  const [phones, setPhones] = useState([]);
  const [newPhone, setNewPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Fetch current admin numbers
  useEffect(() => {
    const fetchPhones = async () => {
      const { data, error } = await supabase
        .from('admin_numbers')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error(error);
        setMessage('Error loading admin phone numbers.');
      } else {
        // Automatically inject the Master Admin into the UI if it isn't in the database
        const hasMaster = data?.some(p => p.phone_number === MASTER_ADMIN);
        const displayData = data || [];
        if (!hasMaster) {
          displayData.unshift({ id: 'master', phone_number: MASTER_ADMIN });
        }
        setPhones(displayData);
      }
      setLoading(false);
    };

    fetchPhones();
  }, []);

  // Add a new phone number
  const handleAddPhone = async (e) => {
    e.preventDefault();
    const cleanPhone = newPhone.trim();
    
    if (!cleanPhone) return;

    if (phones.some(p => p.phone_number === cleanPhone)) {
      setMessage('⚠️ This number is already an admin.');
      return;
    }

    setMessage('Adding new admin...');
    const { data, error } = await supabase
      .from('admin_numbers')
      .insert([{ phone_number: cleanPhone }])
      .select();

    if (error) {
      setMessage(`❌ Error: ${error.message}`);
    } else {
      setMessage(`✅ Success: Added ${cleanPhone} as an admin!`);
      setNewPhone('');
      setPhones([...phones, data[0]]);
    }
  };

  // Remove a phone number
  const handleDelete = async (id, phoneStr) => {
    // 🛡️ Extra security check just in case
    if (phoneStr === MASTER_ADMIN || id === 'master') {
      alert("Action denied: You cannot revoke the Master Admin's access.");
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${phoneStr} from the admin list?`)) return;

    setMessage('Removing...');
    const { error } = await supabase
      .from('admin_numbers')
      .delete()
      .match({ id });

    if (error) {
      setMessage(`❌ Error: ${error.message}`);
    } else {
      setMessage(`✅ Success: Removed ${phoneStr}. They can no longer log in.`);
      setPhones(phones.filter(p => p.id !== id));
    }
  };

  if (loading) return <div>Loading admin records...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <Link 
        href="/admin" 
        className="text-gray-500 hover:text-blue-600 mb-6 inline-flex items-center gap-2 font-medium transition-colors"
      >
        &larr; Go Back to Dashboard
      </Link>
      
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Admin Access</h1>

      {message && (
        <div className={`p-3 rounded mb-6 font-medium ${message.includes('Error') || message.includes('⚠️️') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
          {message}
        </div>
      )}

      {/* ADD NEW PHONE NUMBER FORM */}
      <div className="bg-white shadow rounded-lg p-6 mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Admin</h2>
        <form onSubmit={handleAddPhone} className="flex flex-col sm:flex-row gap-3">
          <input
            type="tel"
            placeholder="Enter Phone Number"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="flex-1 border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg tracking-wider"
            required
          />
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded transition-colors whitespace-nowrap"
          >
            + Add Admin
          </button>
        </form>
      </div>

      {/* LIST EXISTING PHONE NUMBERS */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <h2 className="text-xl font-semibold p-6 border-b bg-gray-50 text-gray-800">Current Admins</h2>
        <ul className="divide-y divide-gray-200">
          {phones.map((phone) => (
            <li key={phone.id} className="flex justify-between items-center p-4 hover:bg-gray-50">
              <span className="font-bold text-lg text-gray-700 tracking-widest">{phone.phone_number}</span>
              
              {/* ✅ CONDITIONAL RENDERING: Don't show Delete button for Master Admin */}
              {phone.phone_number === MASTER_ADMIN ? (
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                  Master Admin
                </span>
              ) : (
                <button
                  onClick={() => handleDelete(phone.id, phone.phone_number)}
                  className="text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                  Revoke Access
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}