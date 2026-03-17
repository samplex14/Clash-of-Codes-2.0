import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParticipant } from '../context/ParticipantContext';
import api from '../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({ usn: '', name: '', year: '1' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useParticipant();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/participants/register', {
        usn: formData.usn,
        name: formData.name,
        year: parseInt(formData.year, 10),
      });

      login(response.data.participant);
      
      // Navigate to phase 1 waiting area after register
      navigate('/phase1');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register to the clan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="card-clash max-w-md w-full">
        <h2 className="text-4xl font-clash text-center text-clash-gold mb-2">Join Clan</h2>
        <p className="text-center text-gray-300 font-medium mb-8">Enter your details to prepare for battle.</p>
        
        {error && (
          <div className="bg-clash-red/20 border-2 border-clash-red text-white p-3 rounded mb-6 text-center shadow-inner">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-clash-gold font-clash tracking-wide">USN</label>
            <input 
              type="text" 
              required
              className="input-clash w-full uppercase"
              placeholder="e.g. 1RV21CS001"
              value={formData.usn}
              onChange={(e) => setFormData({...formData, usn: e.target.value.toUpperCase()})}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-clash-gold font-clash tracking-wide">Full Name</label>
            <input 
              type="text" 
              required
              className="input-clash w-full"
              placeholder="Barbarian King"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-clash-gold font-clash tracking-wide">Year</label>
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${formData.year === '1' ? 'bg-clash-elixir border-purple-900 shadow-inner' : 'bg-[#e5e5e5] border-gray-400 text-clash-dark hover:bg-white'}`}>
                <input 
                  type="radio" 
                  name="year" 
                  value="1" 
                  className="hidden"
                  checked={formData.year === '1'}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                />
                <span className="font-bold">1st Year</span>
              </label>
              <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${formData.year === '2' ? 'bg-clash-elixir border-purple-900 shadow-inner' : 'bg-[#e5e5e5] border-gray-400 text-clash-dark hover:bg-white'}`}>
                <input 
                  type="radio" 
                  name="year" 
                  value="2" 
                  className="hidden"
                  checked={formData.year === '2'}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                />
                <span className="font-bold">2nd Year</span>
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-clash w-full mt-4 flex items-center justify-center py-4"
          >
            {loading ? 'Recruiting...' : 'Train Troops'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
