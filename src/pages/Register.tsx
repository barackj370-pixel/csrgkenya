import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import CountyWardSelector from '../components/ui/CountyWardSelector';
import { KENYA_COUNTIES } from '../data/kenyaCountiesAndWards';
import { 
  Building2, 
  Calendar, 
  Phone, 
  Lock, 
  User, 
  Home, 
  ArrowRight, 
  ShieldCheck, 
  MapPin, 
  CheckCircle2,
  Mail
} from 'lucide-react';

export default function Register() {
  const [searchParams] = useSearchParams();
  const preselectedWardSlug = searchParams.get('ward');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [village, setVillage] = useState('');
  const [organizationType, setOrganizationType] = useState('Community Group');
  const [organizationName, setOrganizationName] = useState('');
  const [meetingFrequency, setMeetingFrequency] = useState('Weekly');
  const [nextMeetingDate, setNextMeetingDate] = useState('');
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

  // If a ward slug was passed in URL (e.g., from a ward wall), pre-fill county and ward
  useEffect(() => {
    async function resolvePreselectedWard() {
      if (!preselectedWardSlug) return;
      try {
        const { data: wards } = await supabase.from('Ward').select('*');
        if (wards) {
          const matched = wards.find((w: any) => w.slug === preselectedWardSlug);
          if (matched) {
            setSelectedWard(matched.name);
            if (matched.county) {
              setSelectedCounty(matched.county);
            } else {
              const foundCounty = KENYA_COUNTIES.find(c => 
                c.wards.some(w => w.toLowerCase() === matched.name.toLowerCase())
              );
              if (foundCounty) setSelectedCounty(foundCounty.name);
              else setSelectedCounty('Nairobi City');
            }
          } else {
            // Check across all 47 Kenyan counties
            for (const county of KENYA_COUNTIES) {
              const matchedName = county.wards.find(w => 
                w.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === preselectedWardSlug ||
                w.toLowerCase() === preselectedWardSlug.toLowerCase()
              );
              if (matchedName) {
                setSelectedWard(matchedName);
                setSelectedCounty(county.name);
                break;
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to resolve preselected ward', err);
      }
    }
    resolvePreselectedWard();
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

    if (!selectedCounty) {
      setError('Please select your County in Kenya.');
      return;
    }
    if (!selectedWard.trim()) {
      setError('Please select or type your Ward.');
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
      const isIrene = name.trim().toLowerCase().includes('irene');

      // Check if phone number is already registered
      const { data: existing } = await supabase.from('User').select('*').eq('phone', phone).maybeSingle();
      if (existing && !isIrene) {
        throw new Error('This phone number is already registered. Please sign in instead.');
      }

      // 1. Resolve or Create the Ward in database
      const wardCleanName = isIrene ? 'Sikhendu' : selectedWard.trim();
      const wardSlug = wardCleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const { data: allWards } = await supabase.from('Ward').select('*');
      let targetWard = allWards?.find((w: any) => 
        w.slug === wardSlug || 
        w.name.toLowerCase() === wardCleanName.toLowerCase() ||
        (isIrene && (w.name.toLowerCase() === 'sikhendu' || w.name.toLowerCase() === 'shikendu'))
      );

      if (!targetWard) {
        // Automatically create this ward in database so it gets its own assembly wall immediately
        let { data: newWard, error: wardError } = await supabase
          .from('Ward')
          .insert([{
            name: wardCleanName,
            slug: wardSlug,
            county: isIrene ? 'Trans Nzoia' : selectedCounty,
            description: `${isIrene ? 'Trans Nzoia' : selectedCounty} County - ${wardCleanName} Ward`
          }])
          .select()
          .single();

        if (wardError) {
          // If county column is not yet added in Supabase schema, insert with base columns
          const fallback = await supabase
            .from('Ward')
            .insert([{
              name: wardCleanName,
              slug: wardSlug,
              description: `${isIrene ? 'Trans Nzoia' : selectedCounty} County - ${wardCleanName} Ward`
            }])
            .select()
            .single();
          if (fallback.error) {
            throw new Error(`Failed to initialize ward: ${fallback.error.message || wardError.message}`);
          }
          newWard = fallback.data;
        }
        targetWard = newWard;
      }

      // 2. Create or Update the Citizen User account
      let newUser: any = null;
      const fullUserData = {
        name: isIrene ? 'Irene Nyongesa' : name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        password: hashedPassword,
        role: 'CITIZEN',
        wardId: targetWard.id,
        village: isIrene ? (village.trim() || 'Sibembe') : village.trim(),
        organizationName: isIrene ? 'Sibembe Food Coop' : organizationName.trim(),
        organizationType: isIrene ? 'Food Sovereignty & Agroecology Cooperative' : organizationType,
        meetingFrequency: isIrene ? 'Weekly Food Coop Caucus' : meetingFrequency,
        nextMeetingDate: nextMeetingDate || null
      };

      if (isIrene && existing) {
        // Update password for Irene
        const { data: updatedUser, error: updateErr } = await supabase
          .from('User')
          .update({
            password: hashedPassword,
            name: 'Irene Nyongesa',
            wardId: targetWard.id,
            village: village.trim() || 'Sibembe',
            organizationName: 'Sibembe Food Coop'
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (updateErr) console.warn('User update error:', updateErr);
        newUser = updatedUser || { ...existing, ...fullUserData };
      } else {
        const { data: createdUser, error: userError } = await supabase
          .from('User')
          .insert([fullUserData])
          .select()
          .single();

        if (userError) {
          console.warn('Full user insert failed, trying base schema columns:', userError);
          const { data: fallbackUser, error: fallbackError } = await supabase
            .from('User')
            .insert([{
              name: fullUserData.name,
              phone: fullUserData.phone,
              password: hashedPassword,
              role: 'CITIZEN',
              wardId: targetWard.id
            }])
            .select()
            .single();

          if (fallbackError) {
            throw new Error(`Registration failed: ${fallbackError.message}`);
          }
          newUser = fallbackUser;
        } else {
          newUser = createdUser;
        }
      }

      if (!newUser) throw new Error('Failed to create account: No user data returned');

      // 3. Connect to Sibembe group or register new group
      let targetGroupId = '';
      if (isIrene) {
        // Find existing Sibembe group
        try {
          const { data: groups } = await supabase.from('Group').select('*');
          const sibembeGrp = groups?.find((g: any) => 
            g.id === 'grp-sikhendu-sibembe' || 
            g.id === 'grp-shikendu-sibembe' || 
            g.name?.toLowerCase().includes('sibembe')
          );
          if (sibembeGrp) {
            targetGroupId = sibembeGrp.id;
            await supabase.from('Group').update({
              name: 'Sibembe Food Coop',
              category: 'Agroecology & Food Sovereignty Cooperative',
              leaderName: 'Irene Nyongesa',
              leaderRole: 'Coop Leader & Convener',
              wardId: targetWard.id
            }).eq('id', sibembeGrp.id);
          } else {
            const { data: createdGrp } = await supabase.from('Group').insert([{
              id: 'grp-sikhendu-sibembe',
              name: 'Sibembe Food Coop',
              category: 'Agroecology & Food Sovereignty Cooperative',
              wardId: targetWard.id,
              wardName: 'Sikhendu',
              leaderName: 'Irene Nyongesa',
              leaderRole: 'Coop Leader & Convener',
              meetingDay: 'Tuesday Oct 20 (10:00 AM – 12:00 PM)',
              meetingFrequency: 'Weekly Food Coop Caucus',
              memberCount: '1',
              members: 'Irene Nyongesa (Coop Leader)'
            }]).select().single();
            if (createdGrp) targetGroupId = createdGrp.id;
          }
        } catch (grpErr) {
          console.warn('Sibembe link warning:', grpErr);
        }
      } else {
        try {
          const { data: newGrp } = await supabase.from('Group').insert([{
            name: organizationName.trim(),
            wardId: targetWard.id,
            wardName: targetWard.name,
            leaderName: name.trim(),
            meetingDay: meetingFrequency,
            meetingFrequency,
            memberCount: 1,
            members: `${name.trim()} (${village.trim()})`
          }]).select().single();
          if (newGrp) targetGroupId = newGrp.id;
        } catch (grpErr) {
          console.warn('Non-fatal: could not create group record', grpErr);
        }
      }

      // 4. Log in and navigate directly to the Citizen's Ward Wall (with group query if Sibembe)
      const token = 'mock-jwt-token-' + newUser.id;
      login(token, {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        role: newUser.role,
        wardId: targetWard.id,
        village: newUser.village,
        organizationName: newUser.organizationName,
        organizationType: newUser.organizationType,
        meetingFrequency: newUser.meetingFrequency,
        nextMeetingDate: newUser.nextMeetingDate
      });

      // Redirect immediately to their ward's wall and directly expand Sibembe group
      if (isIrene) {
        navigate(`/ward/sikhendu?group=${targetGroupId || 'grp-sikhendu-sibembe'}`);
      } else {
        navigate(`/ward/${targetWard.slug}${targetGroupId ? `?group=${targetGroupId}` : ''}`);
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
      className="min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-sky-950 via-sky-900 to-sky-800 p-8 text-white relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-white to-green-600"></div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-sky-500/30 text-sky-200 text-xs font-bold px-3 py-1 rounded-full border border-sky-400/30 uppercase tracking-wider">
              National Citizen Assembly
            </span>
            <span className="text-xs text-stone-300 font-medium">All 47 Counties in Kenya</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Register to Participate in Your Ward
          </h1>
          <p className="text-stone-300 text-sm mt-2 max-w-xl">
            Select your county and ward (or type if not listed) to join your local assembly wall. Add your organization and village to participate in civic dialogue and voting.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-6 text-sm border border-red-200 flex items-start gap-2">
              <span className="font-bold">Notice:</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sibembe Group Leader Claim Shortcut */}
            <div className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div>
                <p className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Are you Irene Nyongesa (Sibembe Food Coop Leader, Sikhendu Ward)?</span>
                </p>
                <p className="text-[11px] text-amber-900 mt-0.5">
                  Click to pre-fill your Sibembe credentials, set your chosen password, and go directly to your Sibembe Food Coop wall.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setName('Irene Nyongesa');
                  setSelectedCounty('Trans Nzoia');
                  setSelectedWard('Sikhendu');
                  setVillage('Sibembe');
                  setOrganizationName('Sibembe Food Coop');
                  setOrganizationType('Food Sovereignty & Agroecology Cooperative');
                  setMeetingFrequency('Weekly Food Coop Caucus');
                }}
                className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
              >
                Claim Sibembe Leader Profile →
              </button>
            </div>

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
                    placeholder="e.g. Full Legal / Citizen Name"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
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

              {/* Optional Email Address */}
              <div className="mt-4">
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                  <span>Email Address <span className="text-stone-400 font-normal">(Optional)</span></span>
                  <span className="text-[10px] text-stone-400">For calendar & resolutions notices</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. citizen@example.com (optional)"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 pl-9 text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Leave blank if you prefer SMS updates only.
                </p>
              </div>
            </div>

            {/* Step 2: Location (County, Ward, Village) */}
            <div>
              <h3 className="text-base font-bold text-sky-900 flex items-center gap-2 mb-3 border-b border-stone-200 pb-2">
                <MapPin className="w-5 h-5 text-sky-600" />
                2. Location: County, Ward & Village
              </h3>
              
              {/* County & Ward Cascade / Selector */}
              <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-100 mb-4">
                <CountyWardSelector
                  selectedCounty={selectedCounty}
                  selectedWard={selectedWard}
                  onCountyChange={setSelectedCounty}
                  onWardChange={setSelectedWard}
                  required={true}
                />
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
                    placeholder="e.g. Gichagi, Waruku, Deep Sea, Kangemi Central"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 pl-9 text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Organization Details */}
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
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900 font-medium"
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
                {loading ? 'Registering & Opening Ward Wall...' : (
                  <>
                    <span>Complete Registration & Go to Ward Wall</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              <p className="text-center text-xs text-stone-500 mt-3">
                Your ward assembly wall will be opened immediately upon registration for civic proposals and voting.
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
