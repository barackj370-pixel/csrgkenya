import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, User, Home, Building2, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface JoinWardModalProps {
  isOpen: boolean;
  onClose: () => void;
  wardName: string;
  wardId?: string;
  onSuccess: () => void;
}

export default function JoinWardModal({ isOpen, onClose, wardName, wardId, onSuccess }: JoinWardModalProps) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    village: '',
    organizationName: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Hash password
      const msgUint8 = new TextEncoder().encode(formData.password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // 2. Check existing
      const { data: existing } = await supabase.from('User').select('id').eq('phone', formData.phoneNumber).maybeSingle();
      if (existing) {
        throw new Error('This phone number is already registered. Please sign in.');
      }

      // 3. Insert user as Citizen
      const { data: newUser, error: insertError } = await supabase.from('User').insert([{
        name: formData.fullName,
        phone: formData.phoneNumber,
        password: hashedPassword,
        role: 'CITIZEN',
        wardId: wardId || null,
        village: formData.village.trim(),
        organizationName: formData.organizationName.trim()
      }]).select().single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // 4. Also register group in ward
      try {
        if (formData.organizationName.trim() && wardId) {
          await supabase.from('Group').insert([{
            name: formData.organizationName.trim(),
            wardId,
            leaderName: formData.fullName,
            meetingDay: 'Weekly',
            meetingFrequency: 'Weekly',
            memberCount: '1+',
            members: `${formData.fullName} (${formData.village.trim()})`
          }]);
        }
      } catch {
        // non fatal
      }

      // 5. Log in
      if (newUser) {
        const token = 'mock-jwt-token-' + newUser.id;
        login(token, {
          id: newUser.id,
          name: newUser.name,
          phone: newUser.phone,
          role: newUser.role,
          wardId: newUser.wardId,
          village: newUser.village,
          organizationName: newUser.organizationName
        });
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to join ward.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative my-6"
        >
          <div className="bg-sky-900 p-6 text-white relative">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-800 px-2.5 py-0.5 rounded-full border border-sky-700">
              Citizen Assembly
            </span>
            <h2 className="text-xl font-bold mt-1">
              Join {wardName} Assembly Wall
            </h2>
            <p className="text-sky-200 text-xs mt-1">
              Add your organization, village, and phone number to participate and vote.
            </p>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-4 text-xs border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input 
                    required
                    type="text" 
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
                    placeholder="Enter Full Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Phone Number (SMS)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input 
                    required
                    type="tel" 
                    value={formData.phoneNumber}
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
                    placeholder="07XX XXX XXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Village / Estate</label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input 
                    required
                    type="text" 
                    value={formData.village}
                    onChange={e => setFormData({...formData, village: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
                    placeholder="e.g. Gichagi / Kangemi Central"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Organisation / Group Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input 
                    required
                    type="text" 
                    value={formData.organizationName}
                    onChange={e => setFormData({...formData, organizationName: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
                    placeholder="e.g. Kangemi Youth Group / St. Joseph SHG"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Create Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input 
                    required
                    type="password" 
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-xl text-sm font-bold transition-colors shadow-md mt-2 disabled:opacity-50"
              >
                {loading ? 'Joining Ward...' : `Join ${wardName} as Citizen`}
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
