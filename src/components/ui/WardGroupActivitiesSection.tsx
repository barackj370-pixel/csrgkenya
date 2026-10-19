import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  MapPin, 
  Heart, 
  Plus, 
  Share2, 
  Check, 
  Image as ImageIcon, 
  Award, 
  Tag, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { 
  getGroupActivities, 
  saveGroupActivity, 
  cheerGroupActivity, 
  GroupActivity 
} from '../../lib/civicData';
import { useAuth } from '../../contexts/AuthContext';

interface WardGroupActivitiesSectionProps {
  wardId: string;
  wardName: string;
  groups?: any[];
}

export default function WardGroupActivitiesSection({ wardId, wardName, groups = [] }: WardGroupActivitiesSectionProps) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<GroupActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [cheeredIds, setCheeredIds] = useState<Record<string, boolean>>({});

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formGroupName, setFormGroupName] = useState('');
  const [formCategory, setFormCategory] = useState<GroupActivity['category']>('Field Action & Harambee');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formVenue, setFormVenue] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formKeyOutcomes, setFormKeyOutcomes] = useState('');
  const [formParticipants, setFormParticipants] = useState<number>(15);
  const [formImage, setFormImage] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'All',
    'Field Action & Harambee',
    'Citizen Caucus Meeting',
    'Public Service Inspection',
    'Agroecology & Kitchen Gardens',
    'Youth & Women Empowerment'
  ];

  useEffect(() => {
    fetchActivities();
  }, [wardId]);

  async function fetchActivities() {
    setLoading(true);
    const data = await getGroupActivities(wardId);
    setActivities(data);
    setLoading(false);
  }

  const handleCheer = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (cheeredIds[id]) return;

    setCheeredIds(prev => ({ ...prev, [id]: true }));
    const newCount = await cheerGroupActivity(id);
    setActivities(prev => prev.map(a => a.id === id ? { ...a, cheersCount: newCount } : a));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newAct = await saveGroupActivity({
        wardId,
        wardName,
        title: formTitle.trim(),
        groupName: formGroupName.trim() || `${wardName} Community Group`,
        category: formCategory,
        activityDate: formDate,
        venue: formVenue.trim() || `${wardName} Ward`,
        description: formDescription.trim(),
        keyOutcomes: formKeyOutcomes.trim(),
        participantCount: Number(formParticipants) || 10,
        imageUrl: formImage || undefined,
        postedBy: user?.name ? `${user.name} (${user.role === 'CLERK' ? 'Ward Clerk' : 'Member'})` : 'Group Representative'
      });

      setActivities(prev => [newAct, ...prev]);
      setIsPostModalOpen(false);
      // Reset form
      setFormTitle('');
      setFormDescription('');
      setFormKeyOutcomes('');
      setFormVenue('');
      setFormImage('');
    } catch (err) {
      alert('Failed to publish activity.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = activities.filter(a => selectedCategory === 'All' || a.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Mini-Caucuses & Groups Wall
              </span>
              <span className="text-xs text-stone-400 font-medium">{wardName} Ward</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-emerald-600" />
              Community Groups & Mini-Caucuses Activity Feed
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-2xl">
              See what grassroots women groups, youth bunges, and farmer cooperatives are doing in {wardName}. Learn from their field actions, meetings, and project milestones.
            </p>
          </div>

          <button
            onClick={() => setIsPostModalOpen(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-md hover:shadow-lg cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Post Group Activity / Action</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="pt-6 flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-emerald-800 text-white shadow-sm' 
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Activities Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3"></div>
          <p className="text-xs text-stone-500">Loading mini-caucus activities...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
          <Users className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-lg font-bold text-stone-900">No Group Activities Posted Yet</h3>
          <p className="text-stone-500 text-xs max-w-md mx-auto">
            Be the first group or mini-caucus to post your meetings, harambee cleanups, or agroecology training on the {wardName} wall.
          </p>
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-4 py-2 rounded-xl"
          >
            <Plus className="w-3.5 h-3.5" /> Post First Activity
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(act => (
            <div 
              key={act.id}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Photo / Banner if uploaded */}
                {act.imageUrl && (
                  <div className="h-48 overflow-hidden bg-stone-100 relative">
                    <img 
                      src={act.imageUrl} 
                      alt={act.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                      {act.category}
                    </div>
                  </div>
                )}

                <div className="p-5 space-y-3">
                  {!act.imageUrl && (
                    <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                      {act.category}
                    </span>
                  )}

                  <div>
                    <div className="text-xs font-bold text-emerald-700 mb-0.5">
                      {act.groupName}
                    </div>
                    <h3 className="text-base font-bold text-stone-900 leading-snug">
                      {act.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-3 text-[11px] text-stone-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {act.activityDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {act.venue}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {act.participantCount} Wananchi
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    {act.description}
                  </p>

                  {act.keyOutcomes && (
                    <div className="bg-stone-50 border border-stone-200/80 p-3 rounded-xl text-xs text-stone-800">
                      <span className="font-bold text-stone-900 block mb-0.5">Key Tangible Outcomes:</span>
                      {act.keyOutcomes}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer: Cheers and Author */}
              <div className="px-5 py-3 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between text-xs">
                <span className="text-[11px] text-stone-400">
                  Posted by {act.postedBy}
                </span>

                <button
                  onClick={(e) => handleCheer(act.id, e)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    cheeredIds[act.id]
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${cheeredIds[act.id] ? 'fill-rose-600 text-rose-600' : 'text-stone-400'}`} />
                  <span>{act.cheersCount || 1} Pongezi</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Activity Modal */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                <div>
                  <h3 className="text-xl font-bold text-stone-900">Post Mini-Caucus Activity</h3>
                  <p className="text-xs text-stone-500">{wardName} Ward Wall</p>
                </div>
                <button onClick={() => setIsPostModalOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Activity Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Community Drainage Clearing & Compost Demonstration"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none text-stone-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Group / Mini-Caucus Name *</label>
                    <input
                      type="text"
                      required
                      value={formGroupName}
                      onChange={(e) => setFormGroupName(e.target.value)}
                      placeholder="e.g. Waruku Women Collective"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Category *</label>
                    <select
                      value={formCategory}
                      onChange={(e: any) => setFormCategory(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none text-stone-800"
                    >
                      <option value="Field Action & Harambee">Field Action & Harambee</option>
                      <option value="Citizen Caucus Meeting">Citizen Caucus Meeting</option>
                      <option value="Public Service Inspection">Public Service Inspection</option>
                      <option value="Agroecology & Kitchen Gardens">Agroecology & Kitchen Gardens</option>
                      <option value="Youth & Women Empowerment">Youth & Women Empowerment</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Venue / Location</label>
                    <input
                      type="text"
                      value={formVenue}
                      onChange={(e) => setFormVenue(e.target.value)}
                      placeholder="e.g. Market Ground"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Wananchi Attended</label>
                    <input
                      type="number"
                      min={1}
                      value={formParticipants}
                      onChange={(e) => setFormParticipants(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none text-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">What happened? (Description) *</label>
                  <textarea
                    required
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe the activity, who attended, and what issues were addressed."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Key Outcomes & Results</label>
                  <input
                    type="text"
                    value={formKeyOutcomes}
                    onChange={(e) => setFormKeyOutcomes(e.target.value)}
                    placeholder="e.g. 500 meters of drains cleared; 12 seed varieties swapped"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none text-stone-900"
                  />
                </div>

                {/* Photo Upload or URL */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Attach Activity Photo (Optional)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-xs text-stone-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                  </div>
                  {formImage && (
                    <div className="mt-2 h-24 w-40 rounded-xl overflow-hidden border border-stone-200">
                      <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsPostModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-50"
                  >
                    {submitting ? 'Publishing...' : 'Publish to Ward Wall'}
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
