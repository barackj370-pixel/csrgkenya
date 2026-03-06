import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, MessageSquare, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';

interface DiscussionCardProps {
  key?: React.Key;
  discussion: {
    id: string;
    title: string;
    description: string;
    date: string;
    status: 'UPCOMING' | 'LIVE' | 'CLOSED';
    ward: {
      name: string;
      slug: string;
    };
    _count?: {
      rsvps: number;
      comments: number;
    };
  };
}

export default function DiscussionCard({ discussion }: DiscussionCardProps) {
  const isLive = discussion.status === 'LIVE';
  const isUpcoming = discussion.status === 'UPCOMING';
  const isClosed = discussion.status === 'CLOSED';

  return (
    <Link 
      to={`/discussion/${discussion.id}`}
      className="block group bg-white rounded-2xl border border-stone-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className={clsx(
              "px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide",
              isLive && "bg-red-100 text-red-700",
              isUpcoming && "bg-green-100 text-green-700",
              isClosed && "bg-stone-100 text-stone-600"
            )}>
              {discussion.status}
            </span>
            <span className="text-sm font-medium text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full">
              {discussion.ward.name}
            </span>
          </div>
          <h3 className="text-xl font-bold text-stone-900 group-hover:text-green-700 transition-colors line-clamp-2">
            {discussion.title}
          </h3>
        </div>
      </div>
      
      <p className="text-stone-600 text-sm mb-6 line-clamp-2">
        {discussion.description}
      </p>

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-stone-100">
        <div className="flex items-center gap-4 text-sm text-stone-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(discussion.date), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>{discussion._count?.rsvps || 0}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            <span>{discussion._count?.comments || 0}</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}
