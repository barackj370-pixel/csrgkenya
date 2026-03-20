import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Calendar, Users, ArrowRight, AlertCircle, Clock, ChevronDown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WardCard from '../components/ui/WardCard';
import KenyaMap from '../components/ui/KenyaMap';

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
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();

  const assemblies = [
    { date: new Date(2026, 3, 30), name: "Citizen Assembly" },
    { date: new Date(2026, 5, 26), name: "Citizen Assembly" },
    { date: new Date(2026, 6, 30), name: "Citizen Assembly" },
    { date: new Date(2026, 8, 24), name: "Citizen Assembly" },
    { date: new Date(2026, 9, 29), name: "Citizen Assembly" },
    { date: new Date(2026, 10, 26), name: "Citizen Assembly" }
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
          fetch('/api/wards'),
          fetch('/api/issues'),
          fetch('/api/discussions')
        ]);
        const wardsData = await wardsRes.json();
        const issuesData = await issuesRes.json();
        const discussionsData = await discussionsRes.json();
        
        setWards(Array.isArray(wardsData) ? wardsData : []);
        setIssues(Array.isArray(issuesData) ? issuesData : []);
        
        const past = Array.isArray(discussionsData) 
          ? discussionsData.filter((d: any) => d.status === 'CLOSED') 
          : [];
        setPastAssemblies(past);
      } catch (error) {
        console.error('Failed to fetch data', error);
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
      <section className="relative bg-stone-900 text-white overflow-hidden py-12 sm:py-16 min-h-[400px] flex items-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-stone-900 to-green-900 opacity-90"></div>
          {/* Subtle Kenya Flag Colors Overlay */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-black via-red-600 to-green-600"></div>
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
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-green-500">
                      Reference Group
                    </span>
                  </h1>
                  <p className="mt-2 text-lg text-stone-300 max-w-xl mb-6">
                    Join structured citizen assemblies in your Ward. Discuss pressing issues, propose solutions, and track resolutions that impact wananchi. Assemblies are held every two months on the last Saturday of the month.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Removed Find Your Ward button */}
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
                  <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full text-xs font-bold mb-4 border border-red-500/30">
                    <Calendar className="w-3.5 h-3.5" /> Next: {nextAssemblyName}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                    {nextAssemblyDate.toLocaleDateString('en-US', { weekday: 'long' })},<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-green-500">
                      {nextAssemblyDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, {nextAssemblyDate.getFullYear()}
                    </span>
                  </h1>
                  <p className="mt-2 text-lg text-stone-300 max-w-xl mb-6">
                    Join the structured citizen assemblies happening simultaneously across all 7 wards. 
                    Head to your respective ward center to discuss pressing issues, propose solutions, and track resolutions.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Removed Find Your Ward button */}
                  </div>
                </div>
                
                <div className="hidden lg:flex justify-center items-center">
                  <div className="relative w-full max-w-[280px] aspect-square rounded-full border-4 border-stone-800 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm shadow-2xl">
                    <div className="absolute inset-0 rounded-full border border-stone-700 m-3"></div>
                    <div className="absolute inset-0 rounded-full border border-stone-700 m-6"></div>
                    <div className="text-center">
                      <Calendar className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-80" />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left Column: Discussions & Issues */}
            <div className="lg:col-span-2 space-y-12">
              
              {/* Upcoming Assemblies */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-red-600" />
                    Upcoming Assemblies
                  </h2>
                  <button 
                    onClick={() => setIsViewAllModalOpen(true)}
                    className="text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-stone-500">Official, scheduled gatherings where citizens and leaders meet to discuss ward matters.</p>
                
                <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 left-0 w-2 h-full bg-red-600"></div>
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-4 mb-3">
                        <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                          <Calendar className="w-4 h-4" /> {formatDate(nextAssemblyDate)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-700 px-3 py-1 rounded-full text-sm font-medium">
                          <Clock className="w-4 h-4" /> 9:00 AM - 1:00 PM
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-stone-900 mb-2">Citizen Assembly (All Wards)</h3>
                      <p className="text-stone-600 max-w-2xl">
                        Join the structured citizen assemblies happening simultaneously across all 7 wards. 
                        Head to your respective ward center to discuss pressing issues, propose solutions, and track resolutions.
                      </p>
                    </div>
                    <div className="flex-shrink-0 w-full md:w-auto relative">
                      {/* Removed Find Your Ward button */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Proposed Issues */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-stone-900" />
                    Proposed Issues for Next Assembly
                  </h2>
                </div>
                <p className="text-stone-500">Topics and concerns submitted by mobilizers to be added to the official assembly agenda.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {issues.slice(0, 4).map((issue: any) => (
                    <div key={issue.id} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      {/* Decorative accent line */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-stone-900"></div>
                      
                      <div className="flex items-start justify-between mb-3 mt-2">
                        <span className="inline-flex items-center gap-1 bg-stone-100 px-2 py-1 rounded-md text-xs font-medium text-stone-600">
                          <MapPin className="w-3 h-3" /> {issue.ward?.name}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-stone-900 mb-2">{issue.title}</h3>
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
                  <h2 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-green-600" />
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
                              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                                <MapPin className="w-3 h-3" /> {assembly.ward?.name}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-stone-900">{assembly.title}</h3>
                          </div>
                          <button 
                            onClick={() => navigate(`/discussion/${assembly.id}`)}
                            className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1 text-sm whitespace-nowrap"
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

            {/* Right Column: Wards */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-green-600" />
                  Active Wards
                </h2>
              </div>
              
              <div className="space-y-4">
                {wards.map((ward: any) => (
                  <WardCard key={ward.id} ward={ward} />
                ))}
                {wards.length === 0 && (
                  <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-stone-500">
                    No active wards found.
                  </div>
                )}
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
                  <h3 className="text-2xl font-bold text-stone-900">Assembly Schedule {currentYear}</h3>
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
                            ? 'border-red-500 bg-red-50 shadow-md' 
                            : isPast 
                              ? 'border-stone-200 bg-stone-50 opacity-60' 
                              : 'border-stone-200 bg-white hover:border-stone-300'
                        } transition-all`}
                      >
                        <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0 mr-6 ${
                          isNext ? 'bg-red-600 text-white' : isPast ? 'bg-stone-200 text-stone-500' : 'bg-stone-900 text-white'
                        }`}>
                          <span className="text-xs font-bold uppercase tracking-wider">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                          <span className="text-2xl font-black leading-none">{date.getDate()}</span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`text-lg font-bold ${isNext ? 'text-red-900' : isPast ? 'text-stone-600' : 'text-stone-900'}`}>
                              {assembly.name}
                            </h4>
                            {isNext && (
                              <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Next
                              </span>
                            )}
                            {isPast && (
                              <span className="bg-stone-200 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Completed
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${isNext ? 'text-red-700' : 'text-stone-500'} flex items-center gap-1.5`}>
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
                  className="bg-stone-900 text-white px-6 py-2.5 rounded-full font-medium hover:bg-stone-800 transition-colors"
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
