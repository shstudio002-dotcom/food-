'use client';
import { useState, useEffect } from 'react';

export default function AdminAddFoodDish() {
  const [hotels, setHotels] = useState([]);
  const [formData, setFormData] = useState({
    kannadaName: '',
    englishName: '',
    category: 'Hotels',
    hotelId: '',
    hotelNameInput: '', // For manually typing a new hotel name
    price: '',
    image: ''
  });
  const [message, setMessage] = useState('');

  // Fetch partner hotels directly from backend database
  useEffect(() => {
    fetch('http://localhost:5000/api/foods/restaurants')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHotels(data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch hotels from backend:', err);
        setHotels([]);
      });
  }, []);

  // Handle local image file selection from device and convert to base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let finalHotelName = 'Partner Hotel';
    let finalHotelId = formData.hotelId;

    try {
      // If a new hotel is typed, save it to the database first
      if (formData.hotelId === 'new') {
        const newHotelName = formData.hotelNameInput.trim() || 'New Partner Hotel';
        
        const hotelRes = await fetch('http://localhost:5000/api/foods/restaurants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newHotelName, address: 'Local Area' })
        });
        const hotelData = await hotelRes.json();
        
        if (hotelData.success && hotelData.restaurant) {
          finalHotelName = hotelData.restaurant.name;
          finalHotelId = hotelData.restaurant._id;
        } else {
          finalHotelName = newHotelName;
          finalHotelId = 'h-' + Date.now();
        }
      } else {
        const selectedHotelObj = hotels.find(h => h._id === formData.hotelId || h.id === formData.hotelId);
        if (selectedHotelObj) {
          finalHotelName = selectedHotelObj.name;
        }
      }

      const payload = {
        ...formData,
        hotelId: finalHotelId,
        hotelName: finalHotelName
      };

      // Submit food dish payload to backend
      const foodRes = await fetch('http://localhost:5000/api/foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const foodData = await foodRes.json();

      if (foodRes.ok && foodData.success) {
        setMessage(`✅ Food dish successfully added to "${finalHotelName}" menu!`);
        setFormData({ kannadaName: '', englishName: '', category: 'Hotels', hotelId: '', hotelNameInput: '', price: '', image: '' });
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`❌ ${foodData.error || 'Failed to add dish to backend catalog.'}`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to submit form:', err);
      setMessage('❌ Network error while saving dish.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm space-y-1">
        <h2 className="text-sm font-black text-slate-950">Add Food Dish & Hotel (ಹೊಸ ಆಹಾರ ಮತ್ತು ಹೋಟೆಲ್ ಸೇರಿಸಿ)</h2>
        <p className="text-[11px] text-slate-500">Select an existing hotel or type a new hotel name directly while adding your dish.</p>
      </div>

      {message && (
        <div className="bg-white border border-emerald-200 text-emerald-700 text-xs font-bold p-3 rounded-2xl text-center shadow-sm">
          {message}
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-3">
        
        {/* Hotel Selector / Creator */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-600 uppercase">Select or Add Hotel *</label>
          <select 
            value={formData.hotelId}
            onChange={(e) => setFormData({ ...formData, hotelId: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-bold"
            required
          >
            <option value="">-- Choose Existing Hotel --</option>
            {hotels.map(h => {
              const hId = h._id || h.id;
              return (
                <option key={hId} value={hId}>{h.name}</option>
              );
            })}
            <option value="new">➕ Type New Hotel Name...</option>
          </select>

          {/* Input field appears if 'Type New Hotel Name' is selected */}
          {formData.hotelId === 'new' && (
            <input 
              type="text"
              placeholder="Enter new hotel name (e.g. Royal Dine Restaurant)"
              value={formData.hotelNameInput}
              onChange={(e) => setFormData({ ...formData, hotelNameInput: e.target.value })}
              className="w-full bg-emerald-50/50 border border-emerald-300 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500 mt-2 font-bold"
              required
            />
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">Kannada Name (ಕನ್ನಡ ಹೆಸರು) *</label>
          <input 
            type="text" 
            placeholder="ಉದಾ: ಮಸಾಲೆ ದೋಸೆ, ಚಿಕನ್ ಬಿರಿಯಾನಿ"
            value={formData.kannadaName}
            onChange={(e) => setFormData({ ...formData, kannadaName: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">English Dish Name *</label>
          <input 
            type="text" 
            placeholder="e.g. Hyderabadi Chicken Biryani"
            value={formData.englishName}
            onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600">Category *</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
            >
              <option value="Hotels">Hotels</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Veg">Veg</option>
              <option value="Non-Veg">Non-Veg</option>
              <option value="South">South</option>
              <option value="North">North</option>
              <option value="Chats">Chats</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600">Base Price (₹) *</label>
            <input 
              type="number" 
              placeholder="250"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>
        </div>

        {/* Direct Device Image Upload Option */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">Food Image Upload (ಚಿತ್ರ ಆಯ್ಕೆಮಾಡಿ)</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={handleImageChange}
            className="w-full bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-xl p-2 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
          />
        </div>

        {/* Image Preview Thumbnail */}
        {formData.image && (
          <div className="relative w-full h-32 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}

        <button 
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition mt-2 active:scale-95"
        >
          + Save & Assign Dish to Hotel ⚡
        </button>

      </form>

    </div>
  );
}