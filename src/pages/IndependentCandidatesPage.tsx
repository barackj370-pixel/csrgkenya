import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  MapPin, 
  CheckCircle2, 
  Search, 
  Filter, 
  UserPlus, 
  FileText, 
  Mail, 
  Phone, 
  ExternalLink,
  Vote,
  Sparkles,
  Award,
  Users
} from 'lucide-react';
import { getIndependentCandidates, saveIndependentCandidate, IndependentCandidate } from '../lib/civicData';
import { KENYA_COUNTIES } from '../data/kenyaCountiesAndWards';

export default function IndependentCandidatesPage() {
  const [candidates, setCandidates] = useState<IndependentCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeat, setSelectedSeat] = useState('All');
  const [selectedCounty, setSelectedCounty] = useState('All');
  const [isNominationModalOpen, setIsNominationModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<IndependentCandidate | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSeat, setFormSeat] = useState<IndependentCandidate['seat']>('MCA (Member of County Assembly)');
  const [formCounty, setFormCounty] = useState('Nairobi');
  const [formWard, setFormWard] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formPriorities, setFormPriorities] = useState('');
  const [formEndorsements, setFormEndorsements] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPledgeSigned, setFormPledgeSigned] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getIndependentCandidates();
      setCandidates(data);
      setLoading(false);
    }
    load();
  }, []);

  const seats = [
    'All',
    'MCA (Member of County Assembly)',
    'Member of Parliament (MP)',
    'County Governor',
    'Senator',
    'Woman Representative'
  ];

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.wardOrConstituency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.county.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeat = selectedSeat === 'All' || c.seat === selectedSeat;
    const matchesCounty = selectedCounty === 'All' || c.county.toLowerCase() === selectedCounty.toLowerCase();
    return matchesSearch && matchesSeat && matchesCounty;
  });

  const handleNominationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPledgeSigned) {
      alert('You must sign and accept the Non-Partisan Citizen Assembly Integrity Pledge to list your candidacy.');
      return;
    }

    setFormSubmitting(true);
    try {
      const prioritiesList = formPriorities
        .split('\n')
        .map(p => p.trim())
        .filter(Boolean);

      const endorsementsList = formEndorsements
        .split('\n')
        .map(e => e.trim())
        .filter(Boolean);

      const newCand = await saveIndependentCandidate({
        name: formName.trim(),
        seat: formSeat,
        county: formCounty,
        wardOrConstituency: formWard.trim(),
        photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
        bio: formBio.trim(),
        priorities: prioritiesList.length > 0 ? prioritiesList : ['Transparent Ward Development Funds', 'Adoption of Citizen Assembly Resolutions'],
        integrityPledgeSigned: true,
        pledgeDate: new Date().toISOString().split('T')[0],
        communityEndorsements: endorsementsList.length > 0 ? endorsementsList : ['Local Ward Mini-Caucus Endorsement'],
        contactEmail: formEmail.trim() || undefined,
        contactPhone: formPhone.trim() || undefined
      });

      setCandidates(prev => [newCand, ...prev]);
      setFormSuccess(true);
      setTimeout(() => {
        setFormSuccess(false);
        setIsNominationModalOpen(false);
        // Reset form
        setFormName('');
        setFormWard('');
        setFormBio('');
        setFormPriorities('');
        setFormEndorsements('');
        setFormEmail('');
        setFormPhone('');
        setFormPledgeSigned(false);
      }, 2000);
    } catch (err) {
      alert('Failed to submit candidacy.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-emerald-900 via-sky-950 to-stone-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold mb-4 border border-emerald-400/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Non-Partisan Citizen Vetting Portal
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
              Independent Candidates & Grassroots Leaders Portal
            </h1>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-6">
              A transparent, non-partisan vetting registry for independent community champions running for MCA, MP, and county leadership. Candidates featured here have signed the binding <strong>Citizen Assembly Integrity Pledge</strong>, committing to sponsor ward resolutions and submit to quarterly public recall audits.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setIsNominationModalOpen(true)}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-md cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Submit Independent Candidacy for Vetting
              </button>
              <div className="text-xs text-stone-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free from political party cartels
              </div>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
            <Vote className="w-96 h-96 text-white" />
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Seat Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {seats.map(seat => (
              <button
                key={seat}
                onClick={() => setSelectedSeat(seat)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  selectedSeat === seat 
                    ? 'bg-emerald-800 text-white shadow-sm' 
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {seat === 'All' ? 'All Seats' : seat.split('(')[0].trim()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* County Select */}
            <select
              value={selectedCounty}
              onChange={(e) => setSelectedCounty(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl py-2 px-3 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none text-stone-800 font-medium"
            >
              <option value="All">All 47 Counties</option>
              {KENYA_COUNTIES.map(c => (
                <option key={c.name} value={c.name}>{c.name} County</option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate, ward, county..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2 pl-10 pr-4 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none text-stone-800"
              />
            </div>
          </div>
        </div>

        {/* Candidates Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-stone-400 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-stone-900">No Candidates Found</h3>
            <p className="text-stone-500 text-xs max-w-sm mx-auto">
              No vetted independent candidates match your selected criteria. Are you an independent grassroots leader? Apply to be vetted.
            </p>
            <button
              onClick={() => setIsNominationModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-4 py-2 rounded-xl"
            >
              <UserPlus className="w-3.5 h-3.5" /> Submit Candidacy Application
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map(cand => (
              <div
                key={cand.id}
                onClick={() => setSelectedCandidate(cand)}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="p-6 border-b border-stone-100 flex items-start gap-4">
                    <img 
                      src={cand.photoUrl} 
                      alt={cand.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-stone-100 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 mb-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Signed Integrity Pledge</span>
                      </div>
                      <h3 className="text-lg font-black text-stone-900 group-hover:text-emerald-800 transition-colors">
                        {cand.name}
                      </h3>
                      <div className="text-xs font-semibold text-stone-500">
                        {cand.seat}
                      </div>
                      <div className="text-xs text-stone-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {cand.wardOrConstituency}, {cand.county} County
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                      {cand.bio}
                    </p>

                    <div>
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                        Key Citizen Commitments:
                      </div>
                      <ul className="space-y-1.5">
                        {cand.priorities.slice(0, 2).map((pri, idx) => (
                          <li key={idx} className="text-xs text-stone-700 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                            <span className="line-clamp-2">{pri}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {cand.communityEndorsements && cand.communityEndorsements.length > 0 && (
                      <div className="pt-3 border-t border-stone-100">
                        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                          Grassroots Endorsements:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {cand.communityEndorsements.slice(0, 2).map((end, idx) => (
                            <span key={idx} className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                              {end}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 pb-5 pt-3 border-t border-stone-100 bg-stone-50/60 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 group-hover:underline">
                    View Full Citizen Contract & Contact
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Candidate Detail Modal */}
        <AnimatePresence>
          {selectedCandidate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200"
              >
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <img 
                        src={selectedCandidate.photoUrl} 
                        alt={selectedCandidate.name} 
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-100"
                      />
                      <div>
                        <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Vetted Independent Champion
                        </div>
                        <h2 className="text-2xl font-black text-stone-900">{selectedCandidate.name}</h2>
                        <p className="text-sm font-bold text-emerald-700">{selectedCandidate.seat}</p>
                        <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {selectedCandidate.wardOrConstituency}, {selectedCandidate.county} County
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedCandidate(null)}
                      className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 mb-1">
                      <Award className="w-4 h-4 text-emerald-600" />
                      Binding Citizen Assembly Integrity Pledge
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      "I solemnly pledge to table, vote for, and implement all resolutions adopted by the Citizen Assemblies of {selectedCandidate.wardOrConstituency}. I will publish full records of all public fund allocations and submit to bi-annual public town hall reviews."
                    </p>
                    <div className="mt-2 text-[10px] text-emerald-700 font-bold">
                      Signed & Ratified on {selectedCandidate.pledgeDate}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                      Candidate Background & Civic Vision
                    </h4>
                    <p className="text-sm text-stone-700 leading-relaxed">
                      {selectedCandidate.bio}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                      Priority Legislative & Ward Commitments
                    </h4>
                    <div className="space-y-2">
                      {selectedCandidate.priorities.map((pri, idx) => (
                        <div key={idx} className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-800 flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                            {idx + 1}
                          </span>
                          <span>{pri}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                      Grassroots Groups & Mini-Caucuses Endorsements
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.communityEndorsements.map((end, idx) => (
                        <span key={idx} className="bg-stone-100 text-stone-700 text-xs font-medium px-3 py-1 rounded-lg border border-stone-200">
                          {end}
                        </span>
                      ))}
                    </div>
                  </div>

                  {(selectedCandidate.contactEmail || selectedCandidate.contactPhone) && (
                    <div className="pt-4 border-t border-stone-100 flex flex-wrap gap-4 text-xs text-stone-600">
                      {selectedCandidate.contactEmail && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-stone-400" />
                          <span>{selectedCandidate.contactEmail}</span>
                        </div>
                      )}
                      {selectedCandidate.contactPhone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          <span>{selectedCandidate.contactPhone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Submit Nomination Modal */}
        <AnimatePresence>
          {isNominationModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 sm:p-8"
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">Apply for Independent Candidacy Listing</h3>
                    <p className="text-xs text-stone-500 mt-0.5">Non-partisan vetting by CSRG Ward Assembly Clerks</p>
                  </div>
                  <button onClick={() => setIsNominationModalOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
                </div>

                {formSuccess ? (
                  <div className="py-12 text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                    <h4 className="text-lg font-bold text-stone-900">Candidacy Submitted Successfully!</h4>
                    <p className="text-xs text-stone-500">Your profile and integrity pledge are now recorded on the independent candidates registry.</p>
                  </div>
                ) : (
                  <form onSubmit={handleNominationSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Full Candidate Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={formName} 
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Candidate Full Name"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none text-stone-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">Target Elective Seat *</label>
                        <select
                          value={formSeat}
                          onChange={(e: any) => setFormSeat(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none text-stone-800"
                        >
                          <option value="MCA (Member of County Assembly)">MCA (Ward Representative)</option>
                          <option value="Member of Parliament (MP)">Member of Parliament (MP)</option>
                          <option value="County Governor">County Governor</option>
                          <option value="Senator">Senator</option>
                          <option value="Woman Representative">Woman Representative</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">County *</label>
                        <select
                          value={formCounty}
                          onChange={(e) => setFormCounty(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none text-stone-800"
                        >
                          {KENYA_COUNTIES.map(c => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Ward or Constituency Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={formWard} 
                        onChange={(e) => setFormWard(e.target.value)}
                        placeholder="e.g. Kangemi Ward or Westlands Constituency"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Brief Bio & Grassroots Track Record *</label>
                      <textarea
                        required
                        rows={3}
                        value={formBio}
                        onChange={(e) => setFormBio(e.target.value)}
                        placeholder="Describe your community involvement, grassroots credentials, and why you are running independent."
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Top Priorities (One per line)</label>
                      <textarea
                        rows={2}
                        value={formPriorities}
                        onChange={(e) => setFormPriorities(e.target.value)}
                        placeholder="e.g. Ward water borehole rehabilitation&#10;Open public vetting of bursaries"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none text-stone-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">Official Email</label>
                        <input 
                          type="email" 
                          value={formEmail} 
                          onChange={(e) => setFormEmail(e.target.value)}
                          placeholder="candidate@example.com"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">Phone Number</label>
                        <input 
                          type="tel" 
                          value={formPhone} 
                          onChange={(e) => setFormPhone(e.target.value)}
                          placeholder="07XX XXX XXX"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none text-stone-900"
                        />
                      </div>
                    </div>

                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          required
                          checked={formPledgeSigned}
                          onChange={(e) => setFormPledgeSigned(e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <span className="text-xs text-emerald-900">
                          <strong>I sign the Citizen Assembly Integrity Pledge:</strong> I commit to sponsor and champion all ward assembly resolutions, reject partisan corruption, and participate in scheduled citizen feedback town halls.
                        </span>
                      </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsNominationModalOpen(false)}
                        className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={formSubmitting}
                        className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-50"
                      >
                        {formSubmitting ? 'Submitting...' : 'Submit Candidacy'}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
