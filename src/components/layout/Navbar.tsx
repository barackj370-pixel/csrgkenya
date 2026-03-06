import { Link, useNavigate } from 'react-router-dom';
import { Users, LayoutDashboard, LogIn, LogOut, ChevronDown, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import AuthModal from '../ui/AuthModal';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const [isAssembliesOpen, setIsAssembliesOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [wards, setWards] = useState<any[]>([]);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    async function fetchWards() {
      try {
        const res = await fetch('/api/wards');
        const data = await res.json();
        setWards(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch wards', error);
      }
    }
    fetchWards();
  }, []);

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-stone-900 to-green-600 flex items-center justify-center shadow-md overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>
                <Users className="w-6 h-6 text-white relative z-10" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-stone-900 leading-none">
                  CSRG Kenya
                </span>
                <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold mt-0.5">
                  Amplifying Citizen Voices
                </span>
              </div>
            </Link>
            
            <div className="hidden md:flex items-center gap-4">
              <Link to="/" className="text-stone-600 hover:text-stone-900 px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <div className="relative">
                <button 
                  onClick={() => setIsAssembliesOpen(!isAssembliesOpen)}
                  onBlur={() => setTimeout(() => setIsAssembliesOpen(false), 200)}
                  className="text-stone-600 hover:text-stone-900 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1"
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
                          onClick={() => navigate(`/ward/${ward.slug}`)}
                          className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-stone-900 flex items-center gap-2 transition-colors"
                        >
                          <MapPin className="w-3 h-3 text-stone-400" /> {ward.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <Link to="/about" className="text-stone-600 hover:text-stone-900 px-3 py-2 rounded-md text-sm font-medium">
                About Us
              </Link>
              <Link to="/contact" className="text-stone-600 hover:text-stone-900 px-3 py-2 rounded-md text-sm font-medium">
                Contact Us
              </Link>
              {user?.role === 'MOBILIZER' || user?.role === 'ADMIN' ? (
                <Link to="/mobilizer" className="text-stone-600 hover:text-stone-900 px-3 py-2 rounded-md text-sm font-medium">
                  Mobilizer Portal
                </Link>
              ) : null}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className="text-stone-600 hover:text-stone-900 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1">
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
                className="text-stone-600 hover:text-stone-900 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-stone-900 text-white hover:bg-stone-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
      
      {isAuthModalOpen && (
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      )}
    </nav>
  );
}
