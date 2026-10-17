import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Building2, 
  ClipboardCheck, 
  Flame, 
  HeartHandshake, 
  GraduationCap, 
  Church, 
  PiggyBank, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  MapPin, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface NationalAssemblyBannerProps {
  compact?: boolean;
}

export default function NationalAssemblyBanner({ compact = false }: NationalAssemblyBannerProps) {
  const whoCanParticipate = [
    { title: 'Community Groups', icon: Users, desc: 'Local neighborhood & estate associations' },
    { title: 'CSOs', full: 'Civil Society Organisations', icon: Building2, desc: 'Civic action & advocacy groups' },
    { title: 'PBOs', full: 'Public Benefit Organisations', icon: ClipboardCheck, desc: 'Registered public interest bodies' },
    { title: 'GHRDs', full: 'Grassroots Human Rights Defenders', icon: Flame, desc: 'Community justice defenders' },
    { title: 'Women Groups', icon: HeartHandshake, desc: 'Chamas & women empowerment tables' },
    { title: 'Youth Groups', icon: GraduationCap, desc: 'Youth bunges, sports & creator groups' },
    { title: 'Religious Organisations', icon: Church, desc: 'Faith-based associations & councils' },
    { title: 'SHG', full: 'Self Help Groups', icon: PiggyBank, desc: 'Community cooperative savings groups' },
  ];

  const steps = [
    {
      num: '1',
      title: 'Be a Member of an Active Organisation',
      desc: 'You must be from an active Community Group, CSO, PBO, GHRD, Women Group, Youth Group, Religious Organisation or Self Help Group.',
      badge: 'Eligibility'
    },
    {
      num: '2',
      title: 'Submit Your Organisation Details',
      desc: 'Register online with your Organisation Name, Village, Ward, Meeting Frequency, and Next Meeting Date.',
      badge: 'Online Form'
    },
    {
      num: '3',
      title: 'Hold a Mini-Caucus in Your Organisation',
      desc: 'Hold a mini-caucus meeting between 19 October and 15 November 2026 at your organisation’s meeting venue.',
      badge: 'Community Level'
    },
    {
      num: '4',
      title: 'Nominate a Representative',
      desc: 'During the mini-caucus, nominate a representative from your organisation to participate in the National Citizen Assembly.',
      badge: 'National Assembly'
    }
  ];

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl border border-sky-100 overflow-hidden relative">
      {/* Top Kenyan Tricolor Accent */}
      <div className="h-2 w-full bg-gradient-to-r from-stone-900 via-red-600 to-emerald-700 flex">
        <div className="w-1/3 bg-stone-900"></div>
        <div className="w-1/3 bg-red-600 border-y border-white"></div>
        <div className="w-1/3 bg-emerald-700"></div>
      </div>

      {/* Main Poster Header */}
      <div className="bg-gradient-to-br from-sky-950 via-sky-900 to-sky-800 text-white p-6 sm:p-10 relative overflow-hidden">
        {/* Subtle patterned overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            {/* CSRG Brand Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white p-1.5 rounded-lg shadow-sm">
                <img src="/logo.svg" alt="CSRG Kenya" className="h-8 w-auto object-contain" />
              </div>
              <div className="border-l border-sky-600 pl-3">
                <span className="text-xs uppercase tracking-wider font-extrabold text-sky-200 block">
                  Civil Society Reference Group (CSRG) Kenya
                </span>
                <span className="text-[11px] text-stone-300">Amplifying Citizen Voices Nationwide</span>
              </div>
            </div>

            {/* Poster Titles */}
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-none">
              National <span className="text-sky-300">Citizen Assembly</span>
            </h1>
            
            <div className="mt-3 inline-block bg-sky-950/80 border border-sky-400/40 px-4 py-1.5 rounded-xl shadow-inner">
              <span className="text-sm sm:text-base font-bold text-sky-200 tracking-wider uppercase">
                Participation Process and Timelines
              </span>
            </div>

            <p className="mt-3 text-sm sm:text-base text-sky-100 font-medium italic max-w-2xl leading-relaxed">
              "A people-centred space for dialogue, collective action and a more just and inclusive Kenya."
            </p>
          </div>

          {/* Stamp / Tagline Badge */}
          <div className="flex-shrink-0 self-start lg:self-center">
            <div className="bg-gradient-to-br from-red-600 to-red-700 text-white p-4 sm:p-5 rounded-2xl shadow-xl border-2 border-red-400/50 transform rotate-1 hover:rotate-0 transition-transform text-center max-w-[200px]">
              <div className="text-[10px] font-black tracking-widest uppercase bg-white/20 py-0.5 rounded px-2 mb-1">
                Kenya Wananchi
              </div>
              <div className="text-lg sm:text-xl font-black uppercase leading-tight tracking-tight drop-shadow">
                People Voices Stronger Together
              </div>
              <div className="mt-2 flex justify-center items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-stone-900 border border-white"></span>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400 border border-white"></span>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: WHO CAN PARTICIPATE? */}
      <div className="p-6 sm:p-8 bg-sky-50/50 border-b border-sky-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-sky-900 text-white text-xs sm:text-sm font-black px-4 py-2 rounded-xl uppercase tracking-wider shadow">
            Who Can Participate?
          </div>
          <span className="text-xs text-stone-500 font-medium hidden sm:inline">
            Open to all grassroots citizen bodies across Kenyan wards
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {whoCanParticipate.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="bg-white rounded-2xl p-3 border border-sky-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 text-sky-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform group-hover:bg-sky-600 group-hover:text-white">
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-sky-950 leading-snug line-clamp-2">
                  {item.title}
                </h4>
                {item.full && (
                  <span className="text-[10px] text-stone-600 font-medium mt-0.5 line-clamp-1">
                    {item.full}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: PARTICIPATION PROCESS */}
      <div className="p-6 sm:p-8 bg-white border-b border-stone-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-sky-900 text-white text-xs sm:text-sm font-black px-4 py-2 rounded-xl uppercase tracking-wider shadow">
            Participation Process
          </div>
          <span className="text-xs text-stone-500 font-medium">
            4 simple steps to represent your community
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {steps.map((step, idx) => (
            <div 
              key={idx}
              className="bg-stone-50 rounded-2xl p-5 border border-stone-200 flex flex-col justify-between hover:bg-sky-50/50 hover:border-sky-300 transition-all relative group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-full bg-sky-600 text-white font-black flex items-center justify-center text-base shadow">
                    {step.num}
                  </div>
                  <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full uppercase">
                    {step.badge}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-sky-950 mb-2 leading-snug">
                  {step.title}
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: TIMELINES */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-sky-50 via-white to-sky-50 border-b border-sky-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-sky-900 text-white text-xs sm:text-sm font-black px-4 py-2 rounded-xl uppercase tracking-wider shadow">
            Timelines
          </div>
          <span className="text-xs text-stone-500 font-medium">
            Mark key dates for community mini-caucuses and the national assembly
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Timeline Box 1 */}
          <div className="bg-white rounded-2xl p-6 border-2 border-sky-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-5 hover:border-sky-400 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-sky-900 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-md">
              <Calendar className="w-6 h-6 text-sky-300 mb-0.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Phase 1</span>
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider block mb-1">
                Mini-Caucuses Across Communities
              </span>
              <h3 className="text-xl font-extrabold text-sky-950">
                19 October – 15 November 2026
              </h3>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-stone-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-sky-600" /> 9:00 AM – 5:00 PM
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" /> Organisations’ Meeting Venue
                </span>
              </div>
            </div>
          </div>

          {/* Timeline Box 2 */}
          <div className="bg-white rounded-2xl p-6 border-2 border-red-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-5 hover:border-red-400 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-stone-900 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-md">
              <Sparkles className="w-6 h-6 text-yellow-400 mb-0.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Summit</span>
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider block mb-1">
                National Citizen Assembly Gathering
              </span>
              <h3 className="text-xl font-extrabold text-sky-950">
                10 December 2026
              </h3>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-stone-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-red-600" /> 9:00 AM – 5:00 PM
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-red-600" /> Nairobi, Kenya
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: CALL TO ACTION BANNER (Updated per instruction) */}
      <div className="bg-gradient-to-r from-sky-950 via-sky-900 to-sky-950 p-6 sm:p-8 text-white relative">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400/40 text-sky-300 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                Register to Participate in Your Ward
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm mt-0.5 max-w-xl">
                To participate, enter your <span className="text-sky-300 font-bold">Organisation Name, Village, and Ward</span> online. You will immediately be added to your ward's assembly wall.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-stone-950 px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg hover:scale-105"
            >
              <span>Register as Citizen</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* BOTTOM FOOTER RIBBON */}
      <div className="bg-stone-100 py-3 px-4 border-t border-stone-200 text-center">
        <div className="text-[10px] sm:text-xs font-bold text-stone-600 uppercase tracking-widest flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>Leadership Development</span>
          <span className="text-stone-400">|</span>
          <span>Institutional Strengthening</span>
          <span className="text-stone-400">|</span>
          <span>Mutual Protection</span>
          <span className="text-stone-400">|</span>
          <span>Self-Regulation</span>
          <span className="text-stone-400">|</span>
          <span>Policy and Advocacy</span>
        </div>
      </div>
    </div>
  );
}
