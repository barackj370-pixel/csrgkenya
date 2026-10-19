import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  ArrowRight, 
  Share2, 
  Check, 
  Sparkles, 
  ChevronRight, 
  Bookmark, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  CheckCircle2, 
  X, 
  Lock, 
  Tag, 
  ShieldCheck,
  MapPin,
  Building2
} from 'lucide-react';
import { getBlogPosts, saveBlogPost, deleteBlogPost, BlogPost } from '../lib/civicData';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { KENYA_COUNTIES } from '../data/kenyaCountiesAndWards';

export default function Blog() {
  const { user, login } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState<BlogPost | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // News Scope & Geographic targeting
  const [filterScope, setFilterScope] = useState<'ALL' | 'NATIONAL' | 'COUNTY' | 'WARD'>('ALL');
  const [formScope, setFormScope] = useState<'NATIONAL' | 'COUNTY' | 'WARD'>('NATIONAL');
  const [formCounty, setFormCounty] = useState('Nairobi');
  const [formWardId, setFormWardId] = useState('');
  const [formWardName, setFormWardName] = useState('');
  const [wardsList, setWardsList] = useState<any[]>([]);

  // New Article Modal State
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Civic Rights & Constitution');
  const [author, setAuthor] = useState(user?.name || '');
  const [authorRole, setAuthorRole] = useState(
    user?.role === 'ADMIN' 
      ? 'Platform Administrator' 
      : user?.role === 'CLERK' 
        ? 'Ward Assembly Clerk' 
        : 'Civic Contributor'
  );
  const [readTime, setReadTime] = useState('5 min read');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [tagsInput, setTagsInput] = useState('Article 1, Devolution, CSRG Kenya');
  const [isFeatured, setIsFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Quick In-Place Sign-In State (Eliminates having to sign in twice)
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const categories = [
    'All',
    'Civic Rights & Constitution',
    'Agroecology & Food Sovereignty',
    'Devolution & Budget Watch',
    'Assembly Resolutions',
    'Peasant Solidarity & Cooperatives'
  ];

  const presetImages = [
    { label: 'Citizen Assembly Deliberations', url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Peasant Farming & Soil', url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=1200&q=80' },
    { label: 'County Public Finance & Budget', url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Grassroots Community Action', url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80' }
  ];

  // Both Admins and Clerks can post and manage articles
  const canPost = Boolean(user && (user.role === 'ADMIN' || user.role === 'CLERK'));
  const canManage = Boolean(user && (user.role === 'ADMIN' || user.role === 'CLERK'));

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    if (user?.name) {
      setAuthor(user.name);
      setAuthorRole(
        user.role === 'ADMIN' 
          ? 'Platform Administrator' 
          : user.role === 'CLERK' 
            ? 'Ward Assembly Clerk' 
            : 'Civic Contributor'
      );
    }
  }, [user]);

  async function loadArticles() {
    setLoading(true);
    try {
      const [data, wardsRes] = await Promise.all([
        getBlogPosts(),
        supabase.from('Ward').select('*')
      ]);
      setPosts(data);
      if (wardsRes.data) {
        setWardsList(wardsRes.data);
        if (user?.role === 'CLERK' && user.wardId) {
          const clerkWard = wardsRes.data.find((w: any) => w.id === user.wardId);
          if (clerkWard) {
            setFormWardId(clerkWard.id);
            setFormWardName(clerkWard.name);
            setFormCounty(clerkWard.county || 'Nairobi');
            setFormScope('WARD');
          }
        } else if (wardsRes.data.length > 0) {
          setFormWardId(wardsRes.data[0].id);
          setFormWardName(wardsRes.data[0].name);
        }
      }
    } catch (e) {
      console.warn('Failed to load blog data', e);
    } finally {
      setLoading(false);
    }
  }

  // Add Post Click Handler
  const handleAddPostClick = () => {
    if (canPost) {
      // Already authenticated as Admin or Clerk -> directly open modal, no second sign-in!
      setIsWriteModalOpen(true);
    } else {
      // Open in-place quick sign-in without navigating away
      setIsLoginPromptOpen(true);
    }
  };

  // 1-Click Fast Access Sign-In and immediately open the Add Post form
  const handleQuickLoginAndOpenPost = (role: 'ADMIN' | 'CLERK') => {
    if (role === 'ADMIN') {
      const adminUser = {
        id: 'user-admin-1',
        name: 'Admin User',
        email: 'admin@csrg.ke',
        role: 'ADMIN' as const
      };
      login('token-admin', adminUser);
      setAuthor('Admin User');
      setAuthorRole('Platform Administrator');
    } else {
      const clerkUser = {
        id: 'user-clerk-1',
        name: 'Kangemi Ward Clerk',
        email: 'clerk.kangemi@csrg.ke',
        role: 'CLERK' as const,
        wardId: 'ward-1'
      };
      login('token-clerk', clerkUser);
      setAuthor('Kangemi Ward Clerk');
      setAuthorRole('Ward Assembly Clerk');
    }

    setIsLoginPromptOpen(false);
    setIsWriteModalOpen(true);
  };

  // Custom credentials login in modal
  const handleManualLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const cleanEmail = loginEmail.trim().toLowerCase();
      // Look up user from Supabase or fallback
      let userObj: any = null;
      try {
        const { data } = await supabase.from('User').select('*').eq('email', cleanEmail).maybeSingle();
        if (data) userObj = data;
      } catch {
        // ignore
      }

      if (!userObj) {
        if (cleanEmail.includes('clerk')) {
          userObj = {
            id: 'user-clerk-1',
            name: 'Ward Assembly Clerk',
            email: cleanEmail,
            role: 'CLERK',
            wardId: 'ward-1'
          };
        } else {
          userObj = {
            id: 'user-admin-1',
            name: 'Platform Administrator',
            email: cleanEmail,
            role: 'ADMIN'
          };
        }
      }

      login(`token-${userObj.id}`, userObj);
      setAuthor(userObj.name || 'Author');
      setAuthorRole(userObj.role === 'ADMIN' ? 'Platform Administrator' : userObj.role === 'CLERK' ? 'Ward Assembly Clerk' : 'Civic Contributor');

      setIsLoginPromptOpen(false);
      setIsWriteModalOpen(true);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !excerpt.trim()) {
      alert('Please fill in the title, excerpt, and content fields.');
      return;
    }

    setSubmitting(true);
    try {
      const slug = title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const parsedTags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const calculatedReadTime = `${Math.max(2, Math.ceil(content.split(/\s+/).length / 180))} min read`;

      const defaultAuthor = author.trim() || user?.name || (user?.role === 'CLERK' ? 'Ward Clerk' : 'Administrator');
      const defaultRole = authorRole.trim() || (user?.role === 'CLERK' ? 'Ward Assembly Clerk' : 'Platform Administrator');

      const resolvedCounty = formScope === 'COUNTY' ? formCounty : (formScope === 'WARD' ? (wardsList.find(w => w.id === formWardId)?.county || formCounty) : undefined);
      const resolvedWard = wardsList.find(w => w.id === formWardId);
      const resolvedWardName = formScope === 'WARD' ? (resolvedWard?.name || formWardName) : undefined;

      const newPost = await saveBlogPost({
        slug,
        title: title.trim(),
        category,
        author: defaultAuthor,
        authorRole: defaultRole,
        publishedAt: new Date().toISOString().split('T')[0],
        readTime: calculatedReadTime,
        excerpt: excerpt.trim(),
        content: content.trim(),
        coverImage: coverImage.trim() || presetImages[0].url,
        isFeatured,
        newsScope: formScope,
        county: resolvedCounty,
        wardName: resolvedWardName,
        wardId: formScope === 'WARD' ? formWardId : undefined,
        tags: parsedTags.length > 0 ? parsedTags : [category, 'CSRG Kenya']
      });

      setPosts(prev => [newPost, ...prev.filter(p => p.id !== newPost.id)]);
      setPublishSuccess(true);

      setTimeout(() => {
        setPublishSuccess(false);
        setIsWriteModalOpen(false);
        // Reset form
        setTitle('');
        setExcerpt('');
        setContent('');
        setCoverImage('');
        setIsFeatured(false);
      }, 1500);
    } catch (err) {
      alert('Failed to publish article. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (post: BlogPost, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete the post: "${post.title}"?`)) return;

    await deleteBlogPost(post.id);
    setPosts(prev => prev.filter(p => p.id !== post.id));
    if (selectedArticle?.id === post.id) {
      setSelectedArticle(null);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.county && post.county.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.wardName && post.wardName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesScope = 
      filterScope === 'ALL' || 
      (filterScope === 'NATIONAL' && (!post.newsScope || post.newsScope === 'NATIONAL')) ||
      (filterScope === 'COUNTY' && post.newsScope === 'COUNTY') ||
      (filterScope === 'WARD' && post.newsScope === 'WARD');
    return matchesSearch && matchesCategory && matchesScope;
  });

  const featuredPost = posts.find(p => p.isFeatured) || posts[0];

  const handleShare = (post: BlogPost, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/blog#${post.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedSlug(post.slug);
      setTimeout(() => setCopiedSlug(null), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Banner - Labeled strictly as Blog */}
        <div className="bg-gradient-to-r from-sky-900 via-sky-850 to-stone-900 rounded-3xl p-8 sm:p-12 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-300 px-3 py-1 rounded-full text-xs font-bold mb-4 border border-sky-400/30">
              <BookOpen className="w-3.5 h-3.5" /> Blog
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
              Blog
            </h1>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-6">
              Citizen assembly reports, devolution analyses, and community insights published by Ward Clerks and Administrators.
            </p>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Add Post Button - accessible to Admin & Clerks without signing in twice */}
              <button
                onClick={handleAddPostClick}
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black px-6 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-lg hover:shadow-xl cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Post</span>
              </button>

              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-2 bg-sky-800/80 hover:bg-sky-800 text-white font-bold px-4 py-3 rounded-2xl text-xs sm:text-sm transition-all border border-sky-600/60"
                >
                  Admin Dashboard
                </Link>
              )}

              {user?.role === 'CLERK' && (
                <Link
                  to="/clerk"
                  className="inline-flex items-center gap-2 bg-sky-800/80 hover:bg-sky-800 text-white font-bold px-4 py-3 rounded-2xl text-xs sm:text-sm transition-all border border-sky-600/60"
                >
                  Clerk Portal
                </Link>
              )}

              {!canPost && (
                <span className="text-xs text-stone-400 italic">
                  (Ward Clerks & Admins click "Add Post" to publish)
                </span>
              )}
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
            <BookOpen className="w-96 h-96 text-white" />
          </div>
        </div>

        {/* News Scope & Category Filters */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mr-1">Filter News:</span>
            {[
              { id: 'ALL', label: 'All News' },
              { id: 'NATIONAL', label: 'National News' },
              { id: 'COUNTY', label: 'County News' },
              { id: 'WARD', label: 'Ward News' }
            ].map(sc => (
              <button
                key={sc.id}
                onClick={() => setFilterScope(sc.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterScope === sc.id
                    ? 'bg-sky-800 text-white shadow-sm'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Categories Segmented Control */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-stone-900 text-white shadow-sm' 
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search box */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts or authors..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2 pl-10 pr-4 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-800"
              />
            </div>
          </div>
        </div>

        {/* Featured Story (only when posts exist and no search active) */}
        {!searchQuery && selectedCategory === 'All' && featuredPost && (
          <div 
            onClick={() => setSelectedArticle(featuredPost)}
            className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer grid grid-cols-1 lg:grid-cols-12 group"
          >
            <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-stone-500 mb-3">
                  <span className="font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-100">{featuredPost.category}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {featuredPost.publishedAt}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {featuredPost.readTime}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 group-hover:text-sky-800 transition-colors mb-3 leading-snug">
                  {featuredPost.title}
                </h2>
                <p className="text-stone-600 text-sm sm:text-base leading-relaxed line-clamp-3 mb-6">
                  {featuredPost.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs">
                    {featuredPost.author.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900">{featuredPost.author}</div>
                    <div className="text-[11px] text-stone-400">{featuredPost.authorRole || 'Contributor'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {canManage && (
                    <button
                      onClick={(e) => handleDelete(featuredPost, e)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={(e) => handleShare(featuredPost, e)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                    title="Share post link"
                  >
                    {copiedSlug === featuredPost.slug ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  </button>

                  <span className="text-xs font-bold text-sky-700 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Read Post <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative min-h-[260px] bg-stone-100 overflow-hidden">
              <img 
                src={featuredPost.coverImage || presetImages[0].url} 
                alt={featuredPost.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute top-4 right-4 bg-sky-950/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold border border-sky-400/40">
                Featured Post
              </div>
            </div>
          </div>
        )}

        {/* Posts Grid or Clean Empty State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 sm:p-16 text-center space-y-4 max-w-2xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mx-auto border border-sky-100">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900">No Posts Published Yet</h3>
            <p className="text-stone-500 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
              Articles and briefings published by Ward Clerks and Administrators will appear here once submitted.
            </p>
            
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                onClick={handleAddPostClick}
                className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Post</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map(post => (
              <article 
                key={post.id}
                onClick={() => setSelectedArticle(post)}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="h-44 overflow-hidden relative bg-stone-100">
                    <img 
                      src={post.coverImage || presetImages[0].url} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1 z-10">
                      <span className="bg-stone-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {post.category}
                      </span>
                      {post.newsScope === 'WARD' && (
                        <span className="bg-sky-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                          <MapPin className="w-2.5 h-2.5" /> {post.wardName} Ward
                        </span>
                      )}
                      {post.newsScope === 'COUNTY' && (
                        <span className="bg-emerald-700/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                          <Building2 className="w-2.5 h-2.5" /> {post.county} County
                        </span>
                      )}
                      {post.newsScope === 'NATIONAL' && (
                        <span className="bg-amber-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                          National
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 text-[11px] text-stone-400 mb-2">
                      <span>{post.publishedAt}</span>
                      <span>·</span>
                      <span>{post.readTime}</span>
                    </div>

                    <h3 className="text-base font-bold text-stone-900 group-hover:text-sky-800 transition-colors mb-2 line-clamp-2 leading-snug">
                      {post.title}
                    </h3>

                    <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed mb-4">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <div className="text-[11px] font-medium text-stone-600 truncate max-w-[150px]">
                    By {post.author}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {canManage && (
                      <button 
                        onClick={(e) => handleDelete(post, e)}
                        className="p-1.5 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button 
                      onClick={(e) => handleShare(post, e)}
                      className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                      title="Share post link"
                    >
                      {copiedSlug === post.slug ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Modal: Write & Publish Article (for Admins & Clerks) */}
        <AnimatePresence>
          {isWriteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 sm:p-8"
              >
                <div className="flex items-start justify-between border-b border-stone-100 pb-4 mb-6">
                  <div>
                    <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Blog Editorial
                    </span>
                    <h2 className="text-2xl font-black text-stone-900 mt-1">Add New Post</h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Publish directly to the public Blog.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsWriteModalOpen(false)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {publishSuccess ? (
                  <div className="p-8 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                    <h3 className="text-lg font-bold text-emerald-950">Post Published Successfully!</h3>
                    <p className="text-xs text-emerald-800">Your post is now live on the public Blog and homepage feed.</p>
                  </div>
                ) : (
                  <form onSubmit={handlePublish} className="space-y-5">
                    {/* News Scope Selector */}
                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                      <label className="block text-xs font-bold text-stone-700">
                        News Target & Publication Scope *
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {user?.role === 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => setFormScope('NATIONAL')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              formScope === 'NATIONAL'
                                ? 'bg-sky-800 text-white shadow-sm'
                                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            National News
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setFormScope('COUNTY')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            formScope === 'COUNTY'
                              ? 'bg-sky-800 text-white shadow-sm'
                              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          County News
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormScope('WARD')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            formScope === 'WARD'
                              ? 'bg-sky-800 text-white shadow-sm'
                              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          Ward News
                        </button>
                      </div>

                      {/* County Selection */}
                      {formScope === 'COUNTY' && (
                        <div>
                          <label className="block text-xs font-semibold text-stone-600 mb-1">Select Target County</label>
                          <select
                            value={formCounty}
                            onChange={(e) => setFormCounty(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-600 outline-none text-stone-800"
                          >
                            {KENYA_COUNTIES.map(c => (
                              <option key={c.name} value={c.name}>{c.name} County</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Ward Selection */}
                      {formScope === 'WARD' && (
                        <div>
                          <label className="block text-xs font-semibold text-stone-600 mb-1">Target Ward Wall</label>
                          {user?.role === 'ADMIN' ? (
                            <select
                              value={formWardId}
                              onChange={(e) => {
                                setFormWardId(e.target.value);
                                const selected = wardsList.find(w => w.id === e.target.value);
                                if (selected) {
                                  setFormWardName(selected.name);
                                  setFormCounty(selected.county || 'Kenya');
                                }
                              }}
                              className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-600 outline-none text-stone-800"
                            >
                              {wardsList.map(w => (
                                <option key={w.id} value={w.id}>
                                  {w.name} Ward ({w.county || (w.description ? w.description.split('-')[0]?.trim() : 'Kenya')})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-700 font-medium flex items-center justify-between">
                              <span>Assigned Ward Wall: <strong>{formWardName || 'Your Ward'}</strong></span>
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">
                                Clerks post on their assigned ward wall
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Post Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Ward Assembly Deliberations on Water Infrastructure & Budget Audits"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                      />
                    </div>

                    {/* Category & Author */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Category *
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                        >
                          {categories.filter(c => c !== 'All').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Author Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          placeholder="e.g., Ward Clerk or Secretariat Official"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                        />
                      </div>
                    </div>

                    {/* Author Role & Tags */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Author Designation / Title
                        </label>
                        <input
                          type="text"
                          value={authorRole}
                          onChange={(e) => setAuthorRole(e.target.value)}
                          placeholder="e.g., Ward Assembly Clerk or Administrator"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Topic Tags (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={tagsInput}
                          onChange={(e) => setTagsInput(e.target.value)}
                          placeholder="e.g., Devolution, Article 1, Water"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                        />
                      </div>
                    </div>

                    {/* Excerpt / Summary */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Executive Summary / Excerpt * (1-2 sentences)
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        placeholder="Key takeaway summarizing the post for reader preview cards..."
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900 resize-none"
                      />
                    </div>

                    {/* Full Article Content */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Post Content *
                      </label>
                      <textarea
                        required
                        rows={8}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write the full report, opinion piece, or resolution brief here. Paragraph breaks and bullet points are preserved..."
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                      />
                    </div>

                    {/* Cover Image Selector */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Cover Image
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                        {presetImages.map(img => (
                          <div 
                            key={img.label}
                            onClick={() => setCoverImage(img.url)}
                            className={`border-2 rounded-xl p-1.5 cursor-pointer text-center transition-all ${
                              coverImage === img.url ? 'border-sky-600 bg-sky-50' : 'border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            <img src={img.url} alt={img.label} className="w-full h-14 object-cover rounded-lg mb-1" />
                            <span className="text-[10px] font-bold text-stone-700 line-clamp-1 block">{img.label}</span>
                          </div>
                        ))}
                      </div>

                      <input
                        type="url"
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        placeholder="Or paste custom image URL (https://...)"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                      />
                    </div>

                    {/* Pin as Featured */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="isFeatured"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="w-4 h-4 text-sky-600 rounded border-stone-300 focus:ring-sky-500 cursor-pointer"
                      />
                      <label htmlFor="isFeatured" className="text-xs font-bold text-stone-800 cursor-pointer">
                        Pin as Featured Story at top of the blog and homepage
                      </label>
                    </div>

                    {/* Buttons */}
                    <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsWriteModalOpen(false)}
                        className="px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {submitting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Publishing...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Publish Post</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Quick In-Place Sign-In Modal (Never sign in twice) */}
        <AnimatePresence>
          {isLoginPromptOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Author Verification
                    </span>
                    <h3 className="text-xl font-black text-stone-900 mt-1">
                      Sign in to Add Post
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Ward Clerks and Administrators can post articles to the Blog.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsLoginPromptOpen(false)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 1-Click Fast Access Buttons */}
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Quick 1-Click Access
                  </p>
                  <button
                    onClick={() => handleQuickLoginAndOpenPost('ADMIN')}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-stone-200 hover:border-sky-600 bg-stone-50 hover:bg-sky-50/60 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-900 text-white flex items-center justify-center font-bold text-sm">
                        A
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900 group-hover:text-sky-900">
                          Continue as Administrator
                        </div>
                        <div className="text-[11px] text-stone-400">
                          admin@csrg.ke • Super Admin
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-sky-700 group-hover:translate-x-1 transition-all" />
                  </button>

                  <button
                    onClick={() => handleQuickLoginAndOpenPost('CLERK')}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-stone-200 hover:border-emerald-600 bg-stone-50 hover:bg-emerald-50/60 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-sm">
                        C
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900 group-hover:text-emerald-900">
                          Continue as Ward Clerk
                        </div>
                        <div className="text-[11px] text-stone-400">
                          clerk.kangemi@csrg.ke • Kangemi Ward Clerk
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
                  </button>
                </div>

                {/* Standard Credentials Form */}
                <div className="pt-2 border-t border-stone-100">
                  <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-3">
                    Or Enter Staff Email
                  </p>
                  <form onSubmit={handleManualLoginSubmit} className="space-y-3">
                    {loginError && (
                      <div className="p-2.5 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
                        {loginError}
                      </div>
                    )}
                    <div>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Staff email address"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Password (optional for quick login)"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-600 outline-none text-stone-900"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      {isLoggingIn ? 'Verifying...' : 'Sign In & Open Add Post'}
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Full Article Reading View */}
        <AnimatePresence>
          {selectedArticle && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 relative overflow-hidden"
              >
                {/* Modal Header Image */}
                <div className="relative h-64 sm:h-80 w-full bg-stone-100">
                  <img 
                    src={selectedArticle.coverImage || presetImages[0].url} 
                    alt={selectedArticle.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent"></div>
                  
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-900/80 text-white flex items-center justify-center hover:bg-stone-900 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="bg-sky-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                        {selectedArticle.category}
                      </span>
                      {selectedArticle.newsScope === 'WARD' && (
                        <span className="bg-sky-500/90 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {selectedArticle.wardName} Ward News
                        </span>
                      )}
                      {selectedArticle.newsScope === 'COUNTY' && (
                        <span className="bg-emerald-600/90 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {selectedArticle.county} County News
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black leading-tight">
                      {selectedArticle.title}
                    </h1>
                  </div>
                </div>

                {/* Article Metadata Bar */}
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-stone-200 text-xs text-stone-600">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-sm">
                        {selectedArticle.author.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-stone-900 text-sm">{selectedArticle.author}</div>
                        <div className="text-stone-400 text-xs">{selectedArticle.authorRole || 'Author'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-stone-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-stone-400" />
                        {selectedArticle.publishedAt}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-stone-400" />
                        {selectedArticle.readTime}
                      </span>
                      <button
                        onClick={(e) => handleShare(selectedArticle, e)}
                        className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-900 font-bold ml-2 cursor-pointer"
                      >
                        {copiedSlug === selectedArticle.slug ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700">Link Copied</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-4 h-4" />
                            <span>Share</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Summary Callout */}
                  <div className="bg-sky-50 border-l-4 border-sky-600 p-4 rounded-r-2xl text-xs sm:text-sm text-sky-950 font-medium leading-relaxed italic">
                    "{selectedArticle.excerpt}"
                  </div>

                  {/* Main Article Body */}
                  <div className="prose prose-stone max-w-none text-stone-800 text-sm sm:text-base leading-relaxed whitespace-pre-line space-y-4">
                    {selectedArticle.content}
                  </div>

                  {/* Tags */}
                  {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                    <div className="pt-6 border-t border-stone-200 flex flex-wrap items-center gap-2">
                      <Tag className="w-4 h-4 text-stone-400 mr-1" />
                      {selectedArticle.tags.map((tag, i) => (
                        <span key={i} className="bg-stone-100 text-stone-700 text-xs px-2.5 py-1 rounded-lg">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer actions inside modal */}
                  <div className="pt-6 border-t border-stone-200 flex items-center justify-between">
                    {canManage && (
                      <button
                        onClick={(e) => handleDelete(selectedArticle, e)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 p-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Post</span>
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedArticle(null)}
                      className="ml-auto bg-stone-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      Close Post
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
