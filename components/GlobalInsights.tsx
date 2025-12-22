import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, Users, Clock, AlertTriangle, CheckCircle, Zap, Folder, ArrowLeft, FileText, ChevronRight } from 'lucide-react';
import { Lecture, Course } from '../types';

interface GlobalInsightsProps {
    lectures: Lecture[];
    courses: Course[];
    selectedCourse: Course | null; 
    onSelectCourse: (course: Course | null) => void;
    onViewInsights: (lecture: Lecture) => void;
}

// Updated data model for "This Week vs Last Week" comparison
const weeklyEngagementData = [
  { name: 'Mon', thisWeek: 70, lastWeek: 65 },
  { name: 'Tue', thisWeek: 82, lastWeek: 68 },
  { name: 'Wed', thisWeek: 45, lastWeek: 55 },
  { name: 'Thu', thisWeek: 90, lastWeek: 82 },
  { name: 'Fri', thisWeek: 78, lastWeek: 75 },
];

const GlobalInsights: React.FC<GlobalInsightsProps> = ({ 
    lectures, 
    courses, 
    selectedCourse, 
    onSelectCourse, 
    onViewInsights 
}) => {
  const filteredLectures = selectedCourse 
    ? lectures.filter(l => l.courseId === selectedCourse.id) 
    : [];

  const handleBack = () => {
    onSelectCourse(null);
  };

  return (
    <div className="p-10 w-full max-w-7xl mx-auto animate-fade-in pb-20">
      <div className="mb-10 flex items-center justify-between">
        <div>
            {selectedCourse ? (
                <div className="flex items-center gap-3">
                     <button 
                        onClick={handleBack}
                        className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-gray-200"
                    >
                        <ArrowLeft size={20} className="text-primary" />
                    </button>
                    <h1 className="text-3xl font-bold text-primary">{selectedCourse.title} Archives</h1>
                </div>
            ) : (
                <>
                    <h1 className="text-3xl font-bold text-primary mb-2">Insights Overview</h1>
                    <p className="text-secondaryText">Performance metrics across all courses</p>
                </>
            )}
        </div>
      </div>

      {/* GLOBAL DASHBOARD VIEW */}
      {!selectedCourse && (
      <>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    {/* Consistent with PostSessionInsights style: Accent background, Primary icon */}
                    <div className="p-3 bg-accent/20 rounded-xl text-primary">
                        <TrendingUp size={24} />
                    </div>
                    <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">+12%</span>
                </div>
                <h3 className="text-secondaryText text-sm font-medium">Avg Engagement</h3>
                <p className="text-3xl font-bold text-primary mt-1">78<span className="text-lg text-gray-400 font-normal">%</span></p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                        <Users size={24} />
                    </div>
                </div>
                <h3 className="text-secondaryText text-sm font-medium">Total Students</h3>
                <p className="text-3xl font-bold text-primary mt-1">342</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                        <Clock size={24} />
                    </div>
                </div>
                <h3 className="text-secondaryText text-sm font-medium">Hours Taught</h3>
                <p className="text-3xl font-bold text-primary mt-1">128</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-red-50 rounded-xl text-red-500">
                        <AlertTriangle size={24} />
                    </div>
                    <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded-full">High</span>
                </div>
                <h3 className="text-secondaryText text-sm font-medium">Confusion Events</h3>
                <p className="text-3xl font-bold text-primary mt-1">12<span className="text-lg text-gray-400 font-normal">/wk</span></p>
            </div>
        </div>

        {/* Main Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-primary">Engagement Trends</h3>
                        <p className="text-xs text-secondaryText">Comparing current performance with previous week</p>
                    </div>
                    {/* Legend Customization */}
                    <div className="flex gap-4 text-xs font-medium">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-accent border border-black/10"></span>
                            <span>This Week</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-gray-600"></span>
                            <span className="text-secondaryText">Last Week</span>
                        </div>
                    </div>
                </div>
                
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklyEngagementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorThisWeek" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#CCFF00" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#9ca3af', fontSize: 12, dy: 10}}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#9ca3af', fontSize: 12}}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                            />

                            {/* ORDER CHANGED: Render This Week first (bottom layer), Last Week second (top layer) */}
                            
                            {/* This Week - Main Area using Brand Accent Color */}
                            <Area 
                                type="monotone" 
                                dataKey="thisWeek" 
                                stroke="#A3CC00" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorThisWeek)" 
                                name="This Week"
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#A3CC00' }}
                            />
                            
                            {/* Last Week - Reference Line style - Darkened for visibility */}
                            <Area 
                                type="monotone" 
                                dataKey="lastWeek" 
                                stroke="#4B5563" 
                                strokeWidth={2} 
                                strokeDasharray="5 5"
                                fill="transparent" 
                                name="Last Week"
                                activeDot={{ r: 4, fill: '#4B5563' }}
                            />

                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                    <h3 className="text-lg font-bold text-primary mb-6">Feedback Distribution</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2 font-medium">
                                <span className="text-primary flex items-center gap-2">
                                    <CheckCircle size={16} className="text-emerald-500"/> Clear
                                </span>
                                <span className="text-secondaryText">68%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-emerald-500 h-2 rounded-full w-[68%]"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2 font-medium">
                                <span className="text-primary flex items-center gap-2">
                                    {/* Engaging uses the Brand Accent Color */}
                                    <Zap size={16} className="text-lime-600"/> Engaging
                                </span>
                                <span className="text-secondaryText">24%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-accent h-2 rounded-full w-[24%]"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2 font-medium">
                                <span className="text-primary flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-red-500"/> Confusing
                                </span>
                                <span className="text-secondaryText">8%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-red-500 h-2 rounded-full w-[8%]"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl mt-6">
                    <p className="text-xs text-secondaryText leading-relaxed">
                        <span className="font-bold text-primary">Insight:</span> "Wednesdays" show consistently lower engagement scores across all classes.
                    </p>
                </div>
            </div>
        </div>

        {/* FOLDER SECTION FOR DRILL DOWN */}
        <div className="mt-8">
            <h2 className="text-2xl font-bold text-primary mb-6">Past Session Archives</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {courses.map((course) => (
                <div 
                    key={course.id} 
                    onClick={() => onSelectCourse(course)}
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-accent transition-colors duration-300">
                            <Folder size={24} fill="currentColor" />
                        </div>
                    </div>
                    <h3 className="font-bold text-lg text-primary mb-1">{course.title}</h3>
                    <p className="text-xs text-secondaryText mb-4">{course.lectureCount} Past Lectures</p>
                    <div className="flex items-center text-xs font-bold text-primary gap-1 group-hover:gap-2 transition-all">
                        View Archive <ChevronRight size={14}/>
                    </div>
                </div>
                ))}
            </div>
        </div>
      </>
      )}

      {/* COURSE SPECIFIC LECTURE LIST */}
      {selectedCourse && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                 <h2 className="text-lg font-bold text-primary">Lecture History</h2>
                 <p className="text-xs text-secondaryText">Select a lecture to view its full insight report.</p>
            </div>
            <div className="divide-y divide-gray-50">
                {filteredLectures.map((lecture) => (
                    <div 
                        key={lecture.id} 
                        onClick={() => onViewInsights(lecture)}
                        className="p-6 flex items-center justify-between hover:bg-gray-50 cursor-pointer group transition-colors"
                    >
                        <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-accent group-hover:text-primary transition-colors">
                                <CheckCircle size={20} />
                             </div>
                             <div>
                                <h4 className="font-bold text-primary text-sm">{lecture.title}</h4>
                                <span className="text-xs text-secondaryText">{lecture.dateCreated} • Duration: {lecture.lastSessionDuration} min</span>
                             </div>
                        </div>

                        <div className="flex items-center gap-8">
                             <div className="text-right">
                                <div className="text-xs text-secondaryText font-medium mb-1">Clarity Score</div>
                                <div className="text-lg font-bold text-primary">{lecture.lastSessionAttendance}%</div> {/* Using attendance as proxy for score in mock */}
                             </div>
                             <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors">
                                <ChevronRight size={16} />
                             </div>
                        </div>
                    </div>
                ))}
                {filteredLectures.length === 0 && (
                    <div className="p-10 text-center text-gray-400 italic">No past sessions found for this course.</div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default GlobalInsights;