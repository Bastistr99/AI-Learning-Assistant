import React, { useMemo } from 'react';
import LectureCard from './LectureCard';
import { Lecture, CalendarEvent } from '../types';
import { Play, Calendar, Clock } from 'lucide-react';

interface ClassroomProps {
  lectures: Lecture[];
  events: CalendarEvent[];
  onSelectLecture: (lecture: Lecture) => void;
  onNewLecture: () => void;
}

const Classroom: React.FC<ClassroomProps> = ({ lectures, events, onSelectLecture, onNewLecture }) => {
  // Filter for "Today's" or active lectures for the Classroom view (just limits the list size)
  const recentLectures = lectures.slice(0, 3); 

  // Logic to find the absolute next event in the future
  const nextEventData = useMemo(() => {
    const now = new Date();
    
    // Filter events that are in the future
    const upcoming = events.filter(e => {
        const [h, m] = e.time.split(':').map(Number);
        const eventDate = new Date(e.date);
        eventDate.setHours(h, m, 0, 0);
        return eventDate > now;
    });

    if (upcoming.length === 0) return null;

    // Sort by nearest date/time
    upcoming.sort((a, b) => {
        const [h1, m1] = a.time.split(':').map(Number);
        const d1 = new Date(a.date);
        d1.setHours(h1, m1, 0, 0);
        
        const [h2, m2] = b.time.split(':').map(Number);
        const d2 = new Date(b.date);
        d2.setHours(h2, m2, 0, 0);

        return d1.getTime() - d2.getTime();
    });

    const next = upcoming[0];
    const lecture = lectures.find(l => l.id === next.lectureId);
    
    // Calculate time difference text
    const [h, m] = next.time.split(':').map(Number);
    const eventDate = new Date(next.date);
    eventDate.setHours(h, m, 0, 0);
    
    const diffMs = eventDate.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let timeText = '';
    if (diffDays > 0) timeText = `in ${diffDays} days`;
    else if (diffHours > 0) timeText = `in ${diffHours} hours`;
    else timeText = `in ${diffMins} mins`;

    return { event: next, lecture, timeText };
  }, [events, lectures]);

  return (
    <div className="p-4 md:p-10 w-full max-w-7xl mx-auto animate-fade-in">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">Classroom</h1>
          <p className="text-secondaryText text-sm md:text-lg">Ready to start your session, Professor?</p>
        </div>
        <div className="hidden md:block bg-white px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-secondaryText shadow-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Featured / Up Next */}
      <div className="mb-12">
        <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            Up Next
        </h2>
        
        {nextEventData && nextEventData.lecture ? (
            <div className="bg-primary rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-2xl group transition-all hover:scale-[1.01]">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-accent">
                                Starts {nextEventData.timeText}
                            </span>
                            <span className="text-gray-400 text-xs flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(nextEventData.event.date).toLocaleDateString()} at {nextEventData.event.time}
                            </span>
                        </div>
                        
                        <h3 className="text-2xl md:text-3xl font-bold mb-2">{nextEventData.lecture.title}</h3>
                        <p className="text-gray-400 max-w-lg mb-6 line-clamp-2">{nextEventData.lecture.description}</p>
                        
                        <button 
                            onClick={() => onSelectLecture(nextEventData.lecture!)}
                            className="bg-accent text-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white transition-colors shadow-lg shadow-accent/20"
                        >
                            <Play size={20} fill="currentColor" />
                            Start Lecture Now
                        </button>
                    </div>
                    
                    {/* Visual decoration */}
                    <div className="hidden md:block opacity-50 rotate-12 mr-8">
                        <Play size={120} strokeWidth={1} />
                    </div>
                </div>
            </div>
        ) : (
            <div className="bg-white rounded-3xl p-8 border border-gray-200 border-dashed flex flex-col items-center justify-center text-center gap-4 py-12">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                    <Calendar size={32} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-primary">No Upcoming Classes</h3>
                    <p className="text-secondaryText text-sm max-w-xs mx-auto">
                        Your schedule is clear. You can start any lecture from the list below or schedule a new one in the calendar.
                    </p>
                </div>
            </div>
        )}
      </div>

      <h2 className="text-lg font-bold text-primary mb-4">Recent Lectures</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <LectureCard onClick={onNewLecture} />
        {recentLectures.map((lecture) => (
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