import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Check, 
  X, 
  Sparkles, 
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { 
  MiniCaucusEvent, 
  getMiniCaucuses, 
  saveMiniCaucus, 
  deleteMiniCaucus 
} from '../../lib/civicData';
import { supabase } from '../../lib/supabase';

interface UpdateMiniCaucusModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCaucusId?: string;
  onSaved?: (saved: MiniCaucusEvent) => void;
}

export default function UpdateMiniCaucusModal({
  isOpen,
  onClose,
  initialCaucusId,
  onSaved
}: UpdateMiniCaucusModalProps) {
  const [caucuses, setCaucuses] = useState<MiniCaucusEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string>(initialCaucusId || 'caucus-sikhendu-sibembe');
  const [wards, setWards] = useState<any[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [wardName, setWardName] = useState('Sikhendu');
  const [wardId, setWardId] = useState('ward-7');
  const [county, setCounty] = useState('Trans Nzoia');
  const [groupName, setGroupName] = useState('Sibembe Food Coop');
  const [title, setTitle] = useState('Sikhendu Ward Citizen Mini-Caucus (Sibembe Food Coop)');
  const [dateLabel, setDateLabel] = useState('Concluded: Tuesday, Oct 20 (10:00 AM – 12:00 PM • 2 Hours)');
  const [venue, setVenue] = useState('Sibembe Community Center / Grounds, Sikhendu Ward');
  const [agenda, setAgenda] = useState('Grassroots wananchi deliberation ahead of the upcoming National Citizen Assembly on December 10, 2026. Consolidating community priorities on agroecology, smallholder seed sovereignty, rural feeder road maintenance, and adopting citizen resolutions.');
  const [status, setStatus] = useState<'UPCOMING_TOMORROW' | 'ACTIVE_TODAY' | 'UPCOMING' | 'CONCLUDED'>('CONCLUDED');
  const [isSpotlight, setIsSpotlight] = useState(true);
  const [facilitatorRole, setFacilitatorRole] = useState('Irene Nyongesa (Sibembe Food Coop Leader)');
  const [contactPhone, setContactPhone] = useState('');

  // Load existing caucuses & wards
  useEffect(() => {
    if (!isOpen) return;
    async function loadData() {
      const list = await getMiniCaucuses();
      setCaucuses(list);

      try {
        const { data: wardsData } = await supabase.from('Ward').select('*');
        if (wardsData) setWards(wardsData);
      } catch (e) {
        console.warn('Could not fetch wards for mini caucus modal:', e);
      }

      // Populate form from selected or default
      const targetId = initialCaucusId || selectedId || (list.length > 0 ? list[0].id : '');
      const found = list.find(c => c.id === targetId) || list[0];
      if (found) {
        populateForm(found);
      }
    }
    loadData();
  }, [isOpen, initialCaucusId]);

  const populateForm = (c: MiniCaucusEvent) => {
    setSelectedId(c.id);
    setIsCreatingNew(false);
    setWardName(c.wardName || 'Sikhendu');
    setWardId(c.wardId || 'ward-7');
    setCounty(c.county || 'Trans Nzoia');
    setGroupName(c.groupName || 'Sibembe Food Coop');
    setTitle(c.title || '');
    setDateLabel(c.dateLabel || 'Concluded: Tuesday, Oct 20 (10:00 AM – 12:00 PM • 2 Hours)');
    setVenue(c.venue || '');
    setAgenda(c.agenda || '');
    setStatus(c.status || 'CONCLUDED');
    setIsSpotlight(c.isSpotlight ?? true);
    setFacilitatorRole(c.facilitatorRole || 'Group Convener');
    setContactPhone(c.contactPhone || '');
  };

  const handleStartNew = () => {
    setIsCreatingNew(true);
    setSelectedId('');
    setWardName('Sikhendu');
    setWardId('ward-7');
    setCounty('Trans Nzoia');
    setGroupName('');
    setTitle('');
    setDateLabel('Tuesday (10:00 AM – 12:00 PM)');
    setVenue('');
    setAgenda('Consolidating grassroots priorities and resolutions ahead of the National Citizen Assembly on December 10, 2026.');
    setStatus('UPCOMING');
    setIsSpotlight(true);
    setFacilitatorRole('Caucus Convener');
    setContactPhone('');
  };

  const handleWardSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const selected = wards.find(w => w.id === val || w.name === val);
    if (selected) {
      setWardId(selected.id);
      setWardName(selected.name);
      setCounty(selected.county || 'Kenya');
      if (isCreatingNew || !title) {
        setTitle(`${selected.name} Ward Citizen Mini-Caucus`);
      }
    } else {
      setWardName(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wardName.trim() || !groupName.trim()) {
      alert('Please provide both the Ward name and Group/Caucus name.');
      return;
    }

    setLoading(true);
    try {
      const saved = await saveMiniCaucus({
        id: isCreatingNew ? undefined : selectedId,
        wardId,
        wardName: wardName.trim(),
        county,
        groupName: groupName.trim(),
        title: title.trim() || `${wardName} Ward Citizen Mini-Caucus (${groupName})`,
        dateLabel: dateLabel.trim(),
        venue: venue.trim() || `${groupName} Meeting Grounds, ${wardName} Ward`,
        agenda: agenda.trim(),
        status,
        isSpotlight,
        facilitatorRole: facilitatorRole.trim() || 'Caucus Convener',
        contactPhone: contactPhone.trim(),
      });

      setSuccessMsg('Mini-Caucus successfully updated! It is now live on the Homepage Header Carousel.');
      const updatedList = await getMiniCaucuses();
      setCaucuses(updatedList);
      setSelectedId(saved.id);
      setIsCreatingNew(false);

      if (onSaved) onSaved(saved);

      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(`Error saving mini caucus: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-950 via-sky-900 to-emerald-950 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-stone-950" /> Live Carousel 1
              </span>
              <span className="text-xs text-sky-200 font-medium">Citizen Mini-Caucus Manager</span>
            </div>
            <button
              onClick={onClose}
              className="text-stone-300 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-xl md:text-2xl font-black mt-2">
            Schedule & Update Mini-Caucuses
          </h2>
          <p className="text-xs md:text-sm text-stone-300 mt-1 max-w-xl">
            Pre-assembly citizen mini-caucuses (like Sikhendu Ward Sibembe group) lead directly to the National Citizen Assembly on December 10, 2026. Updates display in real-time on Carousel Slide 1.
          </p>
        </div>

        {/* Existing Caucuses Selector Bar */}
        <div className="bg-stone-50 px-6 py-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase">Select Session:</span>
            {caucuses.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => populateForm(c)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  selectedId === c.id && !isCreatingNew
                    ? 'bg-sky-800 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                {c.wardName}: {c.groupName.slice(0, 20)}
                {c.isSpotlight && ' ★'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleStartNew}
            className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              isCreatingNew
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            + Add New Mini-Caucus
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl text-xs sm:text-sm border border-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Ward & County */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Ward <span className="text-red-500">*</span>
              </label>
              {wards.length > 0 ? (
                <select
                  value={wardId}
                  onChange={handleWardSelect}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
                >
                  {wards.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.county || 'Ward'})
                    </option>
                  ))}
                  <option value="custom">Other / Custom Ward</option>
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={wardName}
                  onChange={e => setWardName(e.target.value)}
                  placeholder="e.g. Sikhendu, Masaba, Kangemi"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                County
              </label>
              <input
                type="text"
                value={county}
                onChange={e => setCounty(e.target.value)}
                placeholder="e.g. Trans Nzoia, Migori, Nairobi"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
              />
            </div>
          </div>

          {/* Group / Caucus Name & Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Group or Caucus Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={groupName}
                onChange={e => {
                  setGroupName(e.target.value);
                  if (isCreatingNew || !title) {
                    setTitle(`${wardName} Ward Citizen Mini-Caucus (${e.target.value})`);
                  }
                }}
                placeholder="e.g. Sibembe Food Coop"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Caucus Date <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={dateLabel}
                onChange={e => setDateLabel(e.target.value)}
                placeholder="e.g. Saturday, 24th October 2026"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Headline Title on Carousel
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Sikhendu Ward Citizen Mini-Caucus (Sibembe Food Coop)"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-600 outline-none font-bold"
            />
          </div>

          {/* Venue & Location */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Physical Venue & Assembly Point <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={venue}
              onChange={e => setVenue(e.target.value)}
              placeholder="e.g. Sibembe Community Center / Grounds, Sikhendu Ward"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
            />
          </div>

          {/* Agenda & Priorities */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Agenda, Issues & December 10 Assembly Resolutions
            </label>
            <textarea
              rows={3}
              required
              value={agenda}
              onChange={e => setAgenda(e.target.value)}
              placeholder="What wananchi priorities, agroecological issues, or resolutions will be deliberated?"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
            />
          </div>

          {/* Status & Carousel Spotlight Checkbox */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Status Indicator</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
              >
                <option value="CONCLUDED">Concluded / Resolutions Passed (10:00 AM – 12:00 PM)</option>
                <option value="ACTIVE_TODAY">Active Today / In Session</option>
                <option value="UPCOMING">Upcoming This Week</option>
                <option value="UPCOMING_TOMORROW">Happening Tomorrow</option>
              </select>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2.5">
              <input
                id="isSpotlight"
                type="checkbox"
                checked={isSpotlight}
                onChange={e => setIsSpotlight(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="isSpotlight" className="text-xs text-stone-800 font-semibold cursor-pointer">
                <strong>Feature on Carousel Slide 1:</strong> Spotlight this mini-caucus on the Homepage top carousel.
              </label>
            </div>
          </div>

          {/* Facilitator & Contact (NO fake names!) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Facilitator / Official Role
              </label>
              <input
                type="text"
                value={facilitatorRole}
                onChange={e => setFacilitatorRole(e.target.value)}
                placeholder="e.g. Sibembe Caucus Convener or Ward Clerk"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
              />
              <p className="text-[10px] text-stone-400 mt-0.5">Use role titles instead of unverified individual names.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Help / Information Line (Optional)
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="e.g. 0700000000"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-600 outline-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
            {!isCreatingNew && selectedId && selectedId !== 'caucus-sikhendu-sibembe' && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this mini-caucus?')) {
                    await deleteMiniCaucus(selectedId);
                    const updated = await getMiniCaucuses();
                    setCaucuses(updated);
                    if (updated.length > 0) populateForm(updated[0]);
                  }
                }}
                className="text-xs text-red-600 hover:text-red-700 font-bold px-3 py-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
              >
                Delete Mini-Caucus
              </button>
            )}

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-sky-800 hover:bg-sky-900 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save & Publish to Carousel 1'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
