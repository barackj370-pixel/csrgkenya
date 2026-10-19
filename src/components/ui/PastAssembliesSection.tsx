import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Archive, 
  Calendar, 
  Video, 
  FileText, 
  Users, 
  Upload, 
  ExternalLink, 
  CheckCircle2, 
  Search,
  ArrowRight
} from 'lucide-react';
import { 
  getPastAssemblyArchives, 
  savePastAssemblyArchive, 
  PastAssemblyArchive 
} from '../../lib/civicData';
import { useAuth } from '../../contexts/AuthContext';

export default function PastAssembliesSection() {
  const { user } = useAuth();
  const [archives, setArchives] = useState<PastAssemblyArchive[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState<PastAssemblyArchive | null>(null);

  // Upload Form State
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<PastAssemblyArchive['assemblyType']>('National Citizen Assembly');
  const [formWard, setFormWard] = useState('National Level');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formConvener, setFormConvener] = useState('');
  const [formAttendance, setFormAttendance] = useState(250);
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formResolutionsCount, setFormResolutionsCount] = useState(10);
  const [formKeyResolutions, setFormKeyResolutions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadArchives();
  }, []);

  async function loadArchives() {
    setLoading(true);
    const data = await getPastAssemblyArchives();
    setArchives(data);
    setLoading(false);
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const resList = formKeyResolutions
        .split('\n')
        .map(r => r.trim())
        .filter(Boolean);

      const newArch = await savePastAssemblyArchive({
        title: formTitle.trim(),
        assemblyType: formType,
        wardOrLevel: formWard.trim(),
        sessionDate: formDate,
        presidingConvener: formConvener.trim() || 'Ward Secretariat',
        attendanceCount: Number(formAttendance) || 100,
        videoUrl: formVideoUrl.trim() || undefined,
        resolutionsSummary: formSummary.trim(),
        resolutionsCount: Number(formResolutionsCount) || resList.length || 5,
        keyResolutions: resList.length > 0 ? resList : ['Citizen Assembly adopted priorities']
      });

      setArchives(prev => [newArch, ...prev]);
      setIsUploadModalOpen(false);
      // Reset
      setFormTitle('');
      setFormSummary('');
      setFormKeyResolutions('');
      setFormVideoUrl('');
    } catch (err) {
      alert('Failed to upload past assembly proceedings.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = archives.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.wardOrLevel.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.resolutionsSummary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-sky-100 text-sky-800 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Permanent Public Record
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 flex items-center gap-2">
              <Archive className="w-7 h-7 text-sky-700" />
              Past Assemblies Proceedings & Follow-Up Archive
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-2xl">
              Watch session recordings, review adopted resolutions matrices, and follow up on implementation progress from past national and ward assemblies.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-md cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Past Assembly Session</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="pt-6 relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search past assemblies by title, ward, or topic..."
            className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2 pl-10 pr-4 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-800"
          />
        </div>
      </div>

      {/* Archives Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mb-3"></div>
          <p className="text-xs text-stone-500">Loading past assembly archive...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
          <Archive className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-lg font-bold text-stone-900">
            {searchQuery ? 'No Past Assemblies Match Your Search' : 'No Past Assemblies Uploaded Yet'}
          </h3>
          <p className="text-stone-500 text-xs max-w-md mx-auto">
            {searchQuery 
              ? 'Try adjusting your search keywords.' 
              : 'Official recordings, minutes, and resolutions from concluded ward and national assemblies will appear here once uploaded by clerks or administrators.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-800 bg-sky-50 px-4 py-2 rounded-xl cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" /> Upload First Assembly Session
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(item => (
            <div 
              key={item.id}
              onClick={() => setSelectedArchive(item)}
              className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-md">
                    {item.assemblyType}
                  </span>
                  <span className="text-stone-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {item.sessionDate}
                  </span>
                </div>

                <h3 className="text-base font-bold text-stone-900 group-hover:text-sky-800 transition-colors">
                  {item.title}
                </h3>

                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <span>{item.wardOrLevel}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3 text-stone-400" /> {item.attendanceCount} Attended</span>
                </div>

                <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                  {item.resolutionsSummary}
                </p>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs text-stone-700">
                  <span className="font-bold text-sky-900 block mb-1">
                    {item.resolutionsCount} Adopted Resolutions
                  </span>
                  <ul className="space-y-1">
                    {item.keyResolutions.slice(0, 2).map((r, i) => (
                      <li key={i} className="text-[11px] text-stone-600 flex items-start gap-1 line-clamp-1">
                        <span className="text-sky-600 font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-sky-700 group-hover:translate-x-1 transition-transform">
                <span>View Full Record & Follow-Up</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedArchive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-start justify-between border-b border-stone-100 pb-4">
                <div>
                  <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-1">
                    {selectedArchive.assemblyType} · {selectedArchive.sessionDate}
                  </div>
                  <h2 className="text-2xl font-black text-stone-900">{selectedArchive.title}</h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {selectedArchive.wardOrLevel} · Presided by {selectedArchive.presidingConvener}
                  </p>
                </div>
                <button onClick={() => setSelectedArchive(null)} className="text-stone-400 hover:text-stone-700">✕</button>
              </div>

              {selectedArchive.videoUrl && (
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-sky-950">Session Video & Audio Recording Available</div>
                      <div className="text-[11px] text-sky-700">Listen to verbatim wananchi deliberations and debates</div>
                    </div>
                  </div>
                  <a 
                    href={selectedArchive.videoUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-sky-800 px-3 py-1.5 rounded-lg border border-sky-300 hover:bg-sky-100 shadow-sm"
                  >
                    <span>Watch Recording</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                  Session Summary & Deliberation Context
                </h4>
                <p className="text-sm text-stone-700 leading-relaxed">
                  {selectedArchive.resolutionsSummary}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                  Adopted Resolutions & Citizen Demands ({selectedArchive.resolutionsCount})
                </h4>
                <div className="space-y-2">
                  {selectedArchive.keyResolutions.map((res, idx) => (
                    <div key={idx} className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-800 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{res}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>Official Attendance: <strong>{selectedArchive.attendanceCount} Wananchi Delegates</strong></span>
                <button
                  onClick={() => setSelectedArchive(null)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold"
                >
                  Close Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                <div>
                  <h3 className="text-xl font-bold text-stone-900">Upload Past Assembly Record</h3>
                  <p className="text-xs text-stone-500">Enable wananchi to follow up on previous resolutions</p>
                </div>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Assembly Session Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. National Citizen Assembly Q1 2026 Deliberations"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Assembly Level *</label>
                    <select
                      value={formType}
                      onChange={(e: any) => setFormType(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-800"
                    >
                      <option value="National Citizen Assembly">National Citizen Assembly</option>
                      <option value="Ward Citizen Assembly">Ward Citizen Assembly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Ward / County Name</label>
                    <input
                      type="text"
                      value={formWard}
                      onChange={(e) => setFormWard(e.target.value)}
                      placeholder="e.g. National Level or Kangemi Ward"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Session Date *</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Presiding Clerk</label>
                    <input
                      type="text"
                      value={formConvener}
                      onChange={(e) => setFormConvener(e.target.value)}
                      placeholder="e.g. Ward Assembly Clerk"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Attendance Count</label>
                    <input
                      type="number"
                      min={1}
                      value={formAttendance}
                      onChange={(e) => setFormAttendance(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Recording Link (YouTube / Audio URL)</label>
                  <input
                    type="url"
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Resolutions Summary *</label>
                  <textarea
                    required
                    rows={3}
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                    placeholder="Summary of key agreements, disputes resolved, and major demands."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Key Resolutions (One per line)</label>
                  <textarea
                    rows={3}
                    value={formKeyResolutions}
                    onChange={(e) => setFormKeyResolutions(e.target.value)}
                    placeholder="e.g. Audit of Ksh 19.6M road drainage allocation&#10;Water rationing notice enforcement"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl disabled:opacity-50"
                  >
                    {submitting ? 'Uploading...' : 'Publish Session Record'}
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
