import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { MapPin, Users, Building2, Calendar, Phone, Lock, User, Home, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Register() {
  const [searchParams] = useSearchParams();
  const preselectedWardSlug = searchParams.get('ward');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [wardId, setWardId] = useState('');
  const [village, setVillage] = useState('');
  const [organizationType, setOrganizationType] = useState('Community Group');
  const [organizationName, setOrganizationName] = useState('');
  const [meetingFrequency, setMeetingFrequency] = useState('Weekly');
  const [nextMeetingDate, setNextMeetingDate] = useState('');
  const [wards, setWards] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const organizationTypes = [
    'Community Group',
    'CSO (Civil Society Organisation)',
    'PBO (Public Benefit Organisation)',
    'GHRD (Grassroots Human Rights Defenders)',
    'Women Group',
    'Youth Group',
    'Religious Organisation',
    'SHG (Self Help Group)',
    'Active Citizen / Resident'
  ];

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
      } catch (err) {
        console.error('Failed to fetch wards', err);
      }
    }
    fetchWards();
  }, [preselectedWardSlug]);

  const hashPassword = async (pwd: string) => {
    const msgUint8 = new TextEncoder().encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!wardId) {
      setError('Please select your ward from the list.');
      return;
    }
    if (!village.trim()) {
      setError('Please enter your village, estate or sub-location.');
      return;
    }
    if (!organizationName.trim()) {
      setError('Please provide your organization or community group name.');
      return;
    }

    setLoading(true);

    try {
      const hashedPassword = await hashPassword(password);

      const { data: existing } = await supabase.from('User').select('id').eq('phone', phone).maybeSingle();
      if (existing) {
        throw new Error('Phone number already registered. Please sign in instead.');
      }

      // 1. Create the Citizen User account
      const { data: newUser, error: userError } = await supabase
        .from('User')
        .insert([{
          name,
          phone,
          password: hashedPassword,
          role: 'CITIZEN',
          wardId,
          village: village.trim(),
          organizationName: organizationName.trim(),
          organizationType,
          meetingFrequency,
          nextMeetingDate: nextMeetingDate || null
        }])
        .select()
        .single();

      if (userError) {
        console.error("Citizen Insert Error:", userError);
        throw new Error(`Registration failed: ${userError.message}`);
      }
      if (!newUser) throw new Error('Failed to register: No user data returned');

      // 2. Also register the organization / group in the Ward's Groups directory
      try {
        await supabase.from('Group').insert([{
          name: organizationName.trim(),
          wardId,
          leaderName: name,
          meetingDay: meetingFrequency,
          meetingFrequency,
          memberCount: '1+',
          members: `${name} (${village.trim()})`
        }]);
      } catch (grpErr) {
        console.warn('Non-fatal: could not auto-create group entry', grpErr);
      }

      // 3. Log in and navigate to the Citizen's Ward Wall
      const token = 'mock-jwt-token-' + newUser.id;
      login(token, {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
        wardId: newUser.wardId,
        village: newUser.village,
        organizationName: newUser.organizationName,
        organizationType: newUser.organizationType,
        meetingFrequency: newUser.meetingFrequency,
        nextMeetingDate: newUser.nextMeetingDate
      });

      const chosenWard = wards.find((w: any) => w.id === wardId);
      if (chosenWard?.slug) {
        navigate(`/ward/${chosenWard.slug}`);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
        {/* Header Banner with Kenya National Citizen Assembly styling */}
        <div className="bg-gradient-to-r from-sky-950 via-sky-900 to-sky-800 p-8 text-white relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-white to-green-600"></div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-sky-500/30 text-sky-200 text-xs font-bold px-3 py-1 rounded-full border border-sky-400/30 uppercase tracking-wider">
              National Citizen Assembly
            </span>
            <span className="text-xs text-stone-300 font-medium">Official Citizen Registration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Register to Participate in Your Ward
          </h1>
          <p className="text-stone-300 text-sm mt-2 max-w-xl">
            Join your ward's assembly wall. Add your organization or group, village, and ward to vote on community priorities and nominate assembly representatives.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-6 text-sm border border-red-200 flex items-start gap-2">
              <span className="font-bold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Personal Contact */}
            <div>
              <h3 className="text-base font-bold text-sky-900 flex items-center gap-2 mb-3 border-b border-stone-200 pb-2">
                <User className="w-5 h-5 text-sky-600" />
                1. Citizen Representative Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jane Wanjiku Mwangi"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Phone Number (M-Pesa / SMS) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07XX XXX XXX"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 pl-9 text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Location (Ward and Village) */}
            <div>
              <h3 className="text-base font-bold text-sky-900 flex items-center gap-2 mb-3 border-b border-stone-200 pb-2">
                <MapPin className="w-5 h-5 text-sky-600" />
                2. Location: Ward & Village
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Select Your Ward <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                    <select
                      required
                      value={wardId}
                      onChange={(e) => setWardId(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 pl-9 text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900"
                    >
                      <option value="">Select your Ward...</option>
                      {wards.map((w: any) => (
                        <option key={w.id} value={w.id}>
                          {w.name} {w.description ? `(${w.description})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Village / Estate / Sub-Location <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      required
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="e.g. Gichagi, Waruku, Kangemi Central"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 pl-9 text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Organization Details (per poster instructions) */}
            <div>
              <h3 className="text-base font-bold text-sky-900 flex items-center gap-2 mb-3 border-b border-stone-200 pb-2">
                <Building2 className="w-5 h-5 text-sky-600" />
                3. Your Organisation or Group Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Type of Organisation <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={organizationType}
                      onChange={(e) => setOrganizationType(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900"
                    >
                      {organizationTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Organisation / Group Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="e.g. Kangemi Youth Bunge / St. Joseph SHG"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Frequency of Meetings
                    </label>
                    <select
                      value={meetingFrequency}
                      onChange={(e) => setMeetingFrequency(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900"
                    >
                      <option value="Weekly">Weekly</option>
                      <option value="Bi-Weekly">Bi-Weekly (Every 2 weeks)</option>
                      <option value="Monthly">Monthly</option>
                      <option value="As Needed">As Needed / Scheduled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Date of Next Meeting (Optional)
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                      <input
                        type="date"
                        value={nextMeetingDate}
                        onChange={(e) => setNextMeetingDate(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 pl-9 text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Security Password */}
            <div>
              <h3 className="text-base font-bold text-sky-900 flex items-center gap-2 mb-3 border-b border-stone-200 pb-2">
                <Lock className="w-5 h-5 text-sky-600" />
                4. Create Password (to sign in anytime)
              </h3>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min. 6 characters)"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Submitting & Joining Ward...' : (
                  <>
                    <span>Complete Registration & Go to Ward Wall</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              <p className="text-center text-xs text-stone-500 mt-3">
                By registering, your organization will be listed on your ward's assembly wall for participatory dialogue.
              </p>
            </div>
          </form>

          {/* Links for existing users & Staff */}
          <div className="mt-8 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
            <div>
              Already have an account?{' '}
              <Link to="/login" className="text-sky-700 font-bold hover:underline">
                Sign in here
              </Link>
            </div>
            <div className="text-right">
              <Link to="/staff-register" className="text-stone-400 hover:text-stone-700 transition-colors flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Ward Clerk / Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
