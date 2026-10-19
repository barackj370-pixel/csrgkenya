import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Users, 
  MapPin, 
  MessageSquare, 
  Plus, 
  Settings, 
  Trash2, 
  Save, 
  Sparkles, 
  BookOpen, 
  Archive, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ExternalLink,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  getAllCarouselAds, 
  saveCarouselAd, 
  deleteCarouselAd, 
  CarouselAd,
  getBlogPosts,
  saveBlogPost,
  deleteBlogPost,
  BlogPost,
  getPastAssemblyArchives,
  savePastAssemblyArchive,
  PastAssemblyArchive
} from '../lib/civicData';
import { useAuth } from '../contexts/AuthContext';
import UpdateMiniCaucusModal from '../components/ui/UpdateMiniCaucusModal';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ads' | 'blog' | 'assemblies' | 'wards'>('ads');
  const [isMiniCaucusModalOpen, setIsMiniCaucusModalOpen] = useState(false);
  
  // Wards and stats
  const [wards, setWards] = useState<any[]>([]);
  const [stats, setStats] = useState({ wards: 0, discussions: 0, groups: 0 });
  const [isAddingWard, setIsAddingWard] = useState(false);
  const [wardFormData, setWardFormData] = useState({ name: '', slug: '', description: '' });

  // Carousel Ads state
  const [ads, setAds] = useState<CarouselAd[]>([]);
  const [isAddingAd, setIsAddingAd] = useState(false);
  const [adTitle, setAdTitle] = useState('');
  const [adSubtitle, setAdSubtitle] = useState('');
  const [adBadge, setAdBadge] = useState('Official Public Notice');
  const [adImageUrl, setAdImageUrl] = useState('');
  const [adCtaText, setAdCtaText] = useState('View Details');
  const [adCtaLink, setAdCtaLink] = useState('/national-assembly');
  const [adDaysVisible, setAdDaysVisible] = useState(7);
  const [adSubmitting, setAdSubmitting] = useState(false);

  // Blog Posts state
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isAddingBlog, setIsAddingBlog] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogCategory, setBlogCategory] = useState('Civic Rights & Constitution');
  const [blogAuthor, setBlogAuthor] = useState(user?.name || 'CSRG National Secretariat');
  const [blogAuthorRole, setBlogAuthorRole] = useState('Senior Policy Convener');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogCoverImage, setBlogCoverImage] = useState('');
  const [blogSubmitting, setBlogSubmitting] = useState(false);

  // Past Assemblies state
  const [pastSessions, setPastSessions] = useState<PastAssemblyArchive[]>([]);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionType, setSessionType] = useState<PastAssemblyArchive['assemblyType']>('National Citizen Assembly');
  const [sessionWard, setSessionWard] = useState('National Level');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionConvener, setSessionConvener] = useState(user?.name || 'National Convener');
  const [sessionAttendance, setSessionAttendance] = useState(300);
  const [sessionVideoUrl, setSessionVideoUrl] = useState('');
  const [sessionSummary, setSessionSummary] = useState('');
  const [sessionResolutions, setSessionResolutions] = useState('');
  const [sessionSubmitting, setSessionSubmitting] = useState(false);

  const fetchStatsAndData = async () => {
    try {
      const [wardsRes, discussionsRes, groupsRes, adsList, blogsList, sessionsList] = await Promise.all([
        supabase.from('Ward').select('*'),
        supabase.from('Discussion').select('*'),
        supabase.from('Group').select('*'),
        getAllCarouselAds(),
        getBlogPosts(),
        getPastAssemblyArchives()
      ]);
      
      const wardsArray = wardsRes.data || [];
      const discussionsArray = discussionsRes.data || [];
      const groupsArray = groupsRes.data || [];

      setWards(wardsArray);
      setStats({
        wards: wardsArray.length,
        discussions: discussionsArray.length,
        groups: groupsArray.length
      });

      setAds(adsList);
      setBlogs(blogsList);
      setPastSessions(sessionsList);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  useEffect(() => {
    fetchStatsAndData();
  }, []);

  // Handler for adding a Carousel Ad
  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdSubmitting(true);
    try {
      const created = await saveCarouselAd({
        title: adTitle.trim(),
        subtitle: adSubtitle.trim(),
        badge: adBadge.trim() || 'Official Notice',
        imageUrl: adImageUrl.trim() || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
        ctaText: adCtaText.trim() || 'View Details',
        ctaLink: adCtaLink.trim() || '/national-assembly',
        daysVisible: Number(adDaysVisible) || 7,
        createdBy: user?.name || 'Administrator'
      });

      setAds(prev => [created, ...prev]);
      setIsAddingAd(false);
      setAdTitle('');
      setAdSubtitle('');
      setAdImageUrl('');
    } catch (err) {
      alert('Failed to publish carousel ad.');
    } finally {
      setAdSubmitting(false);
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to remove this carousel ad?')) return;
    await deleteCarouselAd(id);
    setAds(prev => prev.filter(a => a.id !== id));
  };

  // Handler for posting a Blog article
  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlogSubmitting(true);
    try {
      const slug = blogTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const created = await saveBlogPost({
        slug,
        title: blogTitle.trim(),
        category: blogCategory,
        author: blogAuthor.trim(),
        authorRole: blogAuthorRole.trim(),
        publishedAt: new Date().toISOString().split('T')[0],
        readTime: `${Math.max(3, Math.ceil(blogContent.split(' ').length / 200))} min read`,
        excerpt: blogExcerpt.trim(),
        content: blogContent.trim(),
        coverImage: blogCoverImage.trim() || 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80',
        isFeatured: false,
        tags: [blogCategory, 'CSRG Kenya', 'Article 1']
      });

      setBlogs(prev => [created, ...prev]);
      setIsAddingBlog(false);
      setBlogTitle('');
      setBlogExcerpt('');
      setBlogContent('');
      setBlogCoverImage('');
    } catch (err) {
      alert('Failed to post article.');
    } finally {
      setBlogSubmitting(false);
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!confirm('Delete this blog article?')) return;
    await deleteBlogPost(id);
    setBlogs(prev => prev.filter(b => b.id !== id));
  };

  // Handler for uploading past assembly
  const handleUploadPastAssembly = async (e: React.FormEvent) => {
    e.preventDefault();
    setSessionSubmitting(true);
    try {
      const resList = sessionResolutions
        .split('\n')
        .map(r => r.trim())
        .filter(Boolean);

      const created = await savePastAssemblyArchive({
        title: sessionTitle.trim(),
        assemblyType: sessionType,
        wardOrLevel: sessionWard.trim(),
        sessionDate: sessionDate,
        presidingConvener: sessionConvener.trim(),
        attendanceCount: Number(sessionAttendance) || 100,
        videoUrl: sessionVideoUrl.trim() || undefined,
        resolutionsSummary: sessionSummary.trim(),
        resolutionsCount: resList.length || 5,
        keyResolutions: resList.length > 0 ? resList : ['Citizen Assembly resolutions verified']
      });

      setPastSessions(prev => [created, ...prev]);
      setIsAddingSession(false);
      setSessionTitle('');
      setSessionSummary('');
      setSessionResolutions('');
      setSessionVideoUrl('');
    } catch (err) {
      alert('Failed to save assembly record.');
    } finally {
      setSessionSubmitting(false);
    }
  };

  // Handler for Ward add/delete
  const handleAddWard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanName = wardFormData.name.trim();
      const cleanSlug = (wardFormData.slug || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).trim();

      const existing = wards.find((w: any) => 
        w.name.trim().toLowerCase() === cleanName.toLowerCase() ||
        (w.slug && w.slug.trim().toLowerCase() === cleanSlug.toLowerCase())
      );
      if (existing) {
        alert(`Ward "${existing.name}" is already registered (${existing.description || existing.county || 'Active'}). No duplicate created.`);
        setIsAddingWard(false);
        setWardFormData({ name: '', slug: '', description: '' });
        return;
      }

      const { data, error } = await supabase.from('Ward').insert([{
        ...wardFormData,
        name: cleanName,
        slug: cleanSlug
      }]).select();

      if (error) {
        alert(`Failed to add ward: ${error.message}`);
      } else {
        setIsAddingWard(false);
        setWardFormData({ name: '', slug: '', description: '' });
        fetchStatsAndData();
      }
    } catch (error) {
      console.error('Failed to add ward', error);
      alert('Failed to add ward. Please try again.');
    }
  };

  const handleDeleteWard = async (id: string) => {
    try {
      const { error } = await supabase.from('Ward').delete().eq('id', id);
      if (error) {
        alert(`Failed to delete ward: ${error.message}`);
      } else {
        fetchStatsAndData();
      }
    } catch (error) {
      console.error('Failed to delete ward', error);
      alert('Failed to delete ward. Please try again.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-stone-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-stone-900 rounded-3xl p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                Super Admin Console
              </span>
              <span className="text-xs text-stone-400">CSRG National Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">Admin Management Center</h1>
            <p className="text-stone-400 text-xs sm:text-sm mt-1">
              Manage header carousel ads, publish blog articles, upload past assemblies, and oversee nationwide wards.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('ads')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ads' ? 'bg-amber-400 text-stone-950 shadow' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
              Carousel Ads ({ads.filter(a => !a.isExpired).length})
            </button>
            <button
              onClick={() => setActiveTab('blog')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'blog' ? 'bg-sky-400 text-stone-950 shadow' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 inline mr-1.5" />
              Blog Articles ({blogs.length})
            </button>
            <button
              onClick={() => setActiveTab('assemblies')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'assemblies' ? 'bg-purple-400 text-stone-950 shadow' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <Archive className="w-3.5 h-3.5 inline mr-1.5" />
              Past Assemblies ({pastSessions.length})
            </button>
            <button
              onClick={() => setActiveTab('wards')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'wards' ? 'bg-white text-stone-950 shadow' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 inline mr-1.5" />
              Wards ({stats.wards})
            </button>
            <button
              onClick={() => setIsMiniCaucusModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Mini-Caucuses (Carousel 1)</span>
            </button>
          </div>
        </div>

        {/* ==================================================== */}
        {/* TAB 1: HEADER CAROUSEL ADS MANAGER */}
        {/* ==================================================== */}
        {activeTab === 'ads' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-amber-500" />
                    Header Carousel Advertisements & Notices
                  </h2>
                  <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-2xl">
                    Post custom announcements in the header carousel. <strong>Ads appear first in the carousel, followed by the default 2 slides.</strong> Once the stated number of days elapses, the ad disappears automatically.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingAd(true)}
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black px-5 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-md cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Header Carousel Ad</span>
                </button>
              </div>

              {/* Ads Table / Cards */}
              <div className="pt-6 space-y-4">
                {ads.length === 0 ? (
                  <div className="py-12 text-center text-stone-400 text-xs">
                    No active carousel ads. Click "Create Header Carousel Ad" to publish one.
                  </div>
                ) : (
                  ads.map(ad => (
                    <div 
                      key={ad.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        ad.isExpired
                          ? 'bg-stone-50 border-stone-200 opacity-60'
                          : 'bg-white border-amber-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <img 
                          src={ad.imageUrl || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=400&q=80'} 
                          alt={ad.title} 
                          className="w-20 h-20 rounded-xl object-cover shrink-0 border border-stone-200"
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                              {ad.badge || 'Official Notice'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              ad.isExpired ? 'bg-stone-200 text-stone-600' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {ad.isExpired ? 'Expired' : `${ad.daysLeft} days left (Visible: ${ad.daysVisible}d)`}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-stone-900 leading-snug">
                            {ad.title}
                          </h3>
                          <p className="text-xs text-stone-500 line-clamp-2 mt-0.5">
                            {ad.subtitle}
                          </p>
                          <div className="text-[11px] text-stone-400 mt-1">
                            CTA: <strong>{ad.ctaText}</strong> → {ad.ctaLink}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleDeleteAd(ad.id)}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete Ad"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: BLOG ARTICLES MANAGER */}
        {/* ==================================================== */}
        {activeTab === 'blog' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-sky-600" />
                    Civic Intelligence Blog & Articles Editor
                  </h2>
                  <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-2xl">
                    Publish direct policy articles, agroecology reports, and legal explainers directly onto the public <strong>/blog</strong> portal.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingBlog(true)}
                  className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-md cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Write New Blog Article</span>
                </button>
              </div>

              <div className="pt-6 space-y-4">
                {blogs.length === 0 ? (
                  <div className="py-12 text-center text-stone-400 text-xs">
                    No blog articles published yet. Click "Write New Blog Article" to create one.
                  </div>
                ) : (
                  blogs.map(post => (
                    <div key={post.id} className="p-5 rounded-2xl border border-stone-200 bg-white flex items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-start gap-4">
                        {post.coverImage && (
                          <img src={post.coverImage} alt={post.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-2 text-[11px] text-stone-400 mb-1">
                            <span className="font-bold text-sky-800">{post.category}</span>
                            <span>·</span>
                            <span>{post.publishedAt}</span>
                            <span>·</span>
                            <span>By {post.author}</span>
                          </div>
                          <h3 className="text-base font-bold text-stone-900">{post.title}</h3>
                          <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{post.excerpt}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a 
                          href={`/blog#${post.slug}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 text-stone-400 hover:text-sky-700 hover:bg-sky-50 rounded-xl"
                          title="View Live"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteBlog(post.id)}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"
                          title="Delete Article"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: PAST ASSEMBLIES MANAGER */}
        {/* ==================================================== */}
        {activeTab === 'assemblies' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-2">
                    <Archive className="w-6 h-6 text-purple-600" />
                    Past Assembly Proceedings & Follow-Up Archive
                  </h2>
                  <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-2xl">
                    Upload official session minutes, video recordings, and adopted resolutions matrices for citizen follow-up.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingSession(true)}
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-md cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Assembly Record</span>
                </button>
              </div>

              <div className="pt-6 space-y-4">
                {pastSessions.length === 0 ? (
                  <div className="py-12 text-center text-stone-400 text-xs">
                    No past assembly recordings uploaded yet. Click "Upload Assembly Record" to archive one.
                  </div>
                ) : (
                  pastSessions.map(sess => (
                    <div key={sess.id} className="p-5 rounded-2xl border border-stone-200 bg-white flex items-center justify-between gap-4 shadow-sm">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-stone-400 mb-1">
                          <span className="font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md">{sess.assemblyType}</span>
                          <span>·</span>
                          <span>{sess.sessionDate}</span>
                          <span>·</span>
                          <span>{sess.wardOrLevel}</span>
                        </div>
                        <h3 className="text-base font-bold text-stone-900">{sess.title}</h3>
                        <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{sess.resolutionsSummary}</p>
                        <div className="text-[11px] text-stone-400 mt-1">
                          {sess.resolutionsCount} Resolutions · {sess.attendanceCount} Attendees · Convener: {sess.presidingConvener}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: WARDS & OVERVIEW */}
        {/* ==================================================== */}
        {activeTab === 'wards' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-stone-900">Registered Electoral Wards ({wards.length})</h2>
                <p className="text-xs text-stone-500">Active ward assembly walls across Kenya</p>
              </div>
              <button
                onClick={() => setIsAddingWard(true)}
                className="bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add New Ward
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wards.map((ward) => (
                <div key={ward.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-stone-900">{ward.name} Ward</h3>
                    <p className="text-xs text-stone-500 mt-1">{ward.description || 'Kenyan Electoral Ward'}</p>
                    <div className="text-[11px] text-stone-400 mt-2 font-mono">slug: /ward/{ward.slug}</div>
                    <div className="mt-3 pt-2.5 border-t border-stone-100">
                      <Link
                        to={`/ward/${ward.slug}#ward-documents`}
                        className="text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-1"
                      >
                        <span>Post / Upload Resolutions →</span>
                      </Link>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteWard(ward.id)}
                    className="text-stone-400 hover:text-red-600 p-1 rounded-lg"
                    title="Delete Ward"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MODAL: CREATE CAROUSEL AD */}
        {/* ==================================================== */}
        <AnimatePresence>
          {isAddingAd && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 sm:p-8"
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">Create Header Carousel Ad</h3>
                    <p className="text-xs text-stone-500">Appears first in the carousel, auto-disappears after set days</p>
                  </div>
                  <button onClick={() => setIsAddingAd(false)} className="text-stone-400 hover:text-stone-700">✕</button>
                </div>

                <form onSubmit={handleCreateAd} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Headline / Ad Title *</label>
                    <input
                      type="text"
                      required
                      value={adTitle}
                      onChange={(e) => setAdTitle(e.target.value)}
                      placeholder="e.g. National Peoples Budget & CADP Submission 2026/27"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Subtitle / Pitch Description *</label>
                    <textarea
                      required
                      rows={3}
                      value={adSubtitle}
                      onChange={(e) => setAdSubtitle(e.target.value)}
                      placeholder="Brief summary explaining why wananchi should pay attention or take action."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none text-stone-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Badge Tag</label>
                      <input
                        type="text"
                        value={adBadge}
                        onChange={(e) => setAdBadge(e.target.value)}
                        placeholder="e.g. Official Public Notice"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Days Visible (Auto-Disappears) *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        required
                        value={adDaysVisible}
                        onChange={(e) => setAdDaysVisible(Number(e.target.value))}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none text-stone-900 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">CTA Button Text</label>
                      <input
                        type="text"
                        value={adCtaText}
                        onChange={(e) => setAdCtaText(e.target.value)}
                        placeholder="e.g. View Budget Briefs"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">CTA Target Link</label>
                      <input
                        type="text"
                        value={adCtaLink}
                        onChange={(e) => setAdCtaLink(e.target.value)}
                        placeholder="/national-assembly or /register"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none text-stone-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Banner Image URL</label>
                    <input
                      type="url"
                      value={adImageUrl}
                      onChange={(e) => setAdImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none text-stone-900"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setIsAddingAd(false)}
                      className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={adSubmitting}
                      className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl disabled:opacity-50"
                    >
                      {adSubmitting ? 'Publishing...' : 'Publish to Carousel'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ==================================================== */}
        {/* MODAL: WRITE BLOG ARTICLE */}
        {/* ==================================================== */}
        <AnimatePresence>
          {isAddingBlog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 sm:p-8"
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">Write New Civic Article</h3>
                    <p className="text-xs text-stone-500">Publish directly to the public /blog portal</p>
                  </div>
                  <button onClick={() => setIsAddingBlog(false)} className="text-stone-400 hover:text-stone-700">✕</button>
                </div>

                <form onSubmit={handleCreateBlog} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Article Headline *</label>
                    <input
                      type="text"
                      required
                      value={blogTitle}
                      onChange={(e) => setBlogTitle(e.target.value)}
                      placeholder="e.g. Article 1 of Kenya 2010: How Citizen Assemblies Reclaim Sovereign Power"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Category *</label>
                      <select
                        value={blogCategory}
                        onChange={(e) => setBlogCategory(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-800"
                      >
                        <option value="Civic Rights & Constitution">Civic Rights & Constitution</option>
                        <option value="Agroecology & Food Sovereignty">Agroecology & Food Sovereignty</option>
                        <option value="Devolution & Budget Watch">Devolution & Budget Watch</option>
                        <option value="Assembly Resolutions">Assembly Resolutions</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Author Name *</label>
                      <input
                        type="text"
                        required
                        value={blogAuthor}
                        onChange={(e) => setBlogAuthor(e.target.value)}
                        placeholder="e.g. Secretariat Convener / Official"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Summary / Excerpt (1-2 sentences) *</label>
                    <textarea
                      required
                      rows={2}
                      value={blogExcerpt}
                      onChange={(e) => setBlogExcerpt(e.target.value)}
                      placeholder="Concise hook for readers in article listings."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Full Article Body *</label>
                    <textarea
                      required
                      rows={8}
                      value={blogContent}
                      onChange={(e) => setBlogContent(e.target.value)}
                      placeholder="Write your full article text. Paragraphs and line breaks are preserved."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900 font-serif leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Cover Image URL</label>
                    <input
                      type="url"
                      value={blogCoverImage}
                      onChange={(e) => setBlogCoverImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setIsAddingBlog(false)}
                      className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={blogSubmitting}
                      className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl disabled:opacity-50"
                    >
                      {blogSubmitting ? 'Publishing...' : 'Publish Article'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ==================================================== */}
        {/* MODAL: UPLOAD PAST ASSEMBLY SESSION */}
        {/* ==================================================== */}
        <AnimatePresence>
          {isAddingSession && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 sm:p-8"
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                  <h3 className="text-xl font-bold text-stone-900">Upload Past Assembly Session</h3>
                  <button onClick={() => setIsAddingSession(false)} className="text-stone-400 hover:text-stone-700">✕</button>
                </div>

                <form onSubmit={handleUploadPastAssembly} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Session Title *</label>
                    <input
                      type="text"
                      required
                      value={sessionTitle}
                      onChange={(e) => setSessionTitle(e.target.value)}
                      placeholder="e.g. Kangemi Ward Citizen Assembly Q4 2025"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-purple-600 outline-none text-stone-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Type *</label>
                      <select
                        value={sessionType}
                        onChange={(e: any) => setSessionType(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-purple-600 outline-none text-stone-800"
                      >
                        <option value="National Citizen Assembly">National Citizen Assembly</option>
                        <option value="Ward Citizen Assembly">Ward Citizen Assembly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Ward or Level</label>
                      <input
                        type="text"
                        value={sessionWard}
                        onChange={(e) => setSessionWard(e.target.value)}
                        placeholder="e.g. National Level or Karura Ward"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-purple-600 outline-none text-stone-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Session Date *</label>
                      <input
                        type="date"
                        required
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-purple-600 outline-none text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Attendance Count</label>
                      <input
                        type="number"
                        value={sessionAttendance}
                        onChange={(e) => setSessionAttendance(Number(e.target.value))}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-purple-600 outline-none text-stone-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Recording URL (YouTube / Audio Link)</label>
                    <input
                      type="url"
                      value={sessionVideoUrl}
                      onChange={(e) => setSessionVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-purple-600 outline-none text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Resolutions Summary *</label>
                    <textarea
                      required
                      rows={3}
                      value={sessionSummary}
                      onChange={(e) => setSessionSummary(e.target.value)}
                      placeholder="Summary of passed resolutions and agreements."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-purple-600 outline-none text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Key Resolutions (One per line)</label>
                    <textarea
                      rows={3}
                      value={sessionResolutions}
                      onChange={(e) => setSessionResolutions(e.target.value)}
                      placeholder="Resolution 1&#10;Resolution 2"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-purple-600 outline-none text-stone-900"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setIsAddingSession(false)}
                      className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sessionSubmitting}
                      className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl disabled:opacity-50"
                    >
                      {sessionSubmitting ? 'Uploading...' : 'Publish Archive'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Add Ward */}
        <AnimatePresence>
          {isAddingWard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200"
              >
                <h3 className="text-lg font-bold text-stone-900 mb-4">Add Electoral Ward</h3>
                <form onSubmit={handleAddWard} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Ward Name *</label>
                    <input
                      type="text"
                      required
                      value={wardFormData.name}
                      onChange={(e) => setWardFormData({ ...wardFormData, name: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">URL Slug *</label>
                    <input
                      type="text"
                      required
                      value={wardFormData.slug}
                      onChange={(e) => setWardFormData({ ...wardFormData, slug: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Description</label>
                    <textarea
                      value={wardFormData.description}
                      onChange={(e) => setWardFormData({ ...wardFormData, description: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingWard(false)}
                      className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold bg-stone-900 text-white rounded-xl"
                    >
                      Save Ward
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>

      <UpdateMiniCaucusModal
        isOpen={isMiniCaucusModalOpen}
        onClose={() => setIsMiniCaucusModalOpen(false)}
      />
    </motion.div>
  );
}
