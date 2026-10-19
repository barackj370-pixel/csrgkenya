import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  MapPin, 
  FileCheck, 
  ChevronRight, 
  MessageSquare, 
  Send, 
  UserCheck,
  Search,
  Filter,
  Shield,
  Layers
} from 'lucide-react';
import { 
  CSRG_12_COMMITTEES, 
  getCommitteeSittings, 
  getResolutionTrackers, 
  CommitteeSitting, 
  ResolutionTrackerItem,
  CommitteeInfo
} from '../lib/civicData';

export default function CommitteeSittingsPage() {
  const [sittings, setSittings] = useState<CommitteeSitting[]>([]);
  const [trackers, setTrackers] = useState<ResolutionTrackerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommittee, setSelectedCommittee] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'sittings' | 'trackers' | 'committees'>('trackers');
  const [feedbackModalResolution, setFeedbackModalResolution] = useState<ResolutionTrackerItem | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [sits, trks] = await Promise.all([
        getCommitteeSittings(),
        getResolutionTrackers()
      ]);
      setSittings(sits);
      setTrackers(trks);
      setLoading(false);
    }
    load();
  }, []);

  const filteredTrackers = trackers.filter(t => {
    const matchesCommittee = selectedCommittee === 'All' || t.committeeAssigned.toLowerCase().includes(selectedCommittee.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || t.status === selectedStatus;
    return matchesCommittee && matchesStatus;
  });

  const getStatusBadge = (status: ResolutionTrackerItem['status']) => {
    switch (status) {
      case 'IMPLEMENTED':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed & Verified</span>;
      case 'IN_PROGRESS':
        return <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3 text-sky-600" /> Work In Progress</span>;
      case 'BUDGET_COMMITTED':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><Layers className="w-3 h-3 text-purple-600" /> CADP Budget Committed</span>;
      case 'EXECUTIVE_SUMMONED':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-600" /> Executive Summoned</span>;
      case 'STALLED':
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-600" /> Action Stalled / Red Flag</span>;
      default:
        return <span className="bg-stone-100 text-stone-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">In Committee Review</span>;
    }
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || !feedbackModalResolution) return;

    setTrackers(prev => prev.map(t => {
      if (t.id === feedbackModalResolution.id) {
        return {
          ...t,
          citizenVerificationCount: (t.citizenVerificationCount || 0) + 1
        };
      }
      return t;
    }));

    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackSubmitted(false);
      setFeedbackModalResolution(null);
      setFeedbackText('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-sky-950 via-sky-900 to-stone-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-300 px-3 py-1 rounded-full text-xs font-bold mb-4 border border-sky-400/30">
              <Building2 className="w-3.5 h-3.5" /> 12 Citizen Assembly Committees
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
              Committee Sittings & Resolution Follow-Up Portal
            </h1>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-6">
              Citizen assemblies do not stop at passing resolutions. <strong>12 Sectoral Oversight Committees</strong> sit between April and November to interrogate county executives, audit CADP budgets, inspect ground projects, and give wananchi direct progress feedback.
            </p>

            {/* Sub-Tabs */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => setActiveTab('trackers')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'trackers' ? 'bg-white text-sky-950 shadow-md' : 'bg-sky-900/60 text-stone-300 hover:bg-sky-850'
                }`}
              >
                Resolution Tracker ({trackers.length})
              </button>
              <button
                onClick={() => setActiveTab('sittings')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'sittings' ? 'bg-white text-sky-950 shadow-md' : 'bg-sky-900/60 text-stone-300 hover:bg-sky-850'
                }`}
              >
                Committee Sittings Calendar ({sittings.length})
              </button>
              <button
                onClick={() => setActiveTab('committees')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'committees' ? 'bg-white text-sky-950 shadow-md' : 'bg-sky-900/60 text-stone-300 hover:bg-sky-850'
                }`}
              >
                The 12 Sectoral Committees
              </button>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
            <Building2 className="w-96 h-96 text-white" />
          </div>
        </div>

        {/* TAB 1: RESOLUTION IMPLEMENTATION TRACKER */}
        {activeTab === 'trackers' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <span className="text-xs font-bold text-stone-400">Status:</span>
                {['All', 'IN_PROGRESS', 'IMPLEMENTED', 'BUDGET_COMMITTED', 'STALLED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer ${
                      selectedStatus === st ? 'bg-sky-800 text-white' : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {st === 'All' ? 'All Statuses' : st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="w-full md:w-72">
                <select
                  value={selectedCommittee}
                  onChange={(e) => setSelectedCommittee(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2 px-3 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-800"
                >
                  <option value="All">All 12 Oversight Committees</option>
                  {CSRG_12_COMMITTEES.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Resolutions List */}
            {filteredTrackers.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
                <Building2 className="w-12 h-12 text-stone-300 mx-auto" />
                <h3 className="text-lg font-bold text-stone-900">No Resolutions Tracked Yet</h3>
                <p className="text-stone-500 text-xs max-w-md mx-auto">
                  Resolutions passed during ward and national citizen assemblies will be logged here for sectoral committee interrogation, budget auditing, and executive follow-up.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredTrackers.map(item => (
                  <div 
                    key={item.id} 
                    className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
                          {item.wardName}
                        </span>
                        <span className="text-xs text-stone-400">Passed: {item.passedAt}</span>
                      </div>

                      <div>{getStatusBadge(item.status)}</div>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug mb-2">
                        {item.resolutionText}
                      </h3>
                      <div className="text-xs text-stone-500 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-stone-400" />
                        <span>Assigned to: <strong>{item.committeeAssigned}</strong></span>
                      </div>
                    </div>

                    {/* Official Committee Feedback Box */}
                    <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80">
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Official Committee Sitting Feedback</span>
                        <span>Updated {item.lastUpdated}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
                        {item.officialFeedback}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <div className="text-xs text-stone-500 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span><strong>{item.citizenVerificationCount}</strong> wananchi verifications on the ground</span>
                      </div>

                      <button
                        onClick={() => setFeedbackModalResolution(item)}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 px-4 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Submit Ground Feedback to Committee</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SITTINGS CALENDAR */}
        {activeTab === 'sittings' && (
          <div className="space-y-6">
            {sittings.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
                <Calendar className="w-12 h-12 text-stone-300 mx-auto" />
                <h3 className="text-lg font-bold text-stone-900">No Committee Sittings Scheduled Yet</h3>
                <p className="text-stone-500 text-xs max-w-md mx-auto">
                  Sectoral oversight committee sittings are held between April and November across Kenya. Scheduled sittings and hearing reports will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sittings.map(sit => (
                <div key={sit.id} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-md">
                        {sit.committeeName}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sit.status === 'CONCLUDED' ? 'bg-stone-100 text-stone-600' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {sit.status === 'CONCLUDED' ? 'Concluded Sitting' : 'Upcoming Sitting'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-stone-900 mb-2">
                      {sit.title}
                    </h3>

                    <div className="space-y-1.5 text-xs text-stone-500 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>Date: <strong>{sit.sittingDate}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        <span>Venue: {sit.venue}</span>
                      </div>
                    </div>

                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs text-stone-600 mb-4">
                      <strong>Sitting Agenda:</strong> {sit.agenda}
                    </div>

                    {sit.outcomesAndFeedback && (
                      <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 text-xs text-emerald-950 mb-3">
                        <strong>Official Findings & Action:</strong> {sit.outcomesAndFeedback}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                      Resolutions Followed Up:
                    </div>
                    <ul className="space-y-1">
                      {sit.resolutionsDiscussed.map((res, i) => (
                        <li key={i} className="text-xs text-stone-600 flex items-start gap-1.5">
                          <span className="text-sky-600 font-bold">•</span>
                          <span>{res}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

        {/* TAB 3: 12 COMMITTEES CATALOG */}
        {activeTab === 'committees' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CSRG_12_COMMITTEES.map((com, index) => (
              <div key={com.id} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-sky-100 text-sky-900 font-bold text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    {com.sector}
                  </span>
                </div>

                <h3 className="text-base font-bold text-stone-900 leading-snug">
                  {com.name}
                </h3>

                <p className="text-xs text-stone-500 leading-relaxed">
                  {com.mandate}
                </p>

                <div className="pt-3 border-t border-stone-100 text-xs text-stone-600">
                  <span>Presiding Convener: <strong>{com.convener}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Citizen Ground Verification Modal */}
        <AnimatePresence>
          {feedbackModalResolution && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200"
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                  <h3 className="text-lg font-bold text-stone-900">Submit Ground Evidence & Feedback</h3>
                  <button onClick={() => setFeedbackModalResolution(null)} className="text-stone-400 hover:text-stone-700">✕</button>
                </div>

                {feedbackSubmitted ? (
                  <div className="py-8 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <h4 className="text-base font-bold text-stone-900">Feedback Transmitted to Committee</h4>
                    <p className="text-xs text-stone-500">Your ground report has been queued for the next committee sitting review.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSendFeedback} className="space-y-4">
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs text-stone-700">
                      <strong>Resolution:</strong> {feedbackModalResolution.resolutionText}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        What is the real status on the ground? *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="e.g. Visited the site yesterday at Waruku; culvert was cleared but rubble was left on the roadside. Work is approximately 70% done."
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setFeedbackModalResolution(null)}
                        className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl"
                      >
                        Submit Ground Evidence
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
