import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  LayoutDashboard, 
  LogIn, 
  LogOut, 
  ChevronDown, 
  MapPin, 
  Menu, 
  X, 
  FileText, 
  Search, 
  Radio, 
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import AuthModal from '../ui/AuthModal';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function Navbar() {
  const [isAssembliesOpen, setIsAssembliesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileAssembliesOpen, setIsMobileAssembliesOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [wards, setWards] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const fetchWardsAndGroups = async () => {
    try {
      const [wardsRes, groupsRes] = await Promise.all([
        supabase.from('Ward').select('*'),
        supabase.from('Group').select('*')
      ]);
      if (wardsRes.data) {
        setWards(wardsRes.data);
      }
      if (groupsRes.data) {
        setGroups(groupsRes.data);
      }
    } catch (error) {
      console.warn('Failed to fetch wards and groups', error);
    }
  };

  useEffect(() => {
    fetchWardsAndGroups();

    // Listen for real-time updates when clerk or admin creates or modifies groups
    const handleUpdate = () => {
      fetchWardsAndGroups();
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('csrg_group_created', handleUpdate);
    window.addEventListener('csrg_group_issue_updated', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('csrg_group_created', handleUpdate);
      window.removeEventListener('csrg_group_issue_updated', handleUpdate);
    };
  }, []);

  // Handle outside clicks to close desktop dropdown smoothly
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAssembliesOpen(false);
      }
    }
    if (isAssembliesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAssembliesOpen]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileAssembliesOpen(false);
  };

  // Filter wards based on user search term
  const term = searchTerm.trim().toLowerCase();
  const filteredWards = wards.filter(ward => {
    if (!term) return true;
    return (ward.name && ward.name.toLowerCase().includes(term)) ||
           (ward.county && ward.county.toLowerCase().includes(term));
  });

  return (
    <nav className="bg-sky-600 border-b border-sky-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          <div className="flex items-center gap-6 lg:gap-8">
            <Link to="/" onClick={closeMobileMenu} className="flex-shrink-0 flex items-center gap-3">
              <div className="flex items-center justify-center bg-white px-3 py-2 md:px-5 md:py-3 rounded-xl shadow-md border border-sky-300">
                <img src="/logo.svg" alt="CSRG Kenya Logo" className="h-14 md:h-16 lg:h-20 w-auto object-contain" />
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-wrap">
              <Link to="/" className="text-sky-50 hover:text-white hover:bg-sky-700 px-2.5 py-2 rounded-md text-sm font-medium">
                Home
              </Link>

              {/* Citizen Assemblies (Wards & Registered Groups / Caucuses) Dropdown Menu */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsAssembliesOpen(!isAssembliesOpen)}
                  className={`text-sky-50 hover:text-white hover:bg-sky-700 px-3 py-2 rounded-md text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isAssembliesOpen ? 'bg-sky-700 text-white shadow-inner' : ''
                  }`}
                  aria-expanded={isAssembliesOpen}
                >
                  <MapPin className="w-4 h-4 text-yellow-300" />
                  <span>Citizen Assemblies</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAssembliesOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAssembliesOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-white border border-stone-200 rounded-2xl shadow-2xl py-3 z-50 max-h-[32rem] overflow-hidden flex flex-col text-stone-800 animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* Header */}
                    <div className="px-4 pb-2.5 border-b border-stone-100">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                          <span>Citizen Assemblies: Registered Wards</span>
                        </div>
                        <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                          {wards.length} Wards
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Click any ward to visit its Ward Wall (Clerks & Admins can add groups & resolutions)
                      </p>

                      {/* Quick Filter */}
                      <div className="mt-2.5 relative">
                        <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Filter ward or county (e.g. Sikhendu, Trans Nzoia)..."
                          className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3 py-1.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    {/* Ward List (Only wards in the dropdown list) */}
                    <div className="overflow-y-auto flex-1 divide-y divide-stone-100 px-2 py-1">
                      {filteredWards.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-stone-500">
                          No matching wards found.
                        </div>
                      ) : (
                        filteredWards.map(ward => (
                          <button
                            key={ward.id}
                            type="button"
                            onClick={() => {
                              navigate(`/ward/${ward.slug}`);
                              setIsAssembliesOpen(false);
                            }}
                            className="w-full py-2.5 px-3 flex items-center justify-between hover:bg-sky-50/80 rounded-xl transition-colors text-left group cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                                <MapPin className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <div className="font-bold text-sm text-stone-900 group-hover:text-sky-900 truncate">
                                  {ward.name} Ward
                                </div>
                                <div className="text-[11px] text-stone-500 truncate">
                                  {ward.county || 'County'} County
                                </div>
                              </div>
                            </div>

                            <span className="text-[11px] font-bold text-sky-700 bg-sky-50 group-hover:bg-sky-600 group-hover:text-white px-2.5 py-1 rounded-lg transition-colors shrink-0">
                              Ward Wall →
                            </span>
                          </button>
                        ))
                      )}
                    </div>

                    {/* Bottom Links */}
                    <div className="pt-2 mt-1 border-t border-stone-100 px-3 py-1 bg-stone-50 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          navigate('/register');
                          setIsAssembliesOpen(false);
                        }}
                        className="text-[11px] font-bold text-sky-700 hover:text-sky-900 py-1 flex items-center gap-1 cursor-pointer"
                      >
                        <span>+ Join/Add Ward</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigate('/clerk');
                            setIsAssembliesOpen(false);
                          }}
                          className="text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer"
                          title="Clerk Portal"
                        >
                          <FileText className="w-3 h-3 text-amber-700" />
                          <span>Clerk Portal</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigate('/admin');
                            setIsAssembliesOpen(false);
                          }}
                          className="text-[11px] font-bold text-stone-700 hover:text-stone-900 bg-stone-200 hover:bg-stone-300 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer"
                          title="Admin Dashboard"
                        >
                          <LayoutDashboard className="w-3 h-3 text-stone-700" />
                          <span>Admin</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link to="/national-assembly" className="text-yellow-300 hover:text-white bg-sky-700/80 hover:bg-sky-750 px-2.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 border border-yellow-400/40 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                National Assembly
              </Link>

              <Link to="/independent-candidates" className="text-emerald-200 hover:text-white hover:bg-sky-700 px-2.5 py-2 rounded-md text-sm font-bold flex items-center gap-1">
                <span>Independent Candidates</span>
              </Link>

              <a href="/#mini-caucus-schedule" className="text-yellow-200 hover:text-white hover:bg-sky-700 px-2.5 py-2 rounded-md text-sm font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-yellow-300" />
                <span>Mini-Caucuses</span>
              </a>

              <a href="/#ward-resolutions" className="text-sky-50 hover:text-white hover:bg-sky-700 px-2.5 py-2 rounded-md text-sm font-medium">
                Resolutions
              </a>

              <Link to="/committee-sittings" className="text-sky-50 hover:text-white hover:bg-sky-700 px-2.5 py-2 rounded-md text-sm font-medium">
                Committees
              </Link>

              <Link to="/blog" className="text-sky-50 hover:text-white hover:bg-sky-700 px-2 py-2 rounded-md text-sm font-medium">
                Blog
              </Link>

              {user?.role === 'CITIZEN' && user?.wardId && (
                <Link 
                  to={`/ward/${wards.find(w => w.id === user.wardId)?.slug || ''}`} 
                  className="text-white bg-sky-700/90 hover:bg-sky-800 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border border-sky-400/40"
                >
                  <MapPin className="w-3.5 h-3.5 text-sky-200" />
                  My Ward Wall
                </Link>
              )}

              {/* Staff & Admin Portals in Menu - Prominently Displayed */}
              <div className="flex items-center gap-1.5 ml-1">
                <Link 
                  to="/clerk" 
                  className="text-amber-200 hover:text-white bg-sky-800/80 hover:bg-sky-900 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-amber-400/40 shadow-xs"
                  title="Clerk Portal: Manage Ward Assemblies & Caucuses"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-300" />
                  <span>Clerk Portal</span>
                </Link>
                <Link 
                  to="/admin" 
                  className="text-sky-100 hover:text-white bg-sky-800/80 hover:bg-sky-900 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-sky-400/40 shadow-xs"
                  title="Admin Dashboard"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-sky-300" />
                  <span>Admin</span>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Desktop Auth/Admin Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <button 
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="text-sky-50 hover:text-white hover:bg-sky-700 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Link 
                    to="/login"
                    className="text-sky-50 hover:text-white hover:bg-sky-700 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                  <Link 
                    to="/register"
                    className="bg-white text-sky-700 hover:bg-sky-50 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Join Assembly
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-white hover:bg-sky-700 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white">
          <div className="px-4 pt-2 pb-6 space-y-1 text-stone-800">
            <Link 
              to="/" 
              onClick={closeMobileMenu}
              className="block px-3 py-2.5 rounded-md text-base font-medium text-stone-700 hover:text-sky-800 hover:bg-stone-50"
            >
              Home
            </Link>
            
            {/* Mobile Wards & Caucuses Dropdown */}
            <div className="space-y-1">
              <button 
                onClick={() => setIsMobileAssembliesOpen(!isMobileAssembliesOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-base font-bold text-stone-800 hover:text-sky-800 hover:bg-stone-50 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  Citizen Assemblies (Wards)
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isMobileAssembliesOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isMobileAssembliesOpen && (
                <div className="pl-2 pr-2 py-2 space-y-1.5 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="px-2 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Select a Ward to Open its Ward Wall
                  </div>
                  {wards.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-stone-500">Loading wards...</div>
                  ) : (
                    wards.map(ward => (
                      <button
                        key={ward.id}
                        onClick={() => {
                          navigate(`/ward/${ward.slug}`);
                          closeMobileMenu();
                        }}
                        className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-sky-50 border border-stone-200/80 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                          <div>
                            <div className="text-sm font-bold text-stone-900">{ward.name} Ward</div>
                            <div className="text-[11px] text-stone-500">{ward.county || 'County'} County</div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded-md">
                          Ward Wall →
                        </span>
                      </button>
                    ))
                  )}
                  <div className="pt-2 mt-1 border-t border-stone-200">
                    <button
                      onClick={() => {
                        navigate('/register');
                        closeMobileMenu();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50 rounded flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>+ Join / Add Your Ward (All 47 Counties)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Link 
              to="/national-assembly" 
              onClick={closeMobileMenu}
              className="block px-3 py-2.5 rounded-xl text-base font-extrabold text-sky-950 bg-yellow-400/20 border border-yellow-500/30 flex items-center justify-between"
            >
              <span>National Citizen Assembly 2026</span>
              <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full uppercase">Summit</span>
            </Link>

            <Link 
              to="/independent-candidates" 
              onClick={closeMobileMenu}
              className="block px-3 py-2.5 rounded-xl text-base font-bold text-emerald-800 bg-emerald-50 border border-emerald-200"
            >
              Independent Candidates Portal
            </Link>

            <a 
              href="/#mini-caucus-schedule" 
              onClick={closeMobileMenu}
              className="block px-3 py-2.5 rounded-md text-base font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200"
            >
              <Calendar className="w-4 h-4 inline mr-2 text-amber-600" />
              National Mini-Caucus Schedule (10 Dates)
            </a>

            <a 
              href="/#ward-resolutions" 
              onClick={closeMobileMenu}
              className="block px-3 py-2.5 rounded-md text-base font-medium text-stone-700 hover:text-sky-800 hover:bg-stone-50"
            >
              Ward Assembly Resolutions
            </a>

            <Link 
              to="/committee-sittings" 
              onClick={closeMobileMenu}
              className="block px-3 py-2.5 rounded-md text-base font-medium text-stone-700 hover:text-sky-800 hover:bg-stone-50"
            >
              12 Committee Sittings & Resolutions
            </Link>

            <Link 
              to="/blog" 
              onClick={closeMobileMenu}
              className="block px-3 py-2.5 rounded-md text-base font-medium text-stone-700 hover:text-sky-800 hover:bg-stone-50"
            >
              Blog
            </Link>

            <Link 
              to="/about" 
              onClick={closeMobileMenu}
              className="block px-3 py-2.5 rounded-md text-base font-medium text-stone-700 hover:text-sky-800 hover:bg-stone-50"
            >
              About Us
            </Link>
            
            <Link 
              to="/contact" 
              onClick={closeMobileMenu}
              className="block px-3 py-2.5 rounded-md text-base font-medium text-stone-700 hover:text-sky-800 hover:bg-stone-50"
            >
              Contact Us
            </Link>

            {user?.role === 'CITIZEN' && user?.wardId && (
              <Link 
                to={`/ward/${wards.find(w => w.id === user.wardId)?.slug || ''}`} 
                onClick={closeMobileMenu}
                className="block px-3 py-2.5 rounded-md text-base font-bold text-sky-800 bg-sky-50 border border-sky-200"
              >
                <MapPin className="w-4 h-4 inline mr-2 text-sky-600" />
                My Ward Wall
              </Link>
            )}

            {/* Clerk & Admin Portals in Mobile Menu */}
            <div className="pt-3 pb-2 border-t border-b border-stone-200 my-2 space-y-2">
              <div className="px-3 text-xs font-black text-stone-500 uppercase tracking-wider">
                Staff & Administration Portals
              </div>
              <Link 
                to="/clerk" 
                onClick={closeMobileMenu}
                className="block px-3.5 py-3 rounded-xl text-base font-bold text-sky-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <span>Clerk Portal</span>
                </span>
                <span className="text-xs bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full font-bold">
                  Ward Assemblies
                </span>
              </Link>
              <Link 
                to="/admin" 
                onClick={closeMobileMenu}
                className="block px-3.5 py-3 rounded-xl text-base font-bold text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-300 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-stone-700" />
                  <span>Admin Portal</span>
                </span>
                <span className="text-xs bg-stone-300 text-stone-900 px-2.5 py-1 rounded-full font-bold">
                  Platform
                </span>
              </Link>
            </div>

            <div className="pt-3 mt-2 space-y-2">
              {user ? (
                <button 
                  onClick={() => {
                    logout();
                    navigate('/');
                    closeMobileMenu();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-md text-base font-medium text-stone-600 hover:text-sky-800 hover:bg-stone-50 cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              ) : (
                <>
                  <Link 
                    to="/register"
                    onClick={closeMobileMenu}
                    className="w-full flex items-center justify-center gap-2 bg-sky-600 text-white px-3 py-3 rounded-xl text-base font-bold hover:bg-sky-700 shadow-sm"
                  >
                    <Users className="w-5 h-5" />
                    Join Ward Assembly
                  </Link>
                  <Link 
                    to="/login"
                    onClick={closeMobileMenu}
                    className="w-full flex items-center justify-center gap-2 bg-stone-100 text-stone-800 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-stone-200"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {isAuthModalOpen && (
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      )}
    </nav>
  );
}
