import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, MessageSquare, UserPlus } from 'lucide-react';

interface WardCardProps {
  key?: React.Key;
  ward: {
    id: string;
    name: string;
    slug: string;
    description: string;
    _count?: {
      users: number;
      discussions: number;
      groups: number;
    };
  };
}

export default function WardCard({ ward }: WardCardProps) {
  return (
    <Link 
      to={`/ward/${ward.slug}`}
      className="block group bg-white rounded-2xl border border-stone-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900 group-hover:text-red-600 transition-colors">
              {ward.name}
            </h3>
            <p className="text-sm text-stone-500 line-clamp-1">{ward.description}</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 mt-6 pt-6 border-t border-stone-100">
        <div className="flex items-center gap-1.5 text-sm text-stone-600">
          <Users className="w-4 h-4" />
          <span className="font-medium">{ward._count?.groups || 0}</span> Groups
        </div>
        <div className="flex items-center gap-1.5 text-sm text-stone-600">
          <UserPlus className="w-4 h-4" />
          <span className="font-medium">{ward._count?.users || 0}</span> Citizens
        </div>
        <div className="flex items-center gap-1.5 text-sm text-stone-600">
          <MessageSquare className="w-4 h-4" />
          <span className="font-medium">{ward._count?.discussions || 0}</span> Assemblies
        </div>
      </div>
    </Link>
  );
}
