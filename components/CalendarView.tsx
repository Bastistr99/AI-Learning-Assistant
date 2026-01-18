import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, Video, Calendar as CalIcon, X, CheckCircle2 } from 'lucide-react';
import { CalendarEvent, Course, Lecture } from '../types';

interface CalendarViewProps {
  events: CalendarEvent[];
  courses: Course[];
  lectures: Lecture[];
  onAddEvent: (event: CalendarEvent) => void;
  onStartSession: (lecture: Lecture) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, courses, lectures, onAddEvent, onStartSession }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLectureId, setSelectedLectureId] = useState('');
  const [time, setTime] = useState('09:00');

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sunday
  
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  const getEventsForDay = (day: number) => {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(e => isSameDay(new Date(e.date), checkDate));
  };

  const handleDayClick = (day: number) => {
      setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const lecture = lectures.find(l => l.id === selectedLectureId);
      if (!lecture) return;

      const newEvent: CalendarEvent = {
          id: `evt-${Date.now()}`,
          lectureId: lecture.id,
          courseId: lecture.courseId,
          title: lecture.title,
          date: selectedDate,
          time: time,
          duration: 60 // Default duration
      };

      onAddEvent(newEvent);
      setShowModal(false);
      // Reset form
      setSelectedCourseId('');
      setSelectedLectureId('');
  };

  // Filter lectures based on selected course in modal
  const availableLectures = lectures.filter(l => l.courseId === selectedCourseId);

  // Selected Day Events (Side Panel)
  const selectedDayEvents = events.filter(e => isSameDay(new Date(e.date), selectedDate))
                                  .sort((a,b) => a.time.localeCompare(b.time));

  return (
    <div className="p-4 md:p-10 w-full max-w-7xl mx-auto animate-fade-in h-screen flex flex-col pb-24 md:pb-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Schedule</h1>
          <p className="text-secondaryText">Plan your upcoming lectures and sessions</p>
        </div>
        <button 
            onClick={() => setShowModal(true)}
            className="bg-primary text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
        >
            <Plus size={20} /> Schedule Class
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden">
          
          {/* LEFT: Calendar Grid */}
          <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm p-4 md:p-8 flex flex-col">
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-8">
                  <h2 className="text-lg md:text-2xl font-bold text-primary">
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <div className="flex gap-2">
                      <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors">
                          <ChevronLeft size={24} />
                      </button>
                      <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors">
                          <ChevronRight size={24} />
                      </button>
                  </div>
              </div>

              {/* Grid Header */}
              <div className="grid grid-cols-7 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-2">
                          {day}
                      </div>
                  ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 grid-rows-6 gap-2 flex-1">
                  {/* Empty slots for start of month */}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`empty-${i}`} className="p-2"></div>
                  ))}

                  {/* Days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dayEvents = getEventsForDay(day);
                      const hasEvents = dayEvents.length > 0;
                      const isSelected = isSameDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), selectedDate);
                      const isToday = isSameDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), new Date());

                      return (
                          <div 
                            key={day}
                            onClick={() => handleDayClick(day)}
                            className={`
                                relative p-2 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1 items-center justify-start
                                ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-transparent hover:bg-gray-50'}
                                ${isToday && !isSelected ? 'bg-accent/10' : ''}
                            `}
                          >
                              {/* Date Number */}
                              <span className={`
                                  text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full mb-1
                                  ${isToday ? 'bg-accent text-primary font-bold' : 'text-secondaryText'}
                              `}>
                                  {day}
                              </span>
                              
                              {/* Event Marker Pills */}
                              <div className="flex gap-1 items-center justify-center w-full mt-1 flex-wrap content-start">
                                  {hasEvents && dayEvents.map((_, idx) => (
                                      // Limit to 3 dots to avoid overflow
                                      idx < 3 && (
                                          <div 
                                            key={idx} 
                                            className={`
                                                h-1.5 rounded-full transition-all duration-300
                                                /* Broader Pill Shape & Distinct Color */
                                                ${isSelected ? 'bg-primary w-6' : 'bg-indigo-500 w-4 opacity-80'}
                                            `}
                                            title="Scheduled Class"
                                          ></div>
                                      )
                                  ))}
                                  {hasEvents && dayEvents.length > 3 && (
                                      <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                  )}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>

          {/* RIGHT: Selected Day Details */}
          <div className="w-full lg:w-96 bg-surface rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col shrink-0">
               <div className="mb-6 pb-6 border-b border-gray-100">
                   <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Selected Date</h3>
                   <div className="text-3xl font-bold text-primary">
                       {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                   </div>
               </div>

               <div className="flex-1 overflow-y-auto">
                   {selectedDayEvents.length > 0 ? (
                       <div className="space-y-4">
                           {selectedDayEvents.map(event => (
                               <div key={event.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                                   <div className="flex justify-between items-start mb-3">
                                       <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md border border-indigo-100">
                                           {event.time}
                                       </span>
                                       <button className="text-gray-300 hover:text-red-400 transition-colors">
                                           <X size={16} />
                                       </button>
                                   </div>
                                   <h4 className="font-bold text-primary mb-1">{event.title}</h4>
                                   <div className="flex items-center gap-2 text-xs text-secondaryText mb-4">
                                       <Clock size={14} />
                                       <span>{event.duration} min</span>
                                   </div>
                                   
                                   <button 
                                        onClick={() => {
                                            const lecture = lectures.find(l => l.id === event.lectureId);
                                            if(lecture) onStartSession(lecture);
                                        }}
                                        className="w-full py-2 bg-gray-50 text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                                   >
                                       <Video size={14} /> Start Session
                                   </button>
                               </div>
                           ))}
                       </div>
                   ) : (
                       <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                           <CalIcon size={48} className="mb-4 opacity-20" />
                           <p className="text-sm">No classes scheduled for this day.</p>
                           <button 
                                onClick={() => setShowModal(true)}
                                className="mt-4 text-primary font-bold text-sm hover:underline"
                           >
                               Schedule one now
                           </button>
                       </div>
                   )}
               </div>
          </div>
      </div>

      {/* SCHEDULE MODAL */}
      {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-primary">Schedule Class</h3>
                      <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
                          <X size={20} />
                      </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-secondaryText uppercase tracking-wider mb-2">Date</label>
                          <div className="p-3 bg-gray-50 rounded-xl text-primary font-medium border border-gray-200">
                              {selectedDate.toDateString()}
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-secondaryText uppercase tracking-wider mb-2">Time</label>
                              <input 
                                type="time" 
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                                required 
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-secondaryText uppercase tracking-wider mb-2">Course</label>
                              <select 
                                value={selectedCourseId} 
                                onChange={(e) => {
                                    setSelectedCourseId(e.target.value);
                                    setSelectedLectureId('');
                                }}
                                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                                required
                              >
                                  <option value="">Select Course</option>
                                  {courses.map(c => (
                                      <option key={c.id} value={c.id}>{c.title}</option>
                                  ))}
                              </select>
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-secondaryText uppercase tracking-wider mb-2">Lecture</label>
                          <select 
                            value={selectedLectureId} 
                            onChange={(e) => setSelectedLectureId(e.target.value)}
                            className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none disabled:bg-gray-100 disabled:text-gray-400"
                            required
                            disabled={!selectedCourseId}
                          >
                              <option value="">Select Lecture</option>
                              {availableLectures.map(l => (
                                  <option key={l.id} value={l.id}>{l.title}</option>
                              ))}
                          </select>
                      </div>

                      <div className="pt-4">
                          <button 
                            type="submit" 
                            disabled={!selectedLectureId}
                            className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-200"
                          >
                              Confirm Schedule
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default CalendarView;