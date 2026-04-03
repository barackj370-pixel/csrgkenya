import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(false);
  const [wards, setWards] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'MOBILIZER',
    wardId: ''
  });

  useEffect(() => {
    if (isOpen) {
      supabase.from('Ward').select('*')
        .then(({ data }) => setWards(data || []))
        .catch(err => console.error('Failed to fetch wards', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
      const hashedPassword = await hashPassword(formData.password);

      if (isLogin) {
        const { data: user, error } = await supabase
          .from('User')
          .select('*')
          .eq('email', formData.email)
          .eq('password', hashedPassword)
          .single();

        if (error || !user) {
          throw new Error('Invalid credentials');
        }

        // Mock token for static site
        const token = 'mock-jwt-token-' + user.id;
        login(token, { id: user.id, name: user.name, email: user.email, role: user.role, wardId: user.wardId });
        
        onClose();
        if (user.role === 'ADMIN') navigate('/admin');
        else if (user.role === 'MOBILIZER') navigate('/mobilizer');
        
      } else {
        // Register
        const { data: existing } = await supabase.from('User').select('id').eq('email', formData.email).single();
        if (existing) throw new Error('Email already registered');

        const { data: newUser, error } = await supabase
          .from('User')
          .insert([{
            name: formData.name,
            email: formData.email,
            password: hashedPassword,
            role: formData.role,
            wardId: formData.wardId || null
          }])
          .select()
          .single();

        if (error || !newUser) throw new Error('Failed to register');

        const token = 'mock-jwt-token-' + newUser.id;
        login(token, { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, wardId: newUser.wardId });
        
        onClose();
        if (newUser.role === 'ADMIN') navigate('/admin');
        else if (newUser.role === 'MOBILIZER') navigate('/mobilizer');
      }
    } catch (err: any) {
      setError(err.message);
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden relative"
        >
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6">
            <h2 className="text-xl font-bold text-stone-900 mb-1 pr-8">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-stone-500 text-xs mb-5">
              {isLogin ? 'Sign in to manage your activities.' : 'Join to manage groups and participate in assemblies.'}
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 p-2 rounded-lg mb-4 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Full Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                      placeholder="Enter Full Name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Role</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="role" 
                          value="MOBILIZER" 
                          checked={formData.role === 'MOBILIZER'}
                          onChange={e => setFormData({...formData, role: e.target.value, wardId: ''})}
                          className="w-3.5 h-3.5 text-stone-900 focus:ring-stone-900"
                        />
                        <span className="text-xs font-medium text-stone-700">Mobilizer</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="role" 
                          value="ADMIN" 
                          checked={formData.role === 'ADMIN'}
                          onChange={e => setFormData({...formData, role: e.target.value, wardId: ''})}
                          className="w-3.5 h-3.5 text-stone-900 focus:ring-stone-900"
                        />
                        <span className="text-xs font-medium text-stone-700">Admin</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Email Address</label>
                <input 
                  required
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                  placeholder="Enter Email Address"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Password</label>
                <input 
                  required
                  type="password" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                  placeholder="••••••••"
                />
              </div>

              {!isLogin && formData.role === 'MOBILIZER' && (
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Select Your Ward</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <select 
                      required
                      value={formData.wardId}
                      onChange={e => setFormData({...formData, wardId: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none appearance-none"
                    >
                      <option value="" disabled>Choose a ward...</option>
                      {wards.map(ward => (
                        <option key={ward.id} value={ward.id}>{ward.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-stone-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-stone-800 transition-colors mt-2 disabled:opacity-50"
              >
                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs text-stone-600 hover:text-stone-900 font-medium"
              >
                {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
