import React, { useMemo, useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, Users, Clock, AlertTriangle, CheckCircle, HelpCircle, Folder, ArrowLeft, ChevronRight, BarChart2, Info, Eye, Activity, Sparkles } from 'lucide-react';
import { Lecture, Course, AccessibilitySettings } from '../types';

interface GlobalInsightsProps {
    lectures: Lecture[];
    courses: Course[];
    selectedCourse: Course | null; 
    onSelectCourse: (course: Course | null) => void;
    onViewInsights: (lecture: Lecture) => void;
    accessibility: AccessibilitySettings;
}

const GlobalInsights: React.FC<GlobalInsightsProps> = ({ 
    lectures, 
    courses, 
    selectedCourse, 
    onSelectCourse, 
    onViewInsights,
    accessibility
}) => {
  // State to restore scroll position when navigating back
  const [scrollPosition, setScrollPosition] = useState(0);

  const filteredLectures = selectedCourse 
    ? lectures.filter(l => l.courseId === selectedCourse.id) 
    : [];

  const handleCourseClick = (course: Course) => {
      setScrollPosition(window.scrollY);
      onSelectCourse(course);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    onSelectCourse(null);
    // Restore scroll after render
    setTimeout(() => {
        window.scrollTo({ top: scrollPosition, behavior: 'instant' });
    }, 10);
  };

  // --- ACCESSIBILITY COLORS ---
  const colors = {
      good: accessibility.colorBlindMode ? '#3b82f6' : '#10b981', // Blue vs Emerald
      bad: accessibility.colorBlindMode ? '#f97316' : '#ef4444',  // Orange vs Red
      mid: accessibility.colorBlindMode ? '#94a3b8' : '#eab308',  // Slate vs Yellow
      
      // Tailwind classes for backgrounds (Solid)
      bgSolidGood: accessibility.colorBlindMode ? 'bg-blue-600' : 'bg-emerald-500',
      bgSolidMid: accessibility.colorBlindMode ? 'bg-slate-400' : 'bg-yellow-400',
      bgSolidBad: accessibility.colorBlindMode ? 'bg-orange-500' : 'bg-red-500',

      // Tailwind classes for backgrounds (Light)
      bgLightGood: accessibility.colorBlindMode ? 'bg-blue-50' : 'bg-emerald-50',
      bgLightMid: accessibility.colorBlindMode ? 'bg-slate-100' : 'bg-yellow-50',
      bgLightBad: accessibility.colorBlindMode ? 'bg-orange-50' : 'bg-red-50',

      // Text colors
      textGood: accessibility.colorBlindMode ? 'text-blue-600' : 'text-emerald-600',
      textBad: accessibility.colorBlindMode ? 'text-orange-600' : 'text-red-600',
      textMid: accessibility.colorBlindMode ? 'text-slate-600' : 'text-yellow-600',

      chartFill: accessibility.colorBlindMode ? '#3b82f6' : '#CCFF00',
      chartStroke: accessibility.colorBlindMode ? '#2563eb' : '#A3CC00',
  };

  // --- DYNAMIC CALCULATIONS ---
  const { 
      globalAvgClarity, 
      totalStudents, 
      totalHours, 
      totalConfusionEvents, 
      trendData,
      distribution,
      insightText
  } = useMemo(() => {
      
      let totalSlides = 0;
      let clearSlides = 0;
      let moderateSlides = 0;
      let confusingSlides = 0;
      
      let sumAvgClarity = 0;
      let lecturesWithStats = 0;
      let confusionCount = 0;

      // 1. Sort lectures by date for the trend chart
      const sortedLectures = [...lectures].sort((a, b) => 
          new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime()
      );

      // 2. Generate Trend Data
      const trend = sortedLectures.map(l => {
          const stats = l.recentSessionStats || [];
          const avg = stats.length > 0 
            ? Math.round(stats.reduce((acc, curr) => acc + curr.clarityScore, 0) / stats.length) 
            : 0;

          return {
              name: new Date(l.dateCreated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              score: avg,
              title: l.title
          };
      }).filter(item => item.score > 0); 

      // 3. Aggregate Global Stats
      lectures.forEach(l => {
          const stats = l.recentSessionStats;
          if (stats && stats.length > 0) {
              lecturesWithStats++;
              const lectureAvg = stats.reduce((acc, curr) => acc + curr.clarityScore, 0) / stats.length;
              sumAvgClarity += lectureAvg;

              stats.forEach(s => {
                  totalSlides++;
                                          if (s.clarityScore >= 70) clearSlides++;
                                          else if (s.clarityScore >= 50) moderateSlides++;                  else {
                      confusingSlides++;
                      confusionCount++;
                  }
              });
          }
      });

      // 4. Final Aggregates
      const avgClarity = lecturesWithStats > 0 ? Math.round(sumAvgClarity / lecturesWithStats) : 0;
      const students = courses.reduce((acc, c) => acc + c.studentCount, 0);
      const hours = Math.round(lectures.reduce((acc, l) => acc + l.lastSessionDuration, 0) / 60);
      
      // Calculate Percentages strictly
      const dist = {
          clear: totalSlides > 0 ? Math.round((clearSlides / totalSlides) * 100) : 0,
          moderate: totalSlides > 0 ? Math.round((moderateSlides / totalSlides) * 100) : 0,
          confusing: totalSlides > 0 ? Math.round((confusingSlides / totalSlides) * 100) : 0
      };

      // Ensure they sum to 100 roughly (visual only)
      const remainder = 100 - (dist.clear + dist.moderate + dist.confusing);
      if (totalSlides > 0 && remainder !== 0) {
          dist.moderate += remainder; // Dump rounding errors into moderate
      }

      // 5. Generate Dynamic Insight Text
      let text = "Not enough data yet. Complete more sessions to generate insights.";
      if (totalSlides > 0) {
          if (dist.confusing > 15) {
              text = "Confusion levels are higher than usual. Consider revisiting complex slides or adding more examples.";
          } else if (dist.clear > 75) {
              text = "Excellent clarity scores! Your pacing and explanations are resonating well with students.";
          } else if (dist.moderate > 50) {
              text = "Understanding is mixed. Try checking in with students more frequently during mid-complexity slides.";
          } else {
              text = "Your teaching performance is balanced. Keep monitoring the confusion metrics for specific topics.";
          }
      }

      return {
          globalAvgClarity: avgClarity,
          totalStudents: students,
          totalHours: hours,
          totalConfusionEvents: confusionCount,
          trendData: trend,
          distribution: dist,
          insightText: text
      };
  }, [lectures, courses]);

  // Helper to get clarity for a specific row
  const getLectureClarity = (lecture: Lecture) => {
      if (!lecture.recentSessionStats || lecture.recentSessionStats.length === 0) return 0;
      const sum = lecture.recentSessionStats.reduce((acc, s) => acc + s.clarityScore, 0);
      return Math.round(sum / lecture.recentSessionStats.length);
  };

  return (
    <div className="p-4 md:p-10 w-full max-w-7xl mx-auto animate-fade-in pb-24 md:pb-20">
      <div className="mb-10 flex items-center justify-between">
        <div>
            {selectedCourse ? (
                <div className="flex items-center gap-3">
                     <button 
                        onClick={handleBack}
                        className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-gray-200 group"
                        aria-label="Back to Overview"
                    >
                        <ArrowLeft size={24} className="text-gray-400 group-hover:text-primary transition-colors" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-primary">{selectedCourse.title}</h1>
                        <p className="text-secondaryText text-sm">Course Archive</p>
                    </div>
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
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl text-primary ${colors.bgLightMid}`}>
                        <Activity size={24} />
                    </div>
                </div>
                <h3 className="text-secondaryText text-sm font-medium">Global Avg Clarity</h3>
                <p className="text-3xl font-bold text-primary mt-1">{globalAvgClarity}<span className="text-lg text-gray-400 font-normal">%</span></p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                        <Users size={24} />
                    </div>
                </div>
                <h3 className="text-secondaryText text-sm font-medium">Total Students</h3>
                <p className="text-3xl font-bold text-primary mt-1">{totalStudents}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                        <Clock size={24} />
                    </div>
                </div>
                <h3 className="text-secondaryText text-sm font-medium">Hours Taught</h3>
                <p className="text-3xl font-bold text-primary mt-1">{totalHours}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${colors.bgLightBad} ${colors.textBad}`}>
                        <AlertTriangle size={24} />
                    </div>
                </div>
                <h3 className="text-secondaryText text-sm font-medium">Confusing Moments</h3>
                <p className="text-3xl font-bold text-primary mt-1">{totalConfusionEvents}</p>
            </div>
        </div>

        {/* Main Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-full flex flex-col">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-primary">Recent Performance Trend</h3>
                        <p className="text-xs text-secondaryText">Average clarity score over your recent sessions</p>
                    </div>
                </div>
                
                <div className="flex-1 w-full min-h-[300px]">
                    {trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={colors.chartFill} stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor={colors.chartFill} stopOpacity={0}/>
                                </linearGradient>
                                <pattern id="stripePattern" patternUnits="userSpaceOnUse" width="4" height="4">
                                  <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke={colors.chartStroke} strokeWidth="1" />
                                </pattern>
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
                                domain={[0, 100]}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 600, color: '#1A1A1A' }}
                                formatter={(value: number) => [`${value}%`, 'Clarity']}
                                labelStyle={{ color: '#666' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="score" 
                                stroke={colors.chartStroke} 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill={accessibility.colorBlindMode ? "url(#stripePattern)" : "url(#colorScore)"}
                                activeDot={{ r: 6, strokeWidth: 0, fill: colors.chartStroke }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                             <BarChart2 size={48} className="mb-4 opacity-20" />
                             <p>Complete a session to see your performance trend.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full">
                <div className="shrink-0 mb-6">
                    <h3 className="text-lg font-bold text-primary">Clarity Distribution</h3>
                    <p className="text-xs text-secondaryText mb-6">Breakdown of slide clarity levels</p>
                </div>

                <div className="space-y-6 flex-1 flex flex-col justify-center">
                    {/* Clear */}
                    <div>
                        <div className="flex justify-between text-sm mb-2 font-medium">
                            <span className={`flex items-center gap-2 ${colors.textGood}`}>
                                <CheckCircle size={18} className="fill-current text-white"/> 
                                <span className="text-gray-700">Clear (&gt;70%)</span>
                            </span>
                            <span className="text-primary font-bold">{distribution.clear}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-1000 ${colors.bgSolidGood}`} 
                                style={{ width: `${distribution.clear}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Moderate */}
                    <div>
                        <div className="flex justify-between text-sm mb-2 font-medium">
                            <span className={`flex items-center gap-2 ${colors.textMid}`}>
                                <HelpCircle size={18} className="fill-current text-white"/> 
                                <span className="text-gray-700">Moderate (50-69%)</span>
                            </span>
                            <span className="text-primary font-bold">{distribution.moderate}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-1000 ${colors.bgSolidMid}`}
                                style={{ width: `${distribution.moderate}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Confusing */}
                    <div>
                        <div className="flex justify-between text-sm mb-2 font-medium">
                            <span className={`flex items-center gap-2 ${colors.textBad}`}>
                                <AlertTriangle size={18} className="fill-current text-white"/> 
                                <span className="text-gray-700">Confusing (&lt;50%)</span>
                            </span>
                            <span className="text-primary font-bold">{distribution.confusing}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-1000 ${colors.bgSolidBad}`}
                                style={{ width: `${distribution.confusing}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-100 relative shrink-0">
                    <p className="text-sm text-secondaryText leading-relaxed">
                        <span className="font-bold text-primary block mb-1 text-xs uppercase tracking-wide flex items-center gap-1">
                            <Sparkles size={12} className="text-accent fill-current" />
                            AI Insight
                        </span> 
                        {insightText}
                    </p>
                </div>
            </div>
        </div>

        {/* FOLDER SECTION FOR DRILL DOWN */}
        <div className="mt-8 mb-16">
            <h2 className="text-2xl font-bold text-primary mb-6">Course Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {courses.map((course) => (
                <button 
                    key={course.id} 
                    onClick={() => handleCourseClick(course)}
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                </button>
                ))}
            </div>
        </div>

        {/* DATA SOURCE & METHODOLOGY SECTION */}
        <div className="bg-surface rounded-3xl p-8 border border-gray-100 shadow-sm mt-8">
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                <Info size={24} className="text-gray-400" />
                How Metrics Work
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                        <Eye size={20} />
                    </div>
                    <h3 className="font-bold text-primary text-sm mb-2">Data Source</h3>
                    <p className="text-xs text-secondaryText leading-relaxed">
                        Metrics are derived from <strong>real-time video analysis</strong> during your live sessions. The AI samples the webcam feed every 5 seconds to analyze facial expressions, posture, and attention levels.
                    </p>
                </div>
                <div>
                    <div className="w-10 h-10 rounded-xl bg-accent/20 text-primary flex items-center justify-center mb-4">
                        <Activity size={20} />
                    </div>
                    <h3 className="font-bold text-primary text-sm mb-2">Clarity Score Calculation</h3>
                    <p className="text-xs text-secondaryText leading-relaxed">
                        The AI determines a "Confusion Score" (0-10) for each frame. This is inverted to create the <strong>Clarity Score</strong> (e.g., Confusion 2 = Clarity 80%). This indicates how well the material appears to be understood.
                    </p>
                </div>
                <div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                        <CheckCircle size={20} />
                    </div>
                    <h3 className="font-bold text-primary text-sm mb-2">Privacy & Processing</h3>
                    <p className="text-xs text-secondaryText leading-relaxed">
                        Video frames are analyzed in real-time by Google Gemini and are <strong>not stored</strong> permanently. Only the numerical aggregate scores (metadata) are saved to your lecture history for these reports.
                    </p>
                </div>
            </div>
        </div>
      </>
      )}

      {/* COURSE SPECIFIC LECTURE LIST */}
      {selectedCourse && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                 <div>
                    <h2 className="text-lg font-bold text-primary">Lecture Insights</h2>
                    <p className="text-xs text-secondaryText">Detailed analytics per session</p>
                 </div>
            </div>
            <div className="divide-y divide-gray-50">
                {filteredLectures.map((lecture) => {
                    const clarity = getLectureClarity(lecture);
                    return (
                        <button 
                            key={lecture.id} 
                            onClick={() => onViewInsights(lecture)}
                            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 cursor-pointer group transition-colors text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl ${clarity >= 80 ? colors.bgLightGood : clarity >= 50 ? colors.bgLightMid : colors.bgLightBad} ${clarity >= 80 ? colors.textGood : clarity >= 50 ? colors.textMid : colors.textBad} flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors`}>
                                    <BarChart2 size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-primary text-sm">{lecture.title}</h4>
                                    <span className="text-xs text-secondaryText">{lecture.dateCreated} • Duration: {lecture.lastSessionDuration} min</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <div className="text-xs text-secondaryText font-medium mb-1">Clarity Score</div>
                                    <div className={`text-lg font-bold ${clarity > 0 ? 'text-primary' : 'text-gray-400'}`}>
                                        {clarity > 0 ? `${clarity}%` : 'N/A'}
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors">
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        </button>
                    );
                })}
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