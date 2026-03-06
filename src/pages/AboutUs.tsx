import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Shield, MapPin, Award, Megaphone, ShieldCheck, MessageSquare, Sprout } from 'lucide-react';

export default function AboutUs() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-stone-50 min-h-screen py-16"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-stone-900 mb-4">About CSRG Kenya</h1>
          <p className="text-xl text-stone-600 max-w-2xl mx-auto">
            Empowering citizens through structured assemblies to realize the promise of devolution and Article 1 of the Constitution of Kenya.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-stone-200 mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900">Who We Are</h2>
          </div>
          <p className="text-stone-600 leading-relaxed mb-6">
            The Civil Society Reference Group (CSRG) Kenya is a coalition of grassroots organizations, community leaders, and active citizens dedicated to enhancing public participation in governance. We believe that true democracy happens at the local level, where wananchi can directly influence the decisions that affect their daily lives.
          </p>
          <p className="text-stone-600 leading-relaxed">
            Our platform facilitates Ward Citizen Assemblies—structured, quarterly gatherings where residents, mobilizers, and elected leaders convene to discuss pressing issues, propose actionable solutions, and track the implementation of ward development funds and projects.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-4">Our Mission</h3>
            <p className="text-stone-600 leading-relaxed">
              To institutionalize citizen assemblies across all 47 counties in Kenya, providing a safe, inclusive, and effective platform for civic engagement, social accountability, and community-led development.
            </p>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200">
            <div className="w-12 h-12 bg-stone-100 text-stone-900 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-4">Our Vision</h3>
            <p className="text-stone-600 leading-relaxed">
              A Kenya where every citizen's voice is heard, where devolution delivers on its promises, and where local leadership is transparent, accountable, and responsive to the needs of the people.
            </p>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-stone-900 mb-8 text-center">Our Strategic Pillars</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-stone-900 mb-2">Leadership Development</h4>
                <p className="text-stone-600 text-sm leading-relaxed">Nurturing and equipping community leaders with the skills and knowledge needed to drive positive change and effectively represent their constituents.</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-stone-900 mb-2">Membership Development</h4>
                <p className="text-stone-600 text-sm leading-relaxed">Expanding and strengthening our network of active citizens, ensuring diverse representation and robust participation across all wards.</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-stone-900 mb-2">Policy Advocacy</h4>
                <p className="text-stone-600 text-sm leading-relaxed">Championing citizen-driven policies and advocating for systemic reforms that promote transparency, accountability, and equitable resource distribution.</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-start gap-4">
              <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-stone-900 mb-2">Mutual Protection & Self-Regulation</h4>
                <p className="text-stone-600 text-sm leading-relaxed">Fostering a culture of mutual support, ethical conduct, and self-regulation among civil society actors to maintain integrity and public trust.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-stone-900 mb-8 text-center">Strategic Enablers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-stone-900 text-white p-8 rounded-3xl shadow-sm flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-stone-800 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8 text-red-500" />
              </div>
              <h4 className="text-xl font-bold mb-4">Citizen Assemblies</h4>
              <p className="text-stone-400 leading-relaxed">
                Structured, inclusive forums where citizens deliberate on local issues, propose solutions, and hold leaders accountable. These assemblies are the core engine of our grassroots democracy model.
              </p>
            </div>
            <div className="bg-stone-900 text-white p-8 rounded-3xl shadow-sm flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-stone-800 rounded-2xl flex items-center justify-center mb-6">
                <Sprout className="w-8 h-8 text-green-500" />
              </div>
              <h4 className="text-xl font-bold mb-4">Food Cooperatives</h4>
              <p className="text-stone-400 leading-relaxed">
                Empowering communities economically through organized food cooperatives, ensuring food security, fair pricing, and sustainable livelihoods as a foundation for active civic participation.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-stone-900 text-white rounded-3xl p-8 md:p-12 text-center">
          <MapPin className="w-12 h-12 text-red-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Join the Movement</h2>
          <p className="text-stone-300 max-w-2xl mx-auto mb-8">
            Whether you are a community mobilizer, a local leader, or a concerned citizen, your participation is vital. Find your ward and join the next assembly.
          </p>
          <a href="/" className="inline-block bg-white text-stone-900 px-8 py-3 rounded-full font-bold hover:bg-stone-100 transition-colors">
            Find Your Ward
          </a>
        </div>
      </div>
    </motion.div>
  );
}
