import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('MOBILIZER');
  const [wardId, setWardId] = useState('');
  const [wards, setWards] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  React.useEffect(() => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, wardId: role === 'MOBILIZER' ? wardId : '' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      login(data.token, data.user);
      
      if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else if (data.user.role === 'MOBILIZER') {
        navigate('/mobilizer');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-[80vh] flex items-center justify-center bg-stone-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-stone-900">Create Account</h2>
          <p className="text-stone-500 mt-2">Join as a Mobilizer or Admin</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                if (e.target.value !== 'MOBILIZER') setWardId('');
              }}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
            >
              <option value="MOBILIZER">Mobilizer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {role === 'MOBILIZER' && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Assigned Ward</label>
              <select
                required
                value={wardId}
                onChange={(e) => setWardId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              >
                <option value="">Select Ward...</option>
                {wards.map((ward: any) => (
                  <option key={ward.id} value={ward.id}>{ward.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 text-white rounded-xl py-3 font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-stone-500">
          Already have an account?{' '}
          <Link to="/login" className="text-stone-900 font-medium hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
