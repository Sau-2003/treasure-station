'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// 👑 SET YOUR UNTOUCHABLE MASTER ADMIN NUMBER HERE TOO
const MASTER_ADMIN = "8889726554";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ✅ HELPER FUNCTION: Capitalize each word
const capitalizeName = (str) => {
  if (!str) return '';
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

export default function ManagePhones() {
  const [phones, setPhones] = useState([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

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
        const hasMaster = data?.some(p => p.phone_number === MASTER_ADMIN);
        const displayData = data || [];
        if (!hasMaster) {
          displayData.unshift({ id: 'master', name: 'Saumya Jain', phone_number: MASTER_ADMIN });
        }
        setPhones(displayData);
      }
      setLoading(false);
    };

    fetchPhones();
  }, []);

  const handleAddPhone = async (e) => {
    e.preventDefault();
    const cleanPhone = newPhone.trim();
    // ✅ Capitalize the name right before saving to Supabase
    const cleanName = capitalizeName(newName.trim()) || 'Volunteer Admin'; 
    
    if (!cleanPhone) return;

    if (phones.some(p => p.phone_number === cleanPhone)) {
      setMessage('⚠ This number is already an admin.');
      return;
    }

    setMessage('Adding new admin...');
    const { data, error } = await supabase
      .from('admin_numbers')
      .insert([{ phone_number: cleanPhone, name: cleanName }]) 
      .select();

    if (error) {
      setMessage(`❌ Error: ${error.message}`);
    } else {
      setMessage(`✅ Success: Added ${cleanName} (${cleanPhone}) as an admin!`);
      setNewPhone('');
      setNewName(''); 
      setPhones([...phones, data[0]]);
    }
  };

  const handleDelete = async (id, phoneStr, nameStr) => {
    if (phoneStr === MASTER_ADMIN || id === 'master') {
      alert("Action denied: You cannot revoke the Master Admin's access.");
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${nameStr || phoneStr} from the admin list?`)) return;

    setMessage('Removing...');
    const { error } = await supabase
      .from('admin_numbers')
      .delete()
      .match({ id });

    if (error) {
      setMessage(`❌ Error: ${error.message}`);
    } else {
      setMessage(`✅ Success: Removed ${nameStr || phoneStr}. They can no longer log in.`);
      setPhones(phones.filter(p => p.id !== id));
    }
  };

  if (loading) return <div className="p-4 sm:p-8">Loading admin records...</div>;

  return (
    <div className="max-w-4xl mx-auto">

      <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Admin Access</h1>

      {message && (
        <div className={`p-3 rounded mb-6 font-medium ${message.includes('Error') || message.includes('⚠') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Admin</h2>
        <form onSubmit={handleAddPhone} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Volunteer Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            required
          />
          <input
            type="tel"
            placeholder="Phone Number"
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

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <h2 className="text-xl font-semibold p-6 border-b bg-gray-50 text-gray-800">Current Admins</h2>
        <ul className="divide-y divide-gray-200">
          {phones.map((phone) => (
            <li key={phone.id} className="flex justify-between items-center p-4 hover:bg-gray-50">
              <div>
                {/* ✅ Force capitalization on render just in case old database entries were lowercase */}
                <p className="font-bold text-lg text-gray-800">{capitalizeName(phone.name || 'Volunteer Admin')}</p>
                <p className="text-gray-500 font-mono text-sm tracking-widest">{phone.phone_number}</p>
              </div>
              
              {phone.phone_number === MASTER_ADMIN ? (
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                  Master Admin
                </span>
              ) : (
                <button
                  onClick={() => handleDelete(phone.id, phone.phone_number, phone.name)}
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