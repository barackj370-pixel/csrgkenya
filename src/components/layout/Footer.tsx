import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-red-600 block"></span>
              Civil Society Reference Group (CSRG)
            </h3>
            <p className="text-sm text-stone-400">
              Empowering wananchi through structured, transparent, and actionable civic participation across 7 wards.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/mobilizer" className="hover:text-white transition-colors">Mobilizer Portal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/guidelines" className="hover:text-white transition-colors">Community Guidelines</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-stone-800 mt-12 pt-8 text-sm text-center text-stone-500 flex flex-col items-center">
          <p>&copy; {new Date().getFullYear()} Civil Society Reference Group. All rights reserved.</p>
          <div className="flex gap-2 mt-4">
            <div className="w-8 h-2 bg-black rounded-full"></div>
            <div className="w-8 h-2 bg-red-600 rounded-full"></div>
            <div className="w-8 h-2 bg-green-600 rounded-full"></div>
          </div>
        </div>
      </div>
    </footer>
  );
}
