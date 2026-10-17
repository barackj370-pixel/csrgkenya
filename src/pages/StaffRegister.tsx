import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Shield, Users, Lock, Phone, User } from 'lucide-react';
import CountyWardSelector from '../components/ui/CountyWardSelector';

export default function StaffRegister() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CLERK' | 'ADMIN'>('CLERK');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const hashPassword = async (pwd: string) => {
    const msgUint8 = new TextEncoder().encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role === 'CLERK') {
      if (!selectedCounty) {
        setError('Please select the County for this Clerk.');
        return;
      }
      if (!selectedWard.trim()) {
        setError('Please select or type the assigned Ward.');
        return;
      }
    }

    setLoading(true);

    try {
      const hashedPassword = await hashPassword(password);

      const { data: existing } = await supabase.from('User').select('id').eq('phone', phone).maybeSingle();
      if (existing) throw new Error('Phone number already registered. Please sign in.');

      let assignedWardId: string | null = null;

      if (role === 'CLERK') {
        const wardCleanName = selectedWard.trim();
        const wardSlug = wardCleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        const { data: allWards } = await supabase.from('Ward').select('*');
        let targetWard = allWards?.find((w: any) => 
          w.slug === wardSlug || 
          w.name.toLowerCase() === wardCleanName.toLowerCase()
        );

        if (!targetWard) {
          const { data: newWard, error: wardError } = await supabase
            .from('Ward')
            .insert([{
              name: wardCleanName,
              slug: wardSlug,
              county: selectedCounty,
              description: `${selectedCounty} County - ${wardCleanName} Ward`
            }])
            .select()
            .single();

          if (wardError) throw new Error(`Failed to initialize ward: ${wardError.message}`);
          targetWard = newWard;
        }

        assignedWardId = targetWard.id;
      }

      const { data: newUser, error: insertError } = await supabase
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

      if (insertError) {
        throw new Error(`Staff registration failed: ${insertError.message}`);
      }
      if (!newUser) throw new Error('Failed to create staff account');

      const token = 'mock-jwt-token-' + newUser.id;
      login(token, {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
        wardId: newUser.wardId
      });

      if (newUser.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/clerk');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
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
      <div className="max-w-lg w-full bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-stone-900 text-white rounded-2xl mb-3 shadow">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900">Official Staff Registration</h2>
          <p className="text-stone-500 mt-1 text-xs">
            Restricted to Ward Clerks and Civil Society Reference Group Administrators across all 47 counties
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Select Staff Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('CLERK')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'CLERK'
                    ? 'border-sky-600 bg-sky-50 text-sky-800'
                    : 'border-stone-200 bg-stone-50 text-stone-600'
                }`}
              >
                <Users className="w-4 h-4" />
                Ward Clerk
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('ADMIN');
                  setSelectedCounty('');
                  setSelectedWard('');
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'ADMIN'
                    ? 'border-sky-600 bg-sky-50 text-sky-800'
                    : 'border-stone-200 bg-stone-50 text-stone-600'
                }`}
              >
                <Shield className="w-4 h-4" />
                Administrator
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Full Official Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John K. Clerk"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 pl-9 text-sm focus:ring-2 focus:ring-stone-900 outline-none text-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Official Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XX XXX XXX"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 pl-9 text-sm focus:ring-2 focus:ring-stone-900 outline-none text-stone-900"
              />
            </div>
          </div>

          {role === 'CLERK' && (
            <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-100 space-y-2">
              <span className="text-xs font-bold text-sky-950 block">Assigned Ward & County</span>
              <CountyWardSelector
                selectedCounty={selectedCounty}
                selectedWard={selectedWard}
                onCountyChange={setSelectedCounty}
                onWardChange={setSelectedWard}
                required={true}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 pl-9 text-sm focus:ring-2 focus:ring-stone-900 outline-none text-stone-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors mt-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Creating Official Account...' : 'Register Official Account'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
          Citizen looking to join your ward?{' '}
          <Link to="/register" className="text-sky-700 font-bold hover:underline">
            Register as a Citizen here
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
