import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Users, Calendar, ArrowLeft, Lightbulb, ThumbsUp } from 'lucide-react';
import DiscussionCard from '../components/ui/DiscussionCard';
import JoinWardModal from '../components/ui/JoinWardModal';

export default function WardPage() {
  const { slug } = useParams();
  const [ward, setWard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  const [newIssue, setNewIssue] = useState({ title: '', description: '' });
  const brainstormIssues = ward?.issues || [];

  useEffect(() => {
    async function fetchWard() {
      try {
        const res = await fetch(`/api/wards/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setWard(data);
        }
      } catch (error) {
        console.error('Failed to fetch ward', error);
      } finally {
        setLoading(false);
      }
    }
    fetchWard();
  }, [slug]);

  const handleJoinSuccess = () => {
    setHasJoined(true);
    setIsJoinModalOpen(false);
  };

  const handleVote = async (id: string) => {
    if (!hasJoined) {
      setIsJoinModalOpen(true);
      return;
    }
    
    // Optimistic update
    setWard({
      ...ward,
      issues: ward.issues.map((issue: any) => 
        issue.id === id ? { ...issue, votes: issue.votes + 1 } : issue
      ).sort((a: any, b: any) => b.votes - a.votes)
    });

    try {
      await fetch(`/api/issues/${id}/vote`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to vote', error);
    }
  };

  const handleAddIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasJoined) {
      setIsJoinModalOpen(true);
      return;
    }
    if (newIssue.title && newIssue.description) {
      const tempId = Date.now().toString();
      const issueToAdd = { id: tempId, title: newIssue.title, description: newIssue.description, votes: 1, wardName: ward.name };
      
      // Optimistic update
      setWard({
        ...ward,
        issues: [...(ward.issues || []), issueToAdd].sort((a: any, b: any) => b.votes - a.votes)
      });
      setNewIssue({ title: '', description: '' });

      try {
        await fetch('/api/issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(issueToAdd)
        });
      } catch (error) {
        console.error('Failed to add issue', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  if (!ward) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center gap-4">
        <h1 className="text-3xl font-bold text-stone-900">Ward not found</h1>
        <Link to="/" className="text-red-600 hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-stone-50 min-h-screen pb-24"
    >
      {/* Ward Header */}
      <div className="bg-stone-900 text-white py-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-black via-red-600 to-green-600"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-stone-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold">{ward.name}</h1>
                <p className="text-xl text-stone-400 mt-2">{ward.description}</p>
              </div>
            </div>
            {!hasJoined ? (
              <button 
                onClick={() => setIsJoinModalOpen(true)}
                className="bg-white text-stone-900 px-8 py-3 rounded-full font-bold hover:bg-stone-100 transition-colors shadow-lg"
              >
                Join Ward as Citizen
              </button>
            ) : (
              <div className="bg-green-500/20 text-green-400 border border-green-500/30 px-6 py-3 rounded-full font-bold flex items-center gap-2">
                <Users className="w-5 h-5" /> Joined as Citizen
              </div>
            )}
          </div>
          <div className="flex items-center gap-6 mt-8">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Users className="w-5 h-5 text-red-400" />
              <span className="font-semibold">{ward.groups?.length || 0} Groups</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Calendar className="w-5 h-5 text-green-400" />
              <span className="font-semibold">{ward.discussions?.length || 0} Assemblies</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Brainstorming */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-stone-900">Brainstorming & Discussion</h2>
                  <p className="text-stone-500">Propose up to 3 key issues. Vote to select the top 2 for the upcoming assembly.</p>
                </div>
              </div>

              {/* Add New Issue Form */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm mb-8">
                <h3 className="text-lg font-bold text-stone-900 mb-4">Propose a Key Issue</h3>
                <form onSubmit={handleAddIssue} className="space-y-4">
                  <div>
                    <input 
                      type="text" 
                      required
                      placeholder="Issue Title (e.g., Water Scarcity)"
                      value={newIssue.title}
                      onChange={e => setNewIssue({...newIssue, title: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <textarea 
                      required
                      placeholder="Describe the issue and why it needs to be discussed..."
                      value={newIssue.description}
                      onChange={e => setNewIssue({...newIssue, description: e.target.value})}
                      rows={3}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none resize-none"
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    className="bg-stone-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-stone-800 transition-colors"
                  >
                    Submit Issue
                  </button>
                </form>
              </div>

              {/* Issues List */}
              <div className="space-y-4">
                {brainstormIssues.map((issue, index) => (
                  <div key={issue.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex gap-6 items-start relative overflow-hidden group">
                    {index < 2 && (
                      <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                        Top Issue
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-2">
                      <button 
                        onClick={() => handleVote(issue.id)}
                        className="w-12 h-12 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                      >
                        <ThumbsUp className="w-5 h-5" />
                      </button>
                      <span className="font-bold text-stone-900 text-lg">{issue.votes}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-stone-900 mb-2">{issue.title}</h4>
                      <p className="text-stone-600 leading-relaxed">{issue.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Scheduled Assemblies */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-stone-900 mb-6">Scheduled Assemblies</h2>
            <div className="space-y-4">
              {Array.isArray(ward.discussions) && ward.discussions.map((discussion: any) => (
                <DiscussionCard 
                  key={discussion.id} 
                  discussion={{...discussion, ward: { name: ward.name, slug: ward.slug }}} 
                />
              ))}
              {(!Array.isArray(ward.discussions) || ward.discussions.length === 0) && (
                <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-stone-500">
                  No assemblies scheduled.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <JoinWardModal 
        isOpen={isJoinModalOpen} 
        onClose={() => setIsJoinModalOpen(false)} 
        wardName={ward.name}
        onSuccess={handleJoinSuccess}
      />
    </motion.div>
  );
}
