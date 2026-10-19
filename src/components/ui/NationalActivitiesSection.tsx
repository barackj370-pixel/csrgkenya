import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Calendar, 
  MapPin, 
  Users, 
  ExternalLink, 
  Plus, 
  Sparkles, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getNationalActivities, saveNationalActivity, NationalActivity } from '../../lib/civicData';
import { useAuth } from '../../contexts/AuthContext';

export default function NationalActivitiesSection() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<NationalActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<NationalActivity['category']>('National Assembly');
  const [formDate, setFormDate] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formCounties, setFormCounties] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formParticipation, setFormParticipation] = useState('');
  const [formOrganizer, setFormOrganizer] = useState('');
  const [formUrgent, setFormUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    setLoading(true);
    const data = await getNationalActivities();
    setActivities(data);
    setLoading(false);
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newAct = await saveNationalActivity({
        title: formTitle.trim(),
        category: formCategory,
        dateRange: formDate.trim(),
        location: formLocation.trim(),
        targetCounties: formCounties.trim() || 'All 47 Counties',
        description: formDescription.trim(),
        howToParticipate: formParticipation.trim(),
        organizer: formOrganizer.trim() || 'CSRG National Secretariat',
        isUrgent: formUrgent
      });

      setActivities(prev => [newAct, ...prev]);
      setIsModalOpen(false);
      // Reset
      setFormTitle('');
      setFormDate('');
      setFormLocation('');
      setFormDescription('');
      setFormParticipation('');
    } catch (err) {
      alert('Failed to publish announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-red-100 text-red-800 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                Official Announcements
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 flex items-center gap-2">
              <Bell className="w-7 h-7 text-red-600" />
              National Citizen Activities & Nationwide Bulletins
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-2xl">
              Stay informed on upcoming nationwide civic mobilizations, budget hearing deployments, and national assembly conventions across Kenya.
            </p>
          </div>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-md cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Publish National Announcement</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-3"></div>
          <p className="text-xs text-stone-500">Loading national announcements...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
          <Bell className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-lg font-bold text-stone-900">No National Announcements Posted Yet</h3>
          <p className="text-stone-500 text-xs max-w-md mx-auto">
            Official notices, public hearing dates, and national assembly bulletins will appear here once published by conveners and administrators.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map(act => (
            <div
              key={act.id}
              className={`rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                act.isUrgent
                  ? 'bg-gradient-to-br from-red-50/50 via-white to-red-50/30 border-red-200'
                  : 'bg-white border-stone-200'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                    act.isUrgent ? 'bg-red-600 text-white' : 'bg-stone-100 text-stone-700'
                  }`}>
                    {act.category}
                  </span>
                  <span className="text-stone-400 font-medium text-[11px]">
                    {act.organizer}
                  </span>
                </div>

                <h3 className="text-base font-bold text-stone-900 leading-snug">
                  {act.title}
                </h3>

                <div className="space-y-1.5 text-xs text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span><strong>{act.dateRange}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{act.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-stone-400" />
                    <span>Coverage: {act.targetCounties}</span>
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  {act.description}
                </p>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs text-stone-700">
                  <strong className="text-stone-900 block mb-0.5">How to Participate:</strong>
                  {act.howToParticipate}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-stone-100 text-xs font-bold text-red-700 flex items-center justify-between">
                <span>Nationwide Mobilization</span>
                <span className="w-2 h-2 rounded-full bg-red-600"></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publish Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                <div>
                  <h3 className="text-xl font-bold text-stone-900">Publish National Announcement</h3>
                  <p className="text-xs text-stone-500">Notice to all 47 counties and ward assemblies</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Announcement Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. National Peasant & Smallholder Food Sovereignty Assembly"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-red-600 outline-none text-stone-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Category *</label>
                    <select
                      value={formCategory}
                      onChange={(e: any) => setFormCategory(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-red-600 outline-none text-stone-800"
                    >
                      <option value="National Assembly">National Assembly</option>
                      <option value="Public Hearing Mobilization">Public Hearing Mobilization</option>
                      <option value="Peasant Caravan">Peasant Caravan</option>
                      <option value="Youth Bunge Summit">Youth Bunge Summit</option>
                      <option value="Budget Audit">Budget Audit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Date or Schedule *</label>
                    <input
                      type="text"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      placeholder="e.g. Last Saturday of June 2026"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-red-600 outline-none text-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Location / Venue *</label>
                    <input
                      type="text"
                      required
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder="e.g. Ufungamano House & All Wards"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-red-600 outline-none text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Counties Targeted</label>
                    <input
                      type="text"
                      value={formCounties}
                      onChange={(e) => setFormCounties(e.target.value)}
                      placeholder="e.g. All 47 Counties"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-red-600 outline-none text-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Activity Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Details about the activity and its constitutional objective."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-red-600 outline-none text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">How can wananchi participate? *</label>
                  <input
                    type="text"
                    required
                    value={formParticipation}
                    onChange={(e) => setFormParticipation(e.target.value)}
                    placeholder="e.g. Register as a delegate or join via your local ward bunge."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-red-600 outline-none text-stone-900"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="urgent"
                    checked={formUrgent}
                    onChange={(e) => setFormUrgent(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <label htmlFor="urgent" className="text-xs text-stone-700 font-bold">
                    Mark as High Priority / Urgent Notice
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50"
                  >
                    {submitting ? 'Publishing...' : 'Publish Announcement'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
