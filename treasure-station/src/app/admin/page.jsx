'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (Using the exact same variables you have in your main app)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ManageGuests() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Fetch all guest records from Supabase
  useEffect(() => {
    const fetchGuests = async () => {
      const { data, error } = await supabase
        .from('station_guests')
        .select('*');

      if (error) {
        console.error("Error fetching guests:", error);
        setMessage("Error loading guest records from database.");
      } else {
        // Sort the data so the most recent stations/guests appear neatly
        const sortedData = data.sort((a, b) => a.station_name.localeCompare(b.station_name));
        setGuests(sortedData);
      }
      setLoading(false);
    };

    fetchGuests();
  }, []);

  // Delete a specific guest's record
  const handleDelete = async (stationName, guestCode) => {
    if (!window.confirm(`Are you sure you want to delete Guest ${guestCode} from ${stationName}? They will be able to play this station again.`)) return;

    setMessage('Deleting record...');

    const { error } = await supabase
      .from('station_guests')
      .delete()
      .match({ station_name: stationName, guest_code: guestCode });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage(`Success: Deleted Guest ${guestCode}'s record from ${stationName}.`);
      // Remove the deleted record from the screen without refreshing
      setGuests(prevGuests => prevGuests.filter(g => !(g.station_name === stationName && g.guest_code === guestCode)));
    }
  };

  if (loading) return <div>Loading guest records...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Guest Records</h1>
      
      {message && (
        <div className={`p-3 rounded mb-6 font-medium ${message.startsWith('Error') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        {guests.length === 0 ? (
          <p className="p-6 text-gray-500 italic">No guests have played any stations yet.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Station</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {guests.map((guest, index) => (
                <tr key={`${guest.station_name}-${guest.guest_code}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {guest.station_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">
                    {guest.guest_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {guest.is_correct ? (
                      <span className="text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-full text-xs">✅ Correct</span>
                    ) : (
                      <span className="text-red-600 font-semibold bg-red-100 px-2 py-1 rounded-full text-xs">❌ Incorrect</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(guest.station_name, guest.guest_code)}
                      className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}