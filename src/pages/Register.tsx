import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

export default function Register() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CLERK');
  const [wardId, setWardId] = useState('');
  const [wards, setWards] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  React.useEffect(() => {
    async function fetchWards() {
      try {
        const { data } = await supabase.from('Ward').select('*');
        if (data) setWards(data);
      } catch (error) {
        console.error('Failed to fetch wards', error);
      }
    }
    fetchWards();
  }, []);

  const hashPassword = async (password: string) => {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const hashedPassword = await hashPassword(password);

      const { data: existing } = await supabase.from('User').select('id').eq('phone', phone).maybeSingle();
      if (existing) throw new Error('Phone number already registered');

      const { data: newUser, error } = await supabase
        .from('User')
        .insert([{
          name,
          phone,
          password: hashedPassword,
          role,
          wardId: role === 'CLERK' ? wardId : null
        }])
        .select()
        .single();

      if (error) {
        console.error("Supabase Insert Error:", error);
        throw new Error(`Registration failed: ${error.message}`);
      }
      if (!newUser) throw new Error('Failed to register: No user data returned');

      const token = 'mock-jwt-token-' + newUser.id;
      login(token, { id: newUser.id, name: newUser.name, phone: newUser.phone, role: newUser.role, wardId: newUser.wardId });
      
      if (newUser.role === 'ADMIN') {
        navigate('/admin');
      } else if (newUser.role === 'CLERK') {
        navigate('/clerk');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-[80vh] flex items-center justify-center bg-stone-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-stone-900">Create Account</h2>
          <p className="text-stone-500 mt-2">Join as a Clerk or Admin</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Phone Number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              placeholder="Enter Phone Number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                if (e.target.value !== 'CLERK') setWardId('');
              }}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
            >
              <option value="CLERK">Clerk</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {role === 'CLERK' && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Assigned Ward</label>
              <select
                required
                value={wardId}
                onChange={(e) => setWardId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              >
                <option value="">Select Ward...</option>
                {wards.map((ward: any) => (
                  <option key={ward.id} value={ward.id}>{ward.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 text-white rounded-xl py-3 font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-stone-500">
          Already have an account?{' '}
          <Link to="/login" className="text-stone-900 font-medium hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
