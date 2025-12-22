import React from 'react';
import { Folder, Plus, Clock, BarChart } from 'lucide-react';
import { Lecture } from '../types';

interface LectureCardProps {
  lecture?: Lecture; // If null, it's a "New Lecture" card
  onClick: () => void;
}

const LectureCard: React.FC<LectureCardProps> = ({ lecture, onClick }) => {
  if (!lecture) {
    // Render "New Lecture" Card
    return (
      <button
        onClick={onClick}
        className="h-full min-h-[220px] w-full rounded-2xl border-2 border-dashed border-gray-300 bg-transparent flex flex-col items-center justify-center gap-4 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-all group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
        aria-label="Create new lecture"
      >
        <div className="w-12 h-12 rounded-xl bg-surface border border-gray-200 flex items-center justify-center group-hover:shadow-md transition-all">
          <Plus size={24} className="text-primary" />
        </div>
        <span className="font-medium">New Lecture</span>
      </button>
    );
  }

  // Render Existing Lecture Card
  return (
    <button
      onClick={onClick}
      className="h-full min-h-[220px] w-full bg-surface rounded-2xl p-6 flex flex-col items-start justify-between border border-transparent hover:border-gray-200 hover:shadow-lg transition-all text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
    >
      <div className="w-full">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mb-4 text-accent">
          <Folder size={20} fill="currentColor" className="text-accent" />
        </div>
        
        {/* Content */}
        <h3 className="text-lg font-bold text-primary mb-1">{lecture.title}</h3>
        <p className="text-xs text-secondaryText">{lecture.description}</p>
      </div>

      {/* Footer */}
      <div className="w-full bg-[#F7F7F5] rounded-xl p-3 mt-4 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Last Session</span>
          <div className="flex items-center gap-2 text-primary">
            <Clock size={14} />
            <span className="text-xs font-medium">{lecture.lastSessionDuration} min</span>
          </div>
        </div>
        
        <div className="flex items-end flex-col gap-1">
           {/* Placeholder for alignment, label hidden visually or shared */}
           <span className="text-[10px] font-bold text-transparent select-none">.</span>
           <div className="flex items-center gap-2 text-green-600">
            <BarChart size={14} className="rotate-90" />
            <span className="text-xs font-medium">{lecture.lastSessionAttendance}% att.</span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default LectureCard;