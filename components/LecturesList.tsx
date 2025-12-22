import React, { useState } from 'react';
import { Lecture, Course } from '../types';
import { Search, Filter, MoreHorizontal, Folder, ArrowLeft, FileText, Calendar, Clock, ChevronRight, X, Play, BarChart2 } from 'lucide-react';

interface LecturesListProps {
  lectures: Lecture[];
  courses: Course[];
  selectedCourse: Course | null; 
  onSelectCourse: (course: Course | null) => void;
  onStartSession: (lecture: Lecture) => void;
  onViewInsights: (lecture: Lecture) => void;
}

const LecturesList: React.FC<LecturesListProps> = ({ 
    lectures, 
    courses, 
    selectedCourse, 
    onSelectCourse, 
    onStartSession, 
    onViewInsights 
}) => {
  const [modalLecture, setModalLecture] = useState<Lecture | null>(null);

  // Filter lectures based on selected course
  const filteredLectures = selectedCourse 
    ? lectures.filter(l => l.courseId === selectedCourse.id) 
    : [];

  const handleBack = () => {
    onSelectCourse(null);
  };

  const handleLectureClick = (lecture: Lecture) => {
    setModalLecture(lecture);
  }

  const closeModal = () => {
    setModalLecture(null);
  }

  return (
    <div className="p-10 w-full max-w-7xl mx-auto animate-fade-in relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-primary">
                {selectedCourse ? selectedCourse.title : 'My Courses'}
            </h1>
          </div>
          <p className="text-secondaryText">
            {selectedCourse 
                ? 'Manage specific lectures and slides for this course' 
                : 'Overview of all your active courses'}
          </p>
        </div>
        <button className="bg-primary text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200">
          {selectedCourse ? '+ New Lecture' : '+ New Course'}
        </button>
      </div>

      {/* Breadcrumbs / Back Button */}
      {selectedCourse && (
        <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-sm font-medium text-secondaryText hover:text-primary mb-6 transition-colors"
        >
            <ArrowLeft size={16} />
            Back to Courses
        </button>
      )}

      {/* Search & Filter Bar */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder={selectedCourse ? "Search lectures..." : "Search courses..."}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/10 bg-white"
            />
        </div>
        <button className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-secondaryText flex items-center gap-2 hover:bg-gray-50">
            <Filter size={18} />
            <span>Filter</span>
        </button>
      </div>

      {/* VIEW: Course Folders Grid */}
      {!selectedCourse && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course) => (
            <div 
                key={course.id} 
                onClick={() => onSelectCourse(course)}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
            >
                <div className="flex justify-between items-start mb-8">
                    <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-accent group-hover:text-primary transition-colors duration-300">
                        <Folder size={28} fill="currentColor" className="opacity-80" />
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                        <MoreHorizontal size={20} />
                    </button>
                </div>

                <h3 className="font-bold text-lg text-primary mb-2">{course.title}</h3>
                <div className="flex items-center gap-4 text-secondaryText text-xs font-medium">
                    <span>{course.studentCount} Students</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>{course.lectureCount} Lectures</span>
                </div>
            </div>
            ))}
        </div>
      )}

      {/* VIEW: Lectures List (Inside a Course) */}
      {selectedCourse && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50">
                        <th className="p-5 font-semibold">Lecture Title</th>
                        <th className="p-5 font-semibold">Date Created</th>
                        <th className="p-5 font-semibold">Duration</th>
                        <th className="p-5 font-semibold">Performance</th>
                        <th className="p-5 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredLectures.map((lecture) => (
                        <tr 
                            key={lecture.id} 
                            onClick={() => handleLectureClick(lecture)}
                            className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                        >
                            <td className="p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-accent/20 text-primary flex items-center justify-center">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-primary text-sm">{lecture.title}</h4>
                                        <p className="text-xs text-secondaryText truncate max-w-[250px]">{lecture.description}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="p-5">
                                <div className="flex items-center gap-2 text-sm text-secondaryText">
                                    <Calendar size={16} />
                                    <span>{lecture.dateCreated}</span>
                                </div>
                            </td>
                            <td className="p-5">
                                <div className="flex items-center gap-2 text-sm text-secondaryText">
                                    <Clock size={16} />
                                    <span>{lecture.lastSessionDuration} min</span>
                                </div>
                            </td>
                            <td className="p-5">
                                <div className="flex items-center gap-2">
                                    <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                        <div style={{ width: `${lecture.lastSessionAttendance}%` }} className="bg-accent h-full rounded-full" />
                                    </div>
                                    <span className="text-xs font-bold text-primary">{lecture.lastSessionAttendance}%</span>
                                </div>
                            </td>
                            <td className="p-5 text-right">
                                <button className="p-2 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-primary transition-colors">
                                    <ChevronRight size={20} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {filteredLectures.length === 0 && (
                <div className="p-10 text-center text-gray-400">
                    <p>No lectures found in this course.</p>
                </div>
            )}
        </div>
      )}

      {/* POPUP MODAL */}
      {modalLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal}></div>
            <div className="bg-white rounded-3xl p-8 w-full max-w-md relative shadow-2xl animate-fade-in-up">
                <button 
                    onClick={closeModal}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
                >
                    <X size={20} />
                </button>

                <div className="mb-8">
                    <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-accent mb-6 shadow-lg shadow-primary/20">
                        <FileText size={28} />
                    </div>
                    <h2 className="text-2xl font-bold text-primary mb-2">{modalLecture.title}</h2>
                    <p className="text-secondaryText text-sm leading-relaxed">{modalLecture.description}</p>
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={() => {
                            closeModal();
                            onStartSession(modalLecture);
                        }}
                        className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                    >
                        <Play size={20} fill="currentColor" />
                        Start Again
                    </button>
                    
                    <button 
                        onClick={() => {
                            closeModal();
                            onViewInsights(modalLecture);
                        }}
                        className="w-full bg-white border border-gray-200 text-primary py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
                    >
                        <BarChart2 size={20} />
                        Go to Review
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default LecturesList;