import React from 'react';
import { motion } from 'framer-motion';
import NationalAssemblyBanner from '../components/ui/NationalAssemblyBanner';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, ShieldCheck, MapPin } from 'lucide-react';

export default function NationalAssemblyPage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-stone-100 py-10 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm font-bold text-sky-800 hover:text-sky-950 transition-colors bg-white px-4 py-2 rounded-xl border border-stone-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-sm font-bold bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl shadow-md transition-colors"
          >
            <Users className="w-4 h-4" />
            Register to Participate in Your Ward
          </Link>
        </div>

        {/* The Digital Poster */}
        <NationalAssemblyBanner />
      </div>
    </motion.div>
  );
}
