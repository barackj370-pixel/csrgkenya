import React from 'react';
import { motion } from 'framer-motion';
import NationalAssemblyBanner from '../components/ui/NationalAssemblyBanner';
import NationalActivitiesSection from '../components/ui/NationalActivitiesSection';
import PastAssembliesSection from '../components/ui/PastAssembliesSection';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, ShieldCheck, MapPin, Building2, Vote } from 'lucide-react';

export default function NationalAssemblyPage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-stone-100 py-10 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm font-bold text-sky-800 hover:text-sky-950 transition-colors bg-white px-4 py-2 rounded-xl border border-stone-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/committee-sittings"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-800 bg-white hover:bg-stone-50 px-4 py-2.5 rounded-xl border border-stone-200 shadow-sm transition-colors"
            >
              <Building2 className="w-4 h-4 text-sky-600" />
              12 Committee Sittings
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl shadow-md transition-colors"
            >
              <Users className="w-4 h-4" />
              Register to Participate in Your Ward
            </Link>
          </div>
        </div>

        {/* The Digital Poster */}
        <section id="banner">
          <NationalAssemblyBanner />
        </section>

        {/* National Citizen Activities Announcements */}
        <section id="activities">
          <NationalActivitiesSection />
        </section>

        {/* Past Assembly Archives & Follow-Up */}
        <section id="past-assemblies">
          <PastAssembliesSection />
        </section>
      </div>
    </motion.div>
  );
}
