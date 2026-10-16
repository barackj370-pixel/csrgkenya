import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { MapPin, Users, Shield, UserCheck } from 'lucide-react';

export default function Register() {
  const [searchParams] = useSearchParams();
  const preselectedWardSlug = searchParams.get('ward');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CITIZEN' | 'CLERK' | 'ADMIN'>('CITIZEN');
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
        if (data) {
          setWards(data);
          if (preselectedWardSlug) {
            const matched = data.find((w: any) => w.slug === preselectedWardSlug);
            if (matched) {
              setWardId(matched.id);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch wards', error);
      }
    }
    fetchWards();
  }, [preselectedWardSlug]);

  const hashPassword = async (password: string) => {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if ((role === 'CITIZEN' || role === 'CLERK') && !wardId) {
      setError('Please select your ward from the list.');
      return;
    }

    setLoading(true);

    try {
      const hashedPassword = await hashPassword(password);

      const { data: existing } = await supabase.from('User').select('id').eq('phone', phone).maybeSingle();
      if (existing) throw new Error('Phone number already registered. Please sign in instead.');

      const assignedWardId = (role === 'CITIZEN' || role === 'CLERK') ? wardId : null;

      const { data: newUser, error } = await supabase
        .from('User')
        .insert([{
          name,
          phone,
          password: hashedPassword,
          role,
          wardId: assignedWardId
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
        // Find selected ward to redirect citizen directly to their ward's wall
        const chosenWard = wards.find((w: any) => w.id === assignedWardId);
        if (chosenWard?.slug) {
          navigate(`/ward/${chosenWard.slug}`);
        } else {
          navigate('/');
        }
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
      className="min-h-[85vh] flex items-center justify-center bg-stone-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-sky-100 text-sky-800 rounded-full mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold text-stone-900">Create Account</h2>
          <p className="text-stone-500 mt-2 text-sm">
            Join the Citizen Assembly in your ward and participate in local decision making
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Account Type / Role</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('CITIZEN')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  role === 'CITIZEN'
                    ? 'border-sky-600 bg-sky-50 text-sky-800 shadow-sm'
                    : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Citizen
              </button>
              <button
                type="button"
                onClick={() => setRole('CLERK')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  role === 'CLERK'
                    ? 'border-sky-600 bg-sky-50 text-sky-800 shadow-sm'
                    : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Users className="w-4 h-4" />
                Clerk
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('ADMIN');
                  setWardId('');
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  role === 'ADMIN'
                    ? 'border-sky-600 bg-sky-50 text-sky-800 shadow-sm'
                    : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900"
              placeholder="e.g. Wanjiku Mwangi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Phone Number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900"
              placeholder="07XX XXX XXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900"
              placeholder="••••••••"
            />
          </div>

          {(role === 'CITIZEN' || role === 'CLERK') && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                {role === 'CITIZEN' ? 'Select Your Ward (Assembly Wall)' : 'Assigned Ward'}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 pointer-events-none" />
                <select
                  required
                  value={wardId}
                  onChange={(e) => setWardId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 pl-10 focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900"
                >
                  <option value="">Select your ward from list...</option>
                  {wards.map((ward: any) => (
                    <option key={ward.id} value={ward.id}>
                      {ward.name} {ward.description ? `• ${ward.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {role === 'CITIZEN' && (
                <p className="text-xs text-sky-800 bg-sky-50 p-2 rounded-lg mt-2 border border-sky-100">
                  You will be directed straight to your ward's assembly wall to vote on agenda items and propose community issues.
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 text-white rounded-xl py-3 font-semibold hover:bg-sky-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Creating Account...' : (role === 'CITIZEN' ? 'Join Ward Assembly' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-stone-500">
          Already have an account?{' '}
          <Link to="/login" className="text-sky-700 font-semibold hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
