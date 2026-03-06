import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, MessageSquare, ArrowLeft, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';

export default function DiscussionPage() {
  const { id } = useParams();
  const [discussion, setDiscussion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDiscussion() {
      try {
        const res = await fetch(`/api/discussions/${id}`);
        if (res.ok) {
          const data = await res.json();
          setDiscussion(data);
        }
      } catch (error) {
        console.error('Failed to fetch discussion', error);
      } finally {
        setLoading(false);
      }
    }
    // Mock fetch for now since we didn't create the endpoint yet
    // I will add the endpoint in server.ts
    fetchDiscussion();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center gap-4">
        <h1 className="text-3xl font-bold text-stone-900">Discussion not found</h1>
        <Link to="/" className="text-red-600 hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  const isLive = discussion.status === 'LIVE';
  const isUpcoming = discussion.status === 'UPCOMING';
  const isClosed = discussion.status === 'CLOSED';

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-stone-50 min-h-screen pb-24"
    >
      {/* Discussion Header */}
      <div className="bg-white border-b border-stone-200 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={`/ward/${discussion.ward?.slug}`} className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to {discussion.ward?.name} Ward
          </Link>
          
          <div className="flex items-center gap-3 mb-6">
            <span className={clsx(
              "px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide",
              isLive && "bg-red-100 text-red-700",
              isUpcoming && "bg-green-100 text-green-700",
              isClosed && "bg-stone-100 text-stone-600"
            )}>
              {discussion.status}
            </span>
            <span className="text-stone-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {format(new Date(discussion.date), 'MMMM d, yyyy - h:mm a')}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-stone-900 mb-6 leading-tight">
            {discussion.title}
          </h1>
          
          <p className="text-xl text-stone-600 mb-8 leading-relaxed">
            {discussion.description}
          </p>
          
          <div className="flex items-center gap-4 border-t border-stone-100 pt-8">
            <button className="bg-stone-900 text-white px-8 py-3 rounded-full font-bold hover:bg-stone-800 transition-colors shadow-md">
              RSVP to Assembly
            </button>
            <div className="flex items-center gap-2 text-stone-500 ml-4">
              <Users className="w-5 h-5" />
              <span className="font-medium">{discussion._count?.rsvps || 0} Attending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Discussion Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Thread */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2 mb-2">
                <MessageSquare className="w-6 h-6 text-green-600" />
                Brainstorming & Discussion
              </h2>
              <p className="text-stone-600">
                Group members, use this space to brainstorm, discuss, and decide on the key issues that should be raised on the assembly date.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <textarea 
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none resize-none"
                rows={4}
                placeholder="Share your thoughts, propose an issue, or discuss with your group members..."
              ></textarea>
              <div className="flex justify-end mt-4">
                <button className="bg-green-600 text-white px-6 py-2 rounded-full font-medium hover:bg-green-700 transition-colors">
                  Post Comment
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Comments will be loaded here */}
              <div className="bg-stone-100 rounded-2xl border border-stone-200 p-8 text-center">
                <p className="text-stone-500">
                  No comments yet. Be the first to start the brainstorming session!
                </p>
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="font-bold text-stone-900 mb-4">Resolution Voting</h3>
              <p className="text-sm text-stone-600 mb-6">
                Vote on the proposed resolution for this assembly.
              </p>
              
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between bg-stone-50 hover:bg-green-50 border border-stone-200 hover:border-green-200 p-4 rounded-xl transition-colors group">
                  <span className="font-medium text-stone-700 group-hover:text-green-700 flex items-center gap-2">
                    <ThumbsUp className="w-5 h-5" /> Support
                  </span>
                  <span className="text-stone-400 font-mono">42%</span>
                </button>
                <button className="w-full flex items-center justify-between bg-stone-50 hover:bg-red-50 border border-stone-200 hover:border-red-200 p-4 rounded-xl transition-colors group">
                  <span className="font-medium text-stone-700 group-hover:text-red-700 flex items-center gap-2">
                    <ThumbsDown className="w-5 h-5" /> Oppose
                  </span>
                  <span className="text-stone-400 font-mono">38%</span>
                </button>
                <button className="w-full flex items-center justify-between bg-stone-50 hover:bg-stone-100 border border-stone-200 p-4 rounded-xl transition-colors group">
                  <span className="font-medium text-stone-700 flex items-center gap-2">
                    <Minus className="w-5 h-5" /> Neutral
                  </span>
                  <span className="text-stone-400 font-mono">20%</span>
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </motion.div>
  );
}
