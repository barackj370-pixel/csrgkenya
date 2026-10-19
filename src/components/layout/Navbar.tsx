import { Link, useNavigate } from 'react-router-dom';
import { Users, LayoutDashboard, LogIn, LogOut, ChevronDown, MapPin, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import AuthModal from '../ui/AuthModal';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function Navbar() {
  const [isAssembliesOpen, setIsAssembliesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileAssembliesOpen, setIsMobileAssembliesOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [wards, setWards] = useState<any[]>([]);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    async function fetchWards() {
      try {
        const { data, error } = await supabase.from('Ward').select('*');
        if (data) {
          setWards(data);
        }
      } catch (error) {
        console.warn('Failed to fetch wards', error);
      }
    }
    fetchWards();
  }, []);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileAssembliesOpen(false);
  };

  return (
    <nav className="bg-sky-600 border-b border-sky-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          <div className="flex items-center gap-8">
            <Link to="/" onClick={closeMobileMenu} className="flex-shrink-0 flex items-center gap-3">
              <div className="flex items-center justify-center bg-white px-3 py-2 md:px-5 md:py-3 rounded-xl shadow-md border border-sky-300">
                <img src="/logo.svg" alt="CSRG Kenya Logo" className="h-14 md:h-16 lg:h-20 w-auto object-contain" />
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/" className="text-sky-50 hover:text-white hover:bg-sky-700 px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <div className="relative">
                <button 
                  onClick={() => setIsAssembliesOpen(!isAssembliesOpen)}
                  onBlur={() => setTimeout(() => setIsAssembliesOpen(false), 200)}
                  className="text-sky-50 hover:text-white hover:bg-sky-700 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1"
                >
                  Citizen Assemblies <ChevronDown className={`w-4 h-4 transition-transform ${isAssembliesOpen ? 'rotate-180' : ''}`} />
                </button>
                {isAssembliesOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-stone-200 rounded-xl shadow-lg py-2 z-50 max-h-64 overflow-y-auto">
                    <div className="px-4 py-2 text-xs font-bold text-stone-400 uppercase tracking-wider">Select Ward</div>
                    {wards.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-stone-500">Loading...</div>
                    ) : (
                      wards.map(ward => (
                        <button
                          key={ward.id}
                          onClick={() => {
                            navigate(`/ward/${ward.slug}`);
                            setIsAssembliesOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-sky-800 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <MapPin className="w-3 h-3 text-stone-400" /> {ward.name}
                        </button>
                      ))
                    )}
                    <div className="pt-1.5 mt-1 border-t border-stone-100 px-2">
                      <button
                        onClick={() => {
                          navigate('/register');
                          setIsAssembliesOpen(false);
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>+ Join / Add Your Ward</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <Link to="/national-assembly" className="text-yellow-300 hover:text-white bg-sky-700/80 hover:bg-sky-750 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 border border-yellow-400/40 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                National Assembly
              </Link>
              <Link to="/independent-candidates" className="text-emerald-200 hover:text-white hover:bg-sky-700 px-3 py-2 rounded-md text-sm font-bold flex items-center gap-1">
                <span>Independent Candidates</span>
              </Link>
              <a href="/#ward-resolutions" className="text-sky-50 hover:text-white hover:bg-sky-700 px-3 py-2 rounded-md text-sm font-medium">
                Ward Resolutions
              </a>
              <Link to="/committee-sittings" className="text-sky-50 hover:text-white hover:bg-sky-700 px-3 py-2 rounded-md text-sm font-medium">
                Committees
              </Link>
              <Link to="/blog" className="text-sky-50 hover:text-white hover:bg-sky-700 px-3 py-2 rounded-md text-sm font-medium">
                Blog
              </Link>
              <Link to="/about" className="text-sky-50 hover:text-white hover:bg-sky-700 px-3 py-2 rounded-md text-sm font-medium">
                About Us
              </Link>
              <Link to="/contact" className="text-sky-50 hover:text-white hover:bg-sky-700 px-3 py-2 rounded-md text-sm font-medium">
                Contact
              </Link>
              {user?.role === 'CITIZEN' && user?.wardId && (
                <Link 
                  to={`/ward/${wards.find(w => w.id === user.wardId)?.slug || ''}`} 
                  className="text-white bg-sky-700/80 hover:bg-sky-800 px-3 py-2 rounded-md text-sm font-bold flex items-center gap-1.5 border border-sky-400/40"
                >
                  <MapPin className="w-4 h-4 text-sky-200" />
                  My Ward Wall
                </Link>
              )}
              {/* Portals - Always discoverable */}
              <div className="flex items-center gap-1 bg-sky-700/60 p-1 rounded-xl border border-sky-500/40">
                <Link 
                  to="/clerk" 
                  className="text-sky-100 hover:text-white hover:bg-sky-800 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <span>Clerk Portal</span>
                </Link>
                <Link 
                  to="/admin" 
                  className="text-sky-100 hover:text-white hover:bg-sky-800 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Desktop Auth/Admin Buttons */}
            <div className="hidden md:flex items-center gap-3">
              
              {user ? (
                <button 
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="text-sky-50 hover:text-white hover:bg-sky-700 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1"
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
                    className="bg-white text-sky-700 hover:bg-sky-50 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Users className="w-4 h-4" />
                    Join Assembly
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-white hover:bg-sky-700 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link 
              to="/" 
              onClick={closeMobileMenu}
              className="block px-3 py-3 rounded-md text-base font-medium text-stone-700 hover:text-sky-800 hover:bg-stone-50"
            >
              Home
            </Link>
            
            <div className="space-y-1">
              <button 
                onClick={() => setIsMobileAssembliesOpen(!isMobileAssembliesOpen)}
                className="w-full flex items-center justify-between px-3 py-3 rounded-md text-base font-medium text-stone-700 hover:text-sky-800 hover:bg-stone-50"
              >
                Citizen Assemblies
                <ChevronDown className={`w-4 h-4 transition-transform ${isMobileAssembliesOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isMobileAssembliesOpen && (
                <div className="pl-6 pr-3 py-2 space-y-1 bg-stone-50 rounded-md">
                  {wards.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-stone-500">Loading...</div>
                  ) : (
                    wards.map(ward => (
                      <button
                        key={ward.id}
                        onClick={() => {
                          navigate(`/ward/${ward.slug}`);
                          closeMobileMenu();
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-stone-600 hover:text-sky-800 flex items-center gap-2"
                      >
                        <MapPin className="w-3 h-3 text-stone-400" /> {ward.name}
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
              className="block px-3 py-3 rounded-xl text-base font-extrabold text-sky-950 bg-yellow-400/20 border border-yellow-500/30 flex items-center justify-between"
            >
              <span>National Citizen Assembly 2026</span>
              <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full uppercase">Summit</span>
            </Link>

            <Link 
              to="/independent-candidates" 
              onClick={closeMobileMenu}
              className="block px-3 py-3 rounded-xl text-base font-bold text-emerald-800 bg-emerald-50 border border-emerald-200"
            >
              Independent Candidates Portal
            </Link>

            <a 
              href="/#ward-resolutions" 
              onClick={closeMobileMenu}
              className="block px-3 py-3 rounded-md text-base font-medium text-stone-700 hover:text-sky-800 hover:bg-stone-50"
            >
              Ward Assembly Resolutions
            </a>

            <Link 
              to="/committee-sittings" 
              onClick={closeMobileMenu}
              className="block px-3 py-3 rounded-md text-base font-medium text-stone-700 hover:text-sky-800 hover:bg-stone-50"
            >
              12 Committee Sittings & Resolutions
            </Link>

            <Link 
              to="/blog" 
              onClick={closeMobileMenu}
              className="block px-3 py-3 rounded-md text-base font-medium text-stone-700 hover:text-sky-800 hover:bg-stone-50"
            >
              Blog
            </Link>

            <Link 
              to="/about" 
              onClick={closeMobileMenu}
              className="block px-3 py-3 rounded-md text-base font-medium text-stone-700 hover:text-sky-800 hover:bg-stone-50"
            >
              About Us
            </Link>
            
            <Link 
              to="/contact" 
              onClick={closeMobileMenu}
              className="block px-3 py-3 rounded-md text-base font-medium text-stone-700 hover:text-sky-800 hover:bg-stone-50"
            >
              Contact Us
            </Link>

            {user?.role === 'CITIZEN' && user?.wardId && (
              <Link 
                to={`/ward/${wards.find(w => w.id === user.wardId)?.slug || ''}`} 
                onClick={closeMobileMenu}
                className="block px-3 py-3 rounded-md text-base font-bold text-sky-800 bg-sky-50 border border-sky-200"
              >
                <MapPin className="w-4 h-4 inline mr-2 text-sky-600" />
                My Ward Wall
              </Link>
            )}

            <div className="pt-2 pb-2 border-t border-b border-stone-200 my-2 space-y-1">
              <div className="px-3 py-1 text-xs font-bold text-stone-400 uppercase tracking-wider">Staff & Admin Portals</div>
              <Link 
                to="/clerk" 
                onClick={closeMobileMenu}
                className="block px-3 py-2.5 rounded-xl text-base font-bold text-sky-800 bg-sky-50 border border-sky-100 flex items-center justify-between"
              >
                <span>Clerk Portal</span>
                <span className="text-xs bg-sky-200 text-sky-900 px-2 py-0.5 rounded-full font-semibold">Ward Assemblies</span>
              </Link>
              <Link 
                to="/admin" 
                onClick={closeMobileMenu}
                className="block px-3 py-2.5 rounded-xl text-base font-bold text-stone-800 bg-stone-100 border border-stone-200 flex items-center justify-between"
              >
                <span>Admin Dashboard</span>
                <span className="text-xs bg-stone-300 text-stone-900 px-2 py-0.5 rounded-full font-semibold">Platform</span>
              </Link>
            </div>

            <div className="pt-4 mt-2 border-t border-stone-200 space-y-2">
              {user ? (
                <button 
                  onClick={() => {
                    logout();
                    navigate('/');
                    closeMobileMenu();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-md text-base font-medium text-stone-600 hover:text-sky-800 hover:bg-stone-50"
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
