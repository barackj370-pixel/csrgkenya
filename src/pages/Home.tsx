import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Calendar, Users, ArrowRight, AlertCircle, Clock, ChevronDown, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import WardCard from '../components/ui/WardCard';
import KenyaMap from '../components/ui/KenyaMap';
import NationalAssemblyBanner from '../components/ui/NationalAssemblyBanner';
import { supabase } from '../lib/supabase';
import { 
  searchKenyaWards, 
  TOTAL_KENYA_COUNTIES, 
  TOTAL_KENYA_WARDS 
} from '../data/kenyaCountiesAndWards';

function getLastSaturday(year: number, month: number) {
  const date = new Date(year, month, 0);
  date.setDate(date.getDate() - ((date.getDay() + 1) % 7));
  return date;
}

export default function Home() {
  const [wards, setWards] = useState<any[]>([]);
  const [issues, setIssues] = useState([]);
  const [pastAssemblies, setPastAssemblies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAssemblyDropdownOpen, setIsAssemblyDropdownOpen] = useState(false);
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [wardSearchQuery, setWardSearchQuery] = useState('');
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();

  const assemblies = [
    { date: new Date(2026, 3, 30), name: "Ward Citizen Assembly" },
    { date: new Date(2026, 5, 26), name: "Ward Citizen Assembly" },
    { date: new Date(2026, 6, 30), name: "Ward Citizen Assembly" },
    { date: new Date(2026, 8, 24), name: "Ward Citizen Assembly" },
    { date: new Date(2026, 11, 10), name: "National Citizen Assembly" }
  ];
  
  // Find the next assembly date
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
  
  const nextAssembly = assemblies.find(a => {
    const dCopy = new Date(a.date);
    dCopy.setHours(0, 0, 0, 0);
    return dCopy >= today;
  }) || assemblies[0];

  const nextAssemblyDate = nextAssembly.date;
  const nextAssemblyName = nextAssembly.name;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === 0 ? 1 : 0));
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [wardsRes, issuesRes, discussionsRes] = await Promise.all([
          supabase.from('Ward').select('*'),
          supabase.from('Issue').select('*, ward:Ward(*)'),
          supabase.from('Discussion').select('*, ward:Ward(*)')
        ]);

        if (wardsRes.error) console.warn('Wards fetch error:', wardsRes.error);
        if (issuesRes.error) console.warn('Issues fetch error:', issuesRes.error);
        if (discussionsRes.error) console.warn('Discussions fetch error:', discussionsRes.error);
        
        let wardsData = wardsRes.data?.map(w => ({
          ...w,
          _count: { issues: 0, discussions: 0, groups: 0, users: 0 }
        })) || [];
        
        setWards(wardsData);

        let issuesData = issuesRes.data as any || [];
        setIssues(issuesData);
        
        let past = discussionsRes.data 
          ? discussionsRes.data.filter((d: any) => d.status === 'CLOSED') 
          : [];
          
        setPastAssemblies(past);
      } catch (error) {
        console.warn('Failed to fetch data', error);
        setWards([]);
        setIssues([]);
        setPastAssemblies([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-stone-50 min-h-screen"
    >
      {/* Hero Section */}
      <section className="relative bg-sky-600 text-white overflow-hidden py-12 sm:py-16 min-h-[400px] flex items-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-950 via-sky-900 to-sky-800 opacity-90"></div>
          {/* Subtle Kenya Flag Colors Overlay */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-400 via-sky-300 to-sky-500"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <AnimatePresence mode="wait">
            {currentSlide === 0 ? (
              <motion.div 
                key="slide1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
              >
                <div className="text-left">
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                    Civil Society<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-white">
                      Reference Group
                    </span>
                  </h1>
                  <p className="mt-2 text-lg text-stone-300 max-w-xl mb-6">
                    Join structured citizen assemblies in your Ward. Discuss pressing issues, propose solutions, and track resolutions that impact wananchi. Assemblies are held every two months on the last Saturday of the month.
                    <br/><br/>
                    <span className="text-sm text-stone-400 bg-sky-800/50 p-3 rounded-lg block border border-stone-700/50">
                      <strong>Note:</strong> Each citizen assembly is supported by <strong>12 Citizen Assembly Committees</strong> meeting between April and November 2026 (Specific dates TBD).
                    </span>
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center gap-2 bg-white text-sky-900 hover:bg-stone-100 px-6 py-3.5 rounded-full font-bold text-base transition-all shadow-lg hover:shadow-xl"
                    >
                      <Users className="w-5 h-5 text-sky-700" />
                      Join Your Ward Assembly
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="hidden lg:block relative max-w-sm mx-auto">
                  <KenyaMap />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="slide2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
              >
                <div className="text-left">
                  <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-400 px-3 py-1.5 rounded-full text-xs font-bold mb-4 border border-sky-500/30">
                    <Calendar className="w-3.5 h-3.5" /> Next: {nextAssemblyName}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                    {nextAssemblyDate.toLocaleDateString('en-US', { weekday: 'long' })},<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-white">
                      {nextAssemblyDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, {nextAssemblyDate.getFullYear()}
                    </span>
                  </h1>
                  <p className="mt-2 text-lg text-stone-300 max-w-xl mb-6">
                    Join the National Citizen Assembly gathering citizen representatives and wananchi from across all 47 counties and electoral wards in Kenya. 
                    Discuss pressing community issues, propose solutions, and ratify national resolutions.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center gap-2 bg-white text-sky-900 hover:bg-stone-100 px-6 py-3.5 rounded-full font-bold text-base transition-all shadow-lg hover:shadow-xl"
                    >
                      <Users className="w-5 h-5 text-sky-700" />
                      Register as a Citizen
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                
                <div className="hidden lg:flex justify-center items-center">
                  <div className="relative w-full max-w-[280px] aspect-square rounded-full border-4 border-stone-800 flex items-center justify-center bg-sky-600/50 backdrop-blur-sm shadow-2xl">
                    <div className="absolute inset-0 rounded-full border border-stone-700 m-3"></div>
                    <div className="absolute inset-0 rounded-full border border-stone-700 m-6"></div>
                    <div className="text-center">
                      <Calendar className="w-16 h-16 text-sky-500 mx-auto mb-4 opacity-80" />
                      <div className="text-3xl font-bold text-white mb-1">{nextAssemblyDate.toLocaleDateString('en-US', { day: '2-digit' })}</div>
                      <div className="text-lg text-stone-400 uppercase tracking-widest">{nextAssemblyDate.toLocaleDateString('en-US', { month: 'long' })}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Carousel Controls */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            <button 
              onClick={() => setCurrentSlide(0)}
              className={`w-3 h-3 rounded-full transition-all ${currentSlide === 0 ? 'bg-white scale-125' : 'bg-stone-600 hover:bg-stone-400'}`}
            />
            <button 
              onClick={() => setCurrentSlide(1)}
              className={`w-3 h-3 rounded-full transition-all ${currentSlide === 1 ? 'bg-white scale-125' : 'bg-stone-600 hover:bg-stone-400'}`}
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Featured Campaign: National Citizen Assembly Official Digital Poster */}
        <section id="national-citizen-assembly" className="scroll-mt-24">
          <NationalAssemblyBanner />
        </section>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left Column: Discussions & Issues */}
            <div className="lg:col-span-2 space-y-12">
              
              {/* Upcoming Assemblies */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-sky-800 flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-sky-600" />
                    Upcoming Assembly
                  </h2>
                  <button 
                    onClick={() => setIsViewAllModalOpen(true)}
                    className="text-stone-600 hover:text-sky-800 font-medium flex items-center gap-1"
                  >
                    View All Schedule <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-stone-500">
                  National and community gatherings where citizens and nominated representatives meet to discuss priorities.
                  <span className="block mt-2 text-sm bg-stone-100 p-3 rounded-lg text-stone-700 border border-stone-200">
                    <Users className="w-4 h-4 inline mr-1 text-stone-500" />
                    <strong>Participation Process:</strong> Preceded by community mini-caucuses meeting between 19 October and 15 November 2026.
                  </span>
                </p>
                
                <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 left-0 w-2 h-full bg-sky-600"></div>
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-4 mb-3">
                        <span className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 px-3 py-1 rounded-full text-sm font-bold">
                          <Calendar className="w-4 h-4" /> {formatDate(nextAssemblyDate)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-700 px-3 py-1 rounded-full text-sm font-medium">
                          <Clock className="w-4 h-4" /> 9:00 AM - 5:00 PM
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                          <MapPin className="w-4 h-4" /> Nairobi, Kenya
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-sky-800 mb-2">National Citizen Assembly (All Kenyan Counties & Wards)</h3>
                      <p className="text-stone-600 max-w-2xl">
                        Uniting citizen representatives nominated across community mini-caucuses from electoral wards nationwide.
                        Join dialogue, propose solutions, and track resolutions.
                      </p>
                    </div>
                    <div className="flex-shrink-0 w-full md:w-auto relative">
                      <Link
                        to="/register"
                        className="inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-colors shadow-sm"
                      >
                        <Users className="w-4 h-4" />
                        Join Your Ward
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Proposed Issues */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-sky-800 flex items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-sky-800" />
                    Proposed Issues for Next Assembly
                  </h2>
                </div>
                <p className="text-stone-500">Topics and concerns submitted by clerks to be added to the official assembly agenda.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {issues.slice(0, 4).map((issue: any) => (
                    <div key={issue.id} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      {/* Decorative accent line */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-sky-600"></div>
                      
                      <div className="flex items-start justify-between mb-3 mt-2">
                        <span className="inline-flex items-center gap-1 bg-stone-100 px-2 py-1 rounded-md text-xs font-medium text-stone-600">
                          <MapPin className="w-3 h-3" /> {issue.ward?.name}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-sky-800 mb-2">{issue.title}</h3>
                      <p className="text-sm text-stone-600 line-clamp-3">{issue.description}</p>
                    </div>
                  ))}
                  {issues.length === 0 && (
                    <div className="col-span-full bg-white p-8 rounded-2xl border border-stone-200 text-center text-stone-500">
                      No issues have been proposed yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Passed Assemblies and Resolutions */}
              <div className="space-y-6 pt-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-sky-800 flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-sky-600" />
                    Passed Assemblies & Resolutions
                  </h2>
                </div>
                <p className="text-stone-500">Review the outcomes and official resolutions from previous citizen assemblies.</p>
                
                <div className="space-y-4">
                  {pastAssemblies.length > 0 ? (
                    pastAssemblies.map((assembly: any) => (
                      <div key={assembly.id} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-stone-100 text-stone-600 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                                {new Date(assembly.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                                <MapPin className="w-3 h-3" /> {assembly.ward?.name}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-sky-800">{assembly.title}</h3>
                          </div>
                          <button 
                            onClick={() => navigate(`/discussion/${assembly.id}`)}
                            className="text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 text-sm whitespace-nowrap"
                          >
                            View Resolutions <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-stone-600 text-sm">{assembly.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-stone-500">
                      No passed assemblies or resolutions yet.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Wards & Counties */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-sky-800 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-sky-600" />
                    Wards Directory
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {wards.length} Active Walls • Covering all {TOTAL_KENYA_COUNTIES} Counties in Kenya
                  </p>
                </div>
                <Link
                  to="/register"
                  className="text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-1.5 rounded-full transition-colors shadow-sm flex items-center gap-1"
                >
                  <span>+ Join Ward</span>
                </Link>
              </div>

              {/* Ward Finder Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={wardSearchQuery}
                  onChange={(e) => setWardSearchQuery(e.target.value)}
                  placeholder={`Search ${TOTAL_KENYA_WARDS} wards or 47 counties...`}
                  className="w-full bg-white border border-stone-200 rounded-xl py-2.5 pl-9 pr-8 text-xs focus:ring-2 focus:ring-sky-600 outline-none text-stone-900 shadow-sm"
                />
                {wardSearchQuery && (
                  <button
                    onClick={() => setWardSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Active Wards */}
              <div className="space-y-3.5">
                {wards
                  .filter((w: any) => {
                    if (!wardSearchQuery.trim()) return true;
                    const q = wardSearchQuery.toLowerCase();
                    return (
                      w.name?.toLowerCase().includes(q) ||
                      w.description?.toLowerCase().includes(q) ||
                      w.county?.toLowerCase().includes(q)
                    );
                  })
                  .map((ward: any) => (
                    <WardCard key={ward.id} ward={ward} />
                  ))}

                {wards.length > 0 &&
                  wards.filter((w: any) => {
                    if (!wardSearchQuery.trim()) return true;
                    const q = wardSearchQuery.toLowerCase();
                    return (
                      w.name?.toLowerCase().includes(q) ||
                      w.description?.toLowerCase().includes(q) ||
                      w.county?.toLowerCase().includes(q)
                    );
                  }).length === 0 && (
                    <div className="bg-white p-6 rounded-2xl border border-stone-200 text-center text-xs text-stone-500">
                      No activated assembly wall for "{wardSearchQuery}" yet.
                    </div>
                  )}
              </div>

              {/* Results from other Kenyan wards available to activate */}
              {wardSearchQuery.trim().length >= 2 && (
                (() => {
                  const matches = searchKenyaWards(wardSearchQuery, 6).filter(
                    (km) => !wards.some((w) => w.name.toLowerCase() === km.ward.toLowerCase())
                  );
                  if (matches.length === 0) return null;
                  return (
                    <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-sky-950">
                        <span>Activate Ward in {matches[0].county} County:</span>
                        <span className="text-[10px] text-sky-700 bg-sky-200/60 px-2 py-0.5 rounded-full">
                          {matches.length} more wards
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {matches.map((item, i) => {
                          const slug = item.ward.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                          return (
                            <Link
                              key={i}
                              to={`/register?ward=${slug}`}
                              className="w-full flex items-center justify-between p-2 bg-white hover:bg-sky-100/60 rounded-xl border border-sky-100 text-xs transition-colors group"
                            >
                              <div>
                                <span className="font-bold text-stone-900 group-hover:text-sky-800">
                                  {item.ward} Ward
                                </span>
                                <span className="text-[11px] text-stone-500 block">
                                  {item.county} County
                                </span>
                              </div>
                              <span className="text-[11px] font-bold text-sky-600 group-hover:underline flex items-center gap-0.5">
                                Activate & Join →
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              )}

              {/* National Citizen Assembly Poster Teaser Card */}
              <div className="bg-gradient-to-br from-sky-950 via-sky-900 to-sky-900 rounded-3xl p-6 text-white border-2 border-sky-400/40 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-stone-900 via-red-600 to-emerald-600"></div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] bg-red-600 text-white font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Official Campaign
                  </span>
                  <span className="text-xs text-sky-200 font-bold">10 Dec 2026</span>
                </div>
                <h3 className="text-xl font-black text-white leading-tight uppercase">
                  National Citizen Assembly
                </h3>
                <p className="text-stone-300 text-xs mt-2 leading-relaxed">
                  Join community mini-caucuses (19 Oct – 15 Nov) and nominate your organisation's representative for the National Assembly in Nairobi.
                </p>

                <div className="mt-4 pt-4 border-t border-sky-800/80 flex flex-col gap-2">
                  <Link
                    to="/register"
                    className="w-full text-center bg-sky-500 hover:bg-sky-400 text-stone-950 font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow"
                  >
                    Register to Participate
                  </Link>
                  <Link
                    to="/national-assembly"
                    className="w-full text-center bg-white/10 hover:bg-white/20 text-sky-100 font-bold py-2 rounded-xl text-xs transition-colors"
                  >
                    View Participation Poster & Timelines
                  </Link>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* View All Assemblies Modal */}
      <AnimatePresence>
        {isViewAllModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsViewAllModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 sm:p-8 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                <div>
                  <h3 className="text-2xl font-bold text-sky-800">Assembly Schedule {currentYear}</h3>
                  <p className="text-stone-500 text-sm mt-1">Upcoming scheduled assemblies for the year.</p>
                </div>
                <button 
                  onClick={() => setIsViewAllModalOpen(false)}
                  className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  {assemblies.map((assembly, idx) => {
                    const date = assembly.date;
                    const isPast = date < today;
                    const isNext = date === nextAssemblyDate;
                    
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center p-4 rounded-2xl border ${
                          isNext 
                            ? 'border-sky-500 bg-sky-50 shadow-md' 
                            : isPast 
                              ? 'border-stone-200 bg-stone-50 opacity-60' 
                              : 'border-stone-200 bg-white hover:border-stone-300'
                        } transition-all`}
                      >
                        <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0 mr-6 ${
                          isNext ? 'bg-sky-600 text-white' : isPast ? 'bg-stone-200 text-stone-500' : 'bg-sky-600 text-white'
                        }`}>
                          <span className="text-xs font-bold uppercase tracking-wider">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                          <span className="text-2xl font-black leading-none">{date.getDate()}</span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`text-lg font-bold ${isNext ? 'text-red-900' : isPast ? 'text-stone-600' : 'text-sky-800'}`}>
                              {assembly.name}
                            </h4>
                            {isNext && (
                              <span className="bg-sky-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Next
                              </span>
                            )}
                            {isPast && (
                              <span className="bg-stone-200 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Completed
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${isNext ? 'text-sky-700' : 'text-stone-500'} flex items-center gap-1.5`}>
                            <Clock className="w-3.5 h-3.5" /> 9:00 AM - 1:00 PM • All Wards
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end">
                <button 
                  onClick={() => setIsViewAllModalOpen(false)}
                  className="bg-sky-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-sky-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
