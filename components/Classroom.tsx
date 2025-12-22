import React from 'react';
import LectureCard from './LectureCard';
import { Lecture } from '../types';
import { Play } from 'lucide-react';

interface ClassroomProps {
  lectures: Lecture[];
  onSelectLecture: (lecture: Lecture) => void;
  onNewLecture: () => void;
}

const Classroom: React.FC<ClassroomProps> = ({ lectures, onSelectLecture, onNewLecture }) => {
  // Filter for "Today's" or active lectures for the Classroom view
  const todaysLectures = lectures.slice(0, 3); 

  return (
    <div className="p-10 w-full max-w-7xl mx-auto animate-fade-in">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-bold text-primary mb-3">Classroom</h1>
          <p className="text-secondaryText text-lg">Ready to start your session, Professor?</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-secondaryText shadow-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Featured / Up Next */}
      <div className="mb-12">
        <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            Up Next
        </h2>
        <div className="bg-primary rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl group">
             {/* Abstract Background Shapes */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
             
             <div className="relative z-10 flex justify-between items-center">
                <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium mb-4 text-accent">
                        Starts in 15 mins
                    </span>
                    <h3 className="text-3xl font-bold mb-2">Machine Learning 2</h3>
                    <p className="text-gray-400 max-w-lg mb-6">Deep dive into Neural Networks and Backpropagation. Prepare for high engagement.</p>
                    
                    <button 
                        onClick={() => onSelectLecture(lectures[0])}
                        className="bg-accent text-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white transition-colors"
                    >
                        <Play size={20} fill="currentColor" />
                        Start Lecture Now
                    </button>
                </div>
                
                {/* Visual decoration */}
                <div className="hidden md:block opacity-50 rotate-12">
                     <Play size={120} strokeWidth={1} />
                </div>
             </div>
        </div>
      </div>

      <h2 className="text-lg font-bold text-primary mb-4">Available Courses</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <LectureCard onClick={onNewLecture} />
        {todaysLectures.map((lecture) => (
          <LectureCard 
            key={lecture.id} 
            lecture={lecture} 
            onClick={() => onSelectLecture(lecture)} 
          />
        ))}
      </div>
    </div>
  );
};

export default Classroom;