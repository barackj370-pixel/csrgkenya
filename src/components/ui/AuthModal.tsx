import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Home, Lock, Phone, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import CountyWardSelector from './CountyWardSelector';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(defaultMode === 'login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    village: '',
    organizationName: ''
  });

  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedWard, setSelectedWard] = useState('');

  useEffect(() => {
    setIsLogin(defaultMode === 'login');
  }, [defaultMode, isOpen]);

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
        const { data: user, error: loginErr } = await supabase
          .from('User')
          .select('*')
          .eq('phone', formData.phone)
          .eq('password', hashedPassword)
          .maybeSingle();

        if (loginErr) {
          throw new Error(`Login failed: ${loginErr.message}`);
        }
        if (!user) {
          throw new Error('Invalid phone number or password');
        }

        const token = 'mock-jwt-token-' + user.id;
        login(token, {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          wardId: user.wardId,
          village: user.village,
          organizationName: user.organizationName
        });
        
        onClose();
        if (user.role === 'ADMIN') {
          navigate('/admin');
        } else if (user.role === 'CLERK') {
          navigate('/clerk');
        } else if (user.wardId) {
          const { data: targetWard } = await supabase.from('Ward').select('slug').eq('id', user.wardId).maybeSingle();
          if (targetWard?.slug) {
            navigate(`/ward/${targetWard.slug}`);
          } else {
            navigate('/');
          }
        } else {
          navigate('/');
        }
      } else {
        // Register Citizen only
        if (!selectedCounty) {
          throw new Error('Please select your County in Kenya.');
        }
        if (!selectedWard.trim()) {
          throw new Error('Please select or type your Ward.');
        }
        if (!formData.village.trim()) {
          throw new Error('Please provide your village or estate.');
        }
        if (!formData.organizationName.trim()) {
          throw new Error('Please enter your community group or organisation name.');
        }

        const { data: existing } = await supabase.from('User').select('id').eq('phone', formData.phone).maybeSingle();
        if (existing) throw new Error('Phone number already registered. Please sign in.');

        // Resolve or create ward
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

          if (wardError) throw new Error(`Failed to create ward: ${wardError.message}`);
          targetWard = newWard;
        }

        const { data: newUser, error: insertError } = await supabase
          .from('User')
          .insert([{
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            password: hashedPassword,
            role: 'CITIZEN',
            wardId: targetWard.id,
            village: formData.village.trim(),
            organizationName: formData.organizationName.trim()
          }])
          .select()
          .single();

        if (insertError) {
          throw new Error(`Registration failed: ${insertError.message}`);
        }
        if (!newUser) throw new Error('Failed to register: No user data returned');

        // Add to groups directory
        try {
          await supabase.from('Group').insert([{
            name: formData.organizationName.trim(),
            wardId: targetWard.id,
            leaderName: formData.name.trim(),
            meetingDay: 'Weekly',
            meetingFrequency: 'Weekly',
            memberCount: '1+',
            members: `${formData.name.trim()} (${formData.village.trim()})`
          }]);
        } catch {
          // ignore
        }

        const token = 'mock-jwt-token-' + newUser.id;
        login(token, {
          id: newUser.id,
          name: newUser.name,
          phone: newUser.phone,
          role: newUser.role,
          wardId: targetWard.id,
          village: newUser.village,
          organizationName: newUser.organizationName
        });
        
        onClose();
        navigate(`/ward/${targetWard.slug}`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
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
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative my-6"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-950 to-sky-800 p-6 text-white relative">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-sky-500/30 text-sky-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-sky-400/30 uppercase tracking-wider">
                {isLogin ? 'Citizen Portal' : 'National Citizen Assembly'}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white">
              {isLogin ? 'Sign In to Your Account' : 'Join Your Ward Assembly'}
            </h2>
            <p className="text-stone-300 text-xs mt-1">
              {isLogin 
                ? 'Access your ward assembly discussions and votes.' 
                : 'Select your county and ward in Kenya to participate.'}
            </p>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-4 text-xs border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none"
                        placeholder="e.g. John K. Mwangi"
                      />
                    </div>
                  </div>

                  {/* County and Ward Selector */}
                  <div className="bg-sky-50/60 p-3 rounded-2xl border border-sky-100">
                    <CountyWardSelector
                      selectedCounty={selectedCounty}
                      selectedWard={selectedWard}
                      onCountyChange={setSelectedCounty}
                      onWardChange={setSelectedWard}
                      required={true}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Village / Estate / Sub-Location <span className="text-red-500">*</span>
                    </label>
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
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Organisation or Group Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input 
                        required
                        type="text" 
                        value={formData.organizationName}
                        onChange={e => setFormData({...formData, organizationName: e.target.value})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
                        placeholder="e.g. Kangemi Youth Bunge / St. Joseph SHG"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input 
                    required
                    type="tel" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
                    placeholder="07XX XXX XXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
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
                className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-xl text-sm font-bold transition-colors shadow-md disabled:opacity-50 cursor-pointer mt-2"
              >
                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Register & Join Ward Assembly')}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sky-700 hover:text-sky-900 font-bold hover:underline cursor-pointer"
              >
                {isLogin ? "New participant? Register here" : 'Already registered? Sign in'}
              </button>
              <Link 
                to="/staff-register"
                onClick={onClose}
                className="text-stone-400 hover:text-stone-700 hover:underline text-[11px]"
              >
                Clerk / Admin Access
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
