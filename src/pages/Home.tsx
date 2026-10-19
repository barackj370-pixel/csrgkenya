import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  ArrowRight, 
  AlertCircle, 
  Clock, 
  ChevronDown, 
  X, 
  ShieldCheck, 
  Building2, 
  Bell, 
  Archive, 
  BookOpen, 
  Vote, 
  Sparkles,
  ExternalLink,
  CheckCircle2,
  LayoutDashboard
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import WardCard from '../components/ui/WardCard';
import KenyaMap from '../components/ui/KenyaMap';
import NationalAssemblyBanner from '../components/ui/NationalAssemblyBanner';
import PastAssembliesSection from '../components/ui/PastAssembliesSection';
import NationalActivitiesSection from '../components/ui/NationalActivitiesSection';
import HomepageWardResolutions from '../components/ui/HomepageWardResolutions';
import { supabase } from '../lib/supabase';
import { 
  searchKenyaWards, 
  TOTAL_KENYA_COUNTIES, 
  TOTAL_KENYA_WARDS 
} from '../data/kenyaCountiesAndWards';
import { 
  getNextNationalAssembly, 
  getAllQuarterlyAssemblies, 
  AssemblyEvent 
} from '../lib/assemblySchedule';
import { 
  getActiveCarouselAds, 
  CarouselAd, 
  getBlogPosts, 
  BlogPost, 
  getIndependentCandidates, 
  IndependentCandidate,
  getMiniCaucuses,
  MiniCaucusEvent 
} from '../lib/civicData';
import UpdateMiniCaucusModal from '../components/ui/UpdateMiniCaucusModal';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [wards, setWards] = useState<any[]>([]);
  const [issues, setIssues] = useState([]);
  const [pastAssemblies, setPastAssemblies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAssemblyDropdownOpen, setIsAssemblyDropdownOpen] = useState(false);
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [wardSearchQuery, setWardSearchQuery] = useState('');
  
  // Mini-Caucus and New features state
  const [miniCaucuses, setMiniCaucuses] = useState<MiniCaucusEvent[]>([]);
  const [activeCaucusIndex, setActiveCaucusIndex] = useState(0);
  const [isMiniCaucusModalOpen, setIsMiniCaucusModalOpen] = useState(false);
  const [carouselAds, setCarouselAds] = useState<CarouselAd[]>([]);
  const [recentBlogs, setRecentBlogs] = useState<BlogPost[]>([]);
  const [featuredCandidates, setFeaturedCandidates] = useState<IndependentCandidate[]>([]);

  const navigate = useNavigate();

  // Dynamic 3-Month (Quarterly) Assembly Scheduler
  const nextAssembly = getNextNationalAssembly();
  const allAssemblies = getAllQuarterlyAssemblies(2025, 2027);

  // Total slides in header carousel:
  // Slide 0: Mini-Caucus Spotlight (Carousel 1 - e.g. Sikhendu Ward Sibembe Caucus happening tomorrow)
  // Slide 1: Next National Citizen Assembly (Dec 10, 2026)
  // Slide 2: CSRG & Ward Assemblies (1,450 Wards)
  // Slide 3+: Any active carousel ads
  const totalSlides = 3 + carouselAds.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % (totalSlides || 3));
    }, 8500);
    return () => clearInterval(timer);
  }, [totalSlides]);

  // Reactive listener for live mini-caucus updates
  useEffect(() => {
    const handleCaucusesUpdated = async () => {
      const updated = await getMiniCaucuses();
      setMiniCaucuses(updated);
    };
    window.addEventListener('csrg_minicaucuses_updated', handleCaucusesUpdated);
    return () => window.removeEventListener('csrg_minicaucuses_updated', handleCaucusesUpdated);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [wardsRes, issuesRes, discussionsRes, adsData, blogsData, candsData, caucusesData] = await Promise.all([
          supabase.from('Ward').select('*'),
          supabase.from('Issue').select('*, ward:Ward(*)'),
          supabase.from('Discussion').select('*, ward:Ward(*)'),
          getActiveCarouselAds(),
          getBlogPosts(),
          getIndependentCandidates(),
          getMiniCaucuses()
        ]);

        if (wardsRes.error) console.warn('Wards fetch error:', wardsRes.error);
        if (issuesRes.error) console.warn('Issues fetch error:', issuesRes.error);
        if (discussionsRes.error) console.warn('Discussions fetch error:', discussionsRes.error);
        
        let wardsData = wardsRes.data?.map(w => ({
          ...w,
          _count: { issues: 0, discussions: 0, groups: 0, users: 0 }
        })) || [];
        
        setWards(wardsData);
        setIssues(issuesRes.data as any || []);
        
        let past = discussionsRes.data 
          ? discussionsRes.data.filter((d: any) => d.status === 'CLOSED') 
          : [];
        setPastAssemblies(past);

        setCarouselAds(adsData);
        setRecentBlogs(blogsData.slice(0, 3));
        setFeaturedCandidates(candsData.slice(0, 3));
        setMiniCaucuses(caucusesData);
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Dynamic Header Carousel (Ads First, followed by 2 defaults) */}
      <section className="relative bg-sky-900 text-white overflow-hidden py-12 sm:py-16 min-h-[460px] flex items-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-950 via-sky-900 to-stone-900 opacity-95"></div>
          {/* Subtle Kenya Flag Colors Ribbon */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-stone-900 via-red-600 to-emerald-600"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <AnimatePresence mode="wait">
            {/* Carousel Slide 0: CITIZEN MINI-CAUCUS SPOTLIGHT (Carousel 1) */}
            {currentSlide === 0 ? (
              (() => {
                const activeCaucus = miniCaucuses[activeCaucusIndex] || miniCaucuses[0];
                if (!activeCaucus) return null;
                const isTomorrow = activeCaucus.status === 'UPCOMING_TOMORROW' || activeCaucus.dateLabel.toLowerCase().includes('tomorrow');
                const isToday = activeCaucus.status === 'ACTIVE_TODAY' || activeCaucus.dateLabel.toLowerCase().includes('today');

                const targetWardSlug = activeCaucus.wardName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                const targetGroupParam = activeCaucus.groupId || 'grp-sikhendu-sibembe';

                return (
                  <motion.div 
                    key={`caucus-slide-${activeCaucus.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                  >
                    <div className="lg:col-span-7 text-left">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`text-[11px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${
                          isToday 
                            ? 'bg-red-500 text-white animate-pulse'
                            : isTomorrow
                            ? 'bg-emerald-400 text-stone-950 font-black ring-2 ring-emerald-300 shadow-md'
                            : 'bg-amber-400 text-stone-950 font-black'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${isToday ? 'bg-white' : 'bg-emerald-950'} animate-ping`} />
                          {isToday 
                            ? '🔴 HAPPENING TODAY • CITIZEN MINI-CAUCUS'
                            : isTomorrow
                            ? '🟢 HAPPENING TOMORROW • CITIZEN MINI-CAUCUS'
                            : '🗓️ CITIZEN MINI-CAUCUS SESSION'
                          }
                        </span>

                        <span className="text-xs text-sky-200 font-semibold bg-sky-950/80 px-3 py-1 rounded-full border border-sky-700/60 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          {activeCaucus.wardName} Ward • {activeCaucus.county}
                        </span>
                      </div>

                      <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3 leading-tight text-white">
                        {activeCaucus.title}
                      </h1>

                      <p className="mt-1 text-sm md:text-base text-stone-200 max-w-xl mb-4 leading-relaxed font-normal">
                        {activeCaucus.agenda}
                      </p>

                      {/* Schedule Summary Glass Card */}
                      <div className="bg-sky-950/70 border border-sky-700/60 rounded-2xl p-4 mb-6 max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="flex items-start gap-2.5">
                          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-stone-300 uppercase text-[10px] tracking-wider">Date & Time</p>
                            <p className="text-white font-semibold text-xs sm:text-sm">{activeCaucus.dateLabel}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <Building2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-stone-300 uppercase text-[10px] tracking-wider">Meeting Point / Venue</p>
                            <p className="text-white font-semibold text-xs sm:text-sm truncate">{activeCaucus.venue}</p>
                          </div>
                        </div>
                      </div>

                      {/* Main Call to Actions */}
                      <div className="flex flex-wrap gap-3 items-center">
                        <Link
                          to={`/ward/${targetWardSlug}?group=${targetGroupParam}`}
                          className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-950 px-6 py-3.5 rounded-2xl font-black text-sm md:text-base transition-all shadow-lg hover:shadow-xl cursor-pointer"
                        >
                          <Users className="w-4 h-4" />
                          <span>View {activeCaucus.wardName} Ward & Group Wall</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => setIsMiniCaucusModalOpen(true)}
                          className="inline-flex items-center justify-center gap-2 bg-sky-850 hover:bg-sky-750 text-white px-5 py-3.5 rounded-2xl font-bold text-xs sm:text-sm transition-all border border-sky-600/70 cursor-pointer shadow-md"
                        >
                          <Calendar className="w-4 h-4 text-emerald-400" />
                          <span>+ Update / Schedule Mini-Caucus</span>
                        </button>
                      </div>

                      {/* Multi-Caucus Switcher Pills */}
                      {miniCaucuses.length > 1 && (
                        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-sky-800/60">
                          <span className="text-[10px] uppercase font-bold text-sky-300">Active Caucuses:</span>
                          {miniCaucuses.map((c, idx) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setActiveCaucusIndex(idx)}
                              className={`text-[11px] px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                                activeCaucusIndex === idx
                                  ? 'bg-amber-400 text-stone-950 ring-1 ring-white'
                                  : 'bg-sky-950/80 text-stone-300 hover:text-white border border-sky-700/50'
                              }`}
                            >
                              {c.wardName} • {c.groupName.slice(0, 15)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Side Visual Hero Card */}
                    <div className="lg:col-span-5 hidden lg:block">
                      <div className="relative rounded-3xl p-6 bg-gradient-to-b from-sky-850/95 to-sky-950/95 border-2 border-emerald-400/40 shadow-2xl backdrop-blur-md">
                        <div className="flex items-center justify-between pb-3 border-b border-sky-800/70">
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Pre-Assembly Caucus
                          </span>
                          <span className="text-[11px] text-sky-200 bg-sky-900/90 px-2.5 py-0.5 rounded-full border border-sky-700/60 font-semibold">
                            {activeCaucus.county}
                          </span>
                        </div>

                        <div className="my-5 text-center p-4 bg-sky-900/50 rounded-2xl border border-sky-700/50 shadow-inner">
                          <p className="text-[11px] text-emerald-300 uppercase tracking-widest font-extrabold">Next Session Timing</p>
                          <h3 className="text-2xl font-black text-amber-300 mt-1">
                            {activeCaucus.dateLabel}
                          </h3>
                          <p className="text-xs text-stone-200 mt-1 font-medium">
                            {activeCaucus.venue}
                          </p>
                        </div>

                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between items-center py-1.5 border-b border-sky-800/40">
                            <span className="text-stone-300 font-medium">Convening Group:</span>
                            <span className="font-bold text-white text-right">{activeCaucus.groupName}</span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 border-b border-sky-800/40">
                            <span className="text-stone-300 font-medium">Assembly Goal:</span>
                            <span className="font-bold text-emerald-300 text-right">National Assembly (Dec 10)</span>
                          </div>
                          <div className="flex justify-between items-center py-1.5">
                            <span className="text-stone-300 font-medium">Facilitator:</span>
                            <span className="font-bold text-stone-200">{activeCaucus.facilitatorRole || 'Caucus Convener'}</span>
                          </div>
                        </div>

                        <div className="mt-5 pt-3 border-t border-sky-800/60">
                          <button
                            type="button"
                            onClick={() => setIsMiniCaucusModalOpen(true)}
                            className="w-full py-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Edit or Add New Ward Mini-Caucus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })()
            ) : currentSlide === 1 ? (
              /* Carousel Slide 1: Next National Assembly (Dynamic 3-Month Date Calculation) */
              <motion.div 
                key="national-assembly-slide"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
              >
                <div className="text-left">
                  <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-full text-xs font-bold mb-4 border border-emerald-400/30">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Upcoming: {nextAssembly.name}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight text-white">
                    {nextAssembly.date.toLocaleDateString('en-US', { weekday: 'long' })},<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-white">
                      {nextAssembly.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, {nextAssembly.date.getFullYear()}
                    </span>
                  </h1>
                  <p className="mt-2 text-base md:text-lg text-stone-300 max-w-xl mb-6 leading-relaxed">
                    Theme: <em>"{nextAssembly.theme}"</em>. Uniting citizen delegates and wananchi from across all 47 counties and 1,450 electoral wards in Kenya. Assemblies advance automatically every 3 months on the 10th.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center gap-2 bg-white text-sky-900 hover:bg-stone-100 px-6 py-3.5 rounded-2xl font-bold text-base transition-all shadow-lg hover:shadow-xl cursor-pointer"
                    >
                      <Users className="w-5 h-5 text-sky-700" />
                      Register as a Citizen Delegate
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsViewAllModalOpen(true)}
                      className="inline-flex items-center justify-center gap-2 bg-sky-800/80 hover:bg-sky-800 text-white px-5 py-3.5 rounded-2xl font-bold text-sm transition-all border border-sky-600/60 cursor-pointer"
                    >
                      <Calendar className="w-4 h-4 text-sky-300" />
                      View 3-Month Schedule
                    </button>
                  </div>
                </div>
                
                <div className="hidden lg:flex justify-center items-center">
                  <div className="relative w-full max-w-[280px] aspect-square rounded-3xl border-4 border-stone-800 flex items-center justify-center bg-sky-850/80 backdrop-blur-sm shadow-2xl">
                    <div className="text-center p-6">
                      <Calendar className="w-12 h-12 text-sky-400 mx-auto mb-2 opacity-90" />
                      <div className="text-4xl font-black text-white mb-0.5">{nextAssembly.date.toLocaleDateString('en-US', { day: '2-digit' })}</div>
                      <div className="text-base text-stone-300 uppercase tracking-widest font-bold">{nextAssembly.date.toLocaleDateString('en-US', { month: 'long' })}</div>
                      <div className="text-xs text-sky-300 mt-2 bg-sky-950/60 py-1 px-3 rounded-full inline-block border border-sky-700/50">
                        {nextAssembly.daysRemaining} days remaining
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : currentSlide === 2 ? (
              /* Carousel Slide 2: Civil Society Reference Group & Ward Assemblies (Assemblies held every 3 months) */
              <motion.div 
                key="csrg-overview-slide"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
              >
                <div className="text-left">
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight text-white">
                    Civil Society<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-white">
                      Reference Group
                    </span>
                  </h1>
                  <p className="mt-2 text-base md:text-lg text-stone-300 max-w-xl mb-6 leading-relaxed">
                    Join structured citizen assemblies in your Ward. Discuss pressing issues, propose solutions, and track resolutions that impact wananchi. Assemblies are held <strong>every 3 months (quarterly)</strong> on the 10th of the month.
                    <br/><br/>
                    <span className="text-xs text-stone-400 bg-sky-950/60 p-3.5 rounded-xl block border border-sky-800/60">
                      <strong>Constitutional Mandate:</strong> Each citizen assembly is supported by <strong>12 Citizen Assembly Committees</strong> meeting between April and November to follow up on resolutions and audit CADP budgets.
                    </span>
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center gap-2 bg-white text-sky-900 hover:bg-stone-100 px-6 py-3.5 rounded-2xl font-bold text-base transition-all shadow-lg hover:shadow-xl cursor-pointer"
                    >
                      <Users className="w-5 h-5 text-sky-700" />
                      Join Your Ward Assembly
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/independent-candidates"
                      className="inline-flex items-center justify-center gap-2 bg-sky-800/80 hover:bg-sky-800 text-white px-5 py-3.5 rounded-2xl font-bold text-sm transition-all border border-sky-600/60 cursor-pointer"
                    >
                      <Vote className="w-4 h-4 text-emerald-400" />
                      Independent Candidates Portal
                    </Link>
                  </div>
                </div>

                <div className="hidden lg:block relative max-w-sm mx-auto">
                  <KenyaMap />
                </div>
              </motion.div>
            ) : (
              /* Carousel Slide 3+: Active Carousel Ads */
              (() => {
                const adIndex = currentSlide - 3;
                const ad = carouselAds[adIndex];
                if (!ad) return null;
                return (
                  <motion.div 
                    key={`ad-${ad.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                  >
                    <div className="lg:col-span-7 text-left">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                          <Sparkles className="w-3 h-3 fill-stone-950" /> {ad.badge || 'Official Public Notice'}
                        </span>
                        <span className="text-xs text-sky-300 font-medium bg-sky-850/80 px-2.5 py-0.5 rounded-full border border-sky-700/60">
                          {ad.daysLeft > 0 ? `${ad.daysLeft} days remaining` : 'Expiring soon'}
                        </span>
                      </div>

                      <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 leading-tight text-white">
                        {ad.title}
                      </h1>

                      <p className="mt-2 text-base md:text-lg text-stone-300 max-w-xl mb-6 leading-relaxed">
                        {ad.subtitle}
                      </p>

                      <div className="flex flex-wrap gap-4 items-center">
                        <Link
                          to={ad.ctaLink || '/register'}
                          className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-950 px-6 py-3.5 rounded-2xl font-black text-sm md:text-base transition-all shadow-lg hover:shadow-xl cursor-pointer"
                        >
                          <span>{ad.ctaText || 'Learn More'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                        <span className="text-xs text-stone-400">
                          Posted by {ad.createdBy || 'CSRG National Secretariat'}
                        </span>
                      </div>
                    </div>

                    <div className="lg:col-span-5 hidden lg:block">
                      <div className="relative rounded-3xl overflow-hidden border-2 border-sky-400/30 shadow-2xl h-72 w-full bg-stone-800">
                        <img 
                          src={ad.imageUrl || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80'} 
                          alt={ad.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })()
            )}
          </AnimatePresence>
          
          {/* Carousel Dots Controls */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx 
                    ? 'w-8 bg-amber-400' 
                    : 'w-2.5 bg-stone-600 hover:bg-stone-400'
                }`}
                title={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* STRATEGIC PORTAL SECTION: 3 KEY ACTION GATEWAYS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Independent Candidates Portal */}
          <Link
            to="/independent-candidates"
            className="bg-gradient-to-br from-emerald-900 to-stone-900 rounded-3xl p-6 text-white shadow-md hover:shadow-xl transition-all group border border-emerald-700/40 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <Vote className="w-3 h-3 text-emerald-400" /> Non-Partisan Portal
                </span>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 leading-tight">
                Independent Candidates & Leaders Registry
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Discover independent grassroots champions running for MCA & MP who have signed the binding Citizen Assembly Integrity Pledge.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-emerald-800/60 flex items-center justify-between text-xs font-bold text-emerald-300">
              <span>Browse Vetted Candidates</span>
              <span>→</span>
            </div>
          </Link>

          {/* 2. Committee Sittings & Resolution Follow-Up */}
          <Link
            to="/committee-sittings"
            className="bg-gradient-to-br from-sky-950 to-stone-900 rounded-3xl p-6 text-white shadow-md hover:shadow-xl transition-all group border border-sky-700/40 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="bg-sky-500/20 text-sky-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-sky-400/30 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-sky-400" /> 12 Sectoral Committees
                </span>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 leading-tight">
                Committee Sittings & Resolution Follow-Up
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Track how citizen resolutions are implemented. Interrogate CADP budgets, review executive summons, and submit ground verification reports.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-sky-800/60 flex items-center justify-between text-xs font-bold text-sky-300">
              <span>View Resolution Tracker</span>
              <span>→</span>
            </div>
          </Link>

          {/* 3. Clerk & Admin Portals */}
          <div
            className="bg-gradient-to-br from-stone-900 via-sky-950 to-stone-900 rounded-3xl p-6 text-white shadow-md hover:shadow-xl transition-all border border-stone-700/50 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Administrative Portals
                </span>
                <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 leading-tight">
                Clerk & Admin Portals
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed mb-4">
                Official management suites for Ward Assembly Clerks and Platform Administrators to record certified resolutions, manage community groups, and coordinate citizen petitions.
              </p>
            </div>
            <div className="pt-4 border-t border-stone-800 flex items-center justify-between gap-2">
              <Link
                to="/clerk"
                className="inline-flex items-center gap-1.5 bg-sky-700 hover:bg-sky-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
              >
                <span>Clerk Portal</span>
                <span>→</span>
              </Link>
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors border border-stone-700"
              >
                <span>Admin Portal</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Featured Campaign: National Citizen Assembly Official Digital Poster */}
        <section id="national-citizen-assembly" className="scroll-mt-24">
          <NationalAssemblyBanner />
        </section>

        {/* National Citizen Activities Announcements */}
        <section id="national-activities">
          <NationalActivitiesSection />
        </section>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2 Columns: Citizen Issues & Community Voices */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-sky-800 flex items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-sky-600" />
                    Priority Issues in Wards
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">Issues deliberated by mini-caucuses and community groups</p>
                </div>
                <div className="flex items-center gap-3">
                  <a 
                    href="#ward-resolutions" 
                    className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1"
                  >
                    <span>Ward Resolutions ↓</span>
                  </a>
                  <Link to="/register" className="text-xs font-bold text-sky-700 hover:underline">
                    + Submit Issue
                  </Link>
                </div>
              </div>

              {issues.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-500 text-sm">
                  No community issues posted yet. Be the first to register an issue in your ward!
                </div>
              ) : (
                <div className="space-y-4">
                  {issues.slice(0, 4).map((issue: any) => (
                    <div key={issue.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-md">
                          {issue.ward?.name || 'Local'} Ward
                        </span>
                        <span className="text-stone-400">
                          {issue.votes || 0} citizen endorsements
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900 mb-1">
                        {issue.title}
                      </h3>
                      <p className="text-xs text-stone-600 leading-relaxed mb-3">
                        {issue.description}
                      </p>
                      <div className="text-[11px] text-stone-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Submitted for Assembly Resolution
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Wards Directory & Universal Search */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-sky-800 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-sky-600" />
                    Electoral Wards
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Covering all 47 counties ({TOTAL_KENYA_WARDS} wards)
                  </p>
                </div>
                <Link
                  to="/register"
                  className="text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg border border-sky-200 transition-colors"
                >
                  + Join / Add Ward
                </Link>
              </div>

              {/* Universal Ward Finder Input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={wardSearchQuery}
                  onChange={(e) => setWardSearchQuery(e.target.value)}
                  placeholder="Search any ward or county in Kenya..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2 pl-10 pr-4 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-800"
                />
              </div>

              {/* Active Wards List */}
              <div className="space-y-3">
                {wards
                  .filter(w => !wardSearchQuery || w.name.toLowerCase().includes(wardSearchQuery.toLowerCase()))
                  .slice(0, 5)
                  .map(ward => (
                    <WardCard key={ward.id} ward={ward} />
                  ))}
              </div>

              {/* Search results from other Kenyan wards */}
              {wardSearchQuery.trim().length >= 2 && (
                (() => {
                  const matches = searchKenyaWards(wardSearchQuery, 5).filter(
                    (km) => !wards.some((w) => w.name.toLowerCase() === km.ward.toLowerCase())
                  );
                  if (matches.length === 0) return null;
                  return (
                    <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 space-y-2">
                      <div className="text-xs font-bold text-sky-950">
                        Available in Kenya Dataset:
                      </div>
                      <div className="space-y-1.5">
                        {matches.map((item, i) => {
                          const slug = item.ward.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                          return (
                            <Link
                              key={i}
                              to={`/ward/${slug}`}
                              className="w-full flex items-center justify-between p-2 bg-white hover:bg-sky-100/60 rounded-xl border border-sky-100 text-xs transition-colors"
                            >
                              <div>
                                <span className="font-bold text-stone-900">{item.ward} Ward</span>
                                <span className="text-[11px] text-stone-500 block">{item.county} County</span>
                              </div>
                              <span className="text-[11px] font-bold text-sky-600">Open Wall →</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

          </div>
        )}

        {/* Ward Citizen Assembly Resolutions Section (Official Resolutions posted by Clerks & Admins) */}
        <section id="ward-resolutions">
          <HomepageWardResolutions />
        </section>

        {/* Past Assemblies Proceedings & Follow-Up Archive */}
        <section id="past-assemblies-archive">
          <PastAssembliesSection />
        </section>

      </div>

      {/* View All Assemblies Modal (Quarterly Schedule Every 3 Months) */}
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
                  <h3 className="text-2xl font-bold text-sky-800">Quarterly Assembly Cycle (Every 3 Months)</h3>
                  <p className="text-stone-500 text-xs mt-1">Assemblies are held quarterly every 3 months on the 10th of the month.</p>
                </div>
                <button 
                  onClick={() => setIsViewAllModalOpen(false)}
                  className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto space-y-3">
                {allAssemblies.map((item) => (
                  <div 
                    key={item.id} 
                    className={`flex items-center p-4 rounded-2xl border transition-all ${
                      item.isNext 
                        ? 'border-sky-500 bg-sky-50/80 shadow-md ring-1 ring-sky-400' 
                        : item.isPast 
                          ? 'border-stone-200 bg-stone-50/70 opacity-60' 
                          : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0 mr-4 ${
                      item.isNext ? 'bg-sky-600 text-white' : item.isPast ? 'bg-stone-200 text-stone-600' : 'bg-sky-700 text-white'
                    }`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{item.date.toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-2xl font-black leading-none">{item.date.getDate()}</span>
                      <span className="text-[9px] opacity-80">{item.date.getFullYear()}</span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-stone-900">
                          {item.name}
                        </h4>
                        {item.isNext && (
                          <span className="bg-sky-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Next Assembly
                          </span>
                        )}
                        {item.isPast && (
                          <span className="bg-stone-200 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Concluded
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-600 mb-1">
                        <strong>Theme:</strong> {item.theme}
                      </p>
                      <p className="text-[11px] text-stone-400 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> 9:00 AM – 1:00 PM EAT • {item.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end">
                <button 
                  onClick={() => setIsViewAllModalOpen(false)}
                  className="bg-sky-600 text-white px-6 py-2.5 rounded-full font-bold text-xs hover:bg-sky-700 transition-colors"
                >
                  Close Schedule
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Update Mini-Caucus Modal */}
      <UpdateMiniCaucusModal
        isOpen={isMiniCaucusModalOpen}
        onClose={() => setIsMiniCaucusModalOpen(false)}
        initialCaucusId={miniCaucuses[activeCaucusIndex]?.id || 'caucus-sikhendu-sibembe'}
        onSaved={async (saved) => {
          const updated = await getMiniCaucuses();
          setMiniCaucuses(updated);
          const foundIdx = updated.findIndex(c => c.id === saved.id);
          if (foundIdx >= 0) setActiveCaucusIndex(foundIdx);
          setCurrentSlide(0); // Switch directly to Carousel 1 to view live update!
        }}
      />
    </motion.div>
  );
}
