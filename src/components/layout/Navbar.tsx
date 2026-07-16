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
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" onClick={closeMobileMenu} className="flex-shrink-0 flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md overflow-hidden">
                
                <Users className="w-6 h-6 text-sky-600 relative z-10" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-white leading-none">
                  CSRG Kenya
                </span>
                <span className="text-[10px] uppercase tracking-wider text-sky-100 font-bold mt-0.5">
                  Amplifying Citizen Voices
                </span>
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
                          className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-sky-800 flex items-center gap-2 transition-colors"
                        >
                          <MapPin className="w-3 h-3 text-stone-400" /> {ward.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <Link to="/about" className="text-sky-50 hover:text-white hover:bg-sky-700 px-3 py-2 rounded-md text-sm font-medium">
                About Us
              </Link>
              <Link to="/contact" className="text-sky-50 hover:text-white hover:bg-sky-700 px-3 py-2 rounded-md text-sm font-medium">
                Contact Us
              </Link>
              {(user?.role === 'CLERK' || user?.role === 'ADMIN') && (
                <Link to="/clerk" className="text-sky-50 hover:text-white hover:bg-sky-700 px-3 py-2 rounded-md text-sm font-medium">
                  Clerk Portal
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Desktop Auth/Admin Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="text-sky-50 hover:text-white hover:bg-sky-700 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1">
                  <LayoutDashboard className="w-4 h-4" />
                  Admin
                </Link>
              )}
              
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
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-white text-sky-600 hover:bg-sky-50 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
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
                </div>
              )}
            </div>

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

            {(user?.role === 'CLERK' || user?.role === 'ADMIN') && (
              <Link 
                to="/clerk" 
                onClick={closeMobileMenu}
                className="block px-3 py-3 rounded-md text-base font-medium text-stone-700 hover:text-sky-800 hover:bg-stone-50"
              >
                Clerk Portal
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link 
                to="/admin" 
                onClick={closeMobileMenu}
                className="block px-3 py-3 rounded-md text-base font-medium text-stone-700 hover:text-sky-800 hover:bg-stone-50"
              >
                Admin Dashboard
              </Link>
            )}

            <div className="pt-4 mt-2 border-t border-stone-200">
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
                <button 
                  onClick={() => {
                    setIsAuthModalOpen(true);
                    closeMobileMenu();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-sky-600 text-white px-3 py-3 rounded-md text-base font-medium hover:bg-sky-700"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In
                </button>
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
