'use client';

import { useState, useEffect } from 'react';

// 🔒 SET YOUR ADMIN PHONE NUMBER HERE
const ADMIN_PHONE = "8889726554"; 

export default function AdminPanel() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Data State
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Check login status on page load
  useEffect(() => {
    const checkAuth = async () => {
      if (localStorage.getItem('isAdmin') === 'true') {
        setIsAuthenticated(true);
        await fetchData();
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/get-cards');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (phoneInput === ADMIN_PHONE) {
      setIsAuthenticated(true);
      localStorage.setItem('isAdmin', 'true');
      setLoginError('');
      setLoading(true);
      await fetchData();
      setLoading(false);
    } else {
      setLoginError('Unauthorized phone number.');
      setPhoneInput('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    setIsAuthenticated(false);
    setData({});
  };

  const handleDelete = async (stationName, cardId) => {
    if (!window.confirm(`Are you sure you want to delete ${cardId} from ${stationName}?`)) return;
    setMessage('Deleting...');

    try {
      const response = await fetch('/api/delete-card', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationName, cardId }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`Success: ${result.message}`);
        setData(prevData => {
          const updatedStation = prevData[stationName].filter(card => card.id !== cardId);
          return { ...prevData, [stationName]: updatedStation };
        });
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage('Failed to connect to the server.');
    }
  };

  // 🛑 RENDER LOGIN SCREEN IF NOT AUTHENTICATED
  if (!loading && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Login</h1>
          {loginError && <p className="text-red-500 mb-4 text-sm text-center">{loginError}</p>}
          <input
            type="tel"
            placeholder="Enter Admin Phone Number"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            className="w-full border p-3 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded font-semibold hover:bg-blue-700 transition">
            Unlock Admin Panel
          </button>
        </form>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  // ✅ RENDER ADMIN DASHBOARD IF AUTHENTICATED
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
        <button onClick={handleLogout} className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
          Logout
        </button>
      </div>
      
      {message && (
        <div className="bg-blue-100 text-blue-800 p-3 rounded mb-4 font-medium">
          {message}
        </div>
      )}

      {Object.entries(data).map(([stationName, cards]) => (
        <div key={stationName} className="mb-8 bg-white shadow rounded-lg p-6 border border-gray-100">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2 text-gray-800">{stationName}</h2>
          
          {cards.length === 0 ? (
            <p className="text-gray-500 italic">No cards remaining in this station.</p>
          ) : (
            <ul className="space-y-3">
              {cards.map((card) => (
                <li key={card.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="overflow-hidden pr-4">
                    <span className="font-bold text-gray-700 mr-3">{card.id}</span>
                    <span className="text-gray-600 text-sm truncate">{card.qA.substring(0, 45)}...</span>
                  </div>
                  <button
                    onClick={() => handleDelete(stationName, card.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm transition-colors whitespace-nowrap"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}