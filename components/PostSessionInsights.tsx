import React from 'react';
import { ArrowLeft, Sparkles, TrendingUp, AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';
import { Lecture } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface PostSessionInsightsProps {
  lecture: Lecture;
  onBack: () => void;
}

const slideData = [
  { slide: 1, clarity: 85 },
  { slide: 2, clarity: 40 }, 
  { slide: 3, clarity: 94 },
  { slide: 4, clarity: 32 },
  { slide: 5, clarity: 75 },
  { slide: 6, clarity: 88 },
  { slide: 7, clarity: 90 },
  { slide: 8, clarity: 18 },
  { slide: 9, clarity: 60 },
  { slide: 10, clarity: 85 },
];

const PostSessionInsights: React.FC<PostSessionInsightsProps> = ({ lecture, onBack }) => {
  return (
    <div className="p-8 w-full max-w-7xl mx-auto h-screen overflow-y-auto animate-fade-in">
        {/* Navigation */}
        <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-secondaryText hover:text-primary transition-colors mb-6 text-sm font-medium"
        >
            <ArrowLeft size={16} />
            Back to Classroom
        </button>

        <div className="flex justify-between items-start mb-8">
            <div>
                <h1 className="text-3xl font-bold text-primary mb-2">{lecture.title}</h1>
                <p className="text-secondaryText text-sm">Session completed on Nov 18, 2025</p>
            </div>
            {/* Action Buttons */}
            <div className="flex gap-3">
                <button className="bg-white border border-gray-200 text-primary px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    Share Results
                </button>
                <button className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200">
                    Export Report
                </button>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-accent/20 rounded-xl text-primary">
                    <BarChart2 size={24} />
                </div>
                <div>
                    <h3 className="text-secondaryText text-xs font-bold uppercase tracking-wider">Avg Clarity</h3>
                    <span className="text-2xl font-bold text-primary">68%</span>
                </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-red-50 rounded-xl text-red-500">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h3 className="text-secondaryText text-xs font-bold uppercase tracking-wider">Confusion Points</h3>
                    <span className="text-2xl font-bold text-primary">3 Areas</span>
                </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-xl text-green-600">
                    <CheckCircle size={24} />
                </div>
                <div>
                    <h3 className="text-secondaryText text-xs font-bold uppercase tracking-wider">Attendance</h3>
                    <span className="text-2xl font-bold text-primary">92%</span>
                </div>
            </div>
        </div>

        {/* Top Section: Clarity Chart */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-8">
            <h3 className="text-lg font-bold text-primary mb-6">Engagement & Clarity Timeline</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={slideData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorClarity" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#CCFF00" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#f0f0f0" />
                        <XAxis 
                            dataKey="slide" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#9ca3af', fontSize: 12}}
                            label={{ value: 'Slide Number', position: 'insideBottom', offset: -5, fill: '#9ca3af', fontSize: 12 }}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#9ca3af', fontSize: 12}}
                            domain={[0, 100]}
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: number) => [`${value}%`, 'Clarity']}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="clarity" 
                            stroke="#A3CC00" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorClarity)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Breakdown Section: Consistent styling with the rest of the app */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Weaknesses */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-red-50 rounded-lg text-red-500">
                        <AlertTriangle size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-primary">Needs Attention</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h4 className="font-bold text-primary text-sm">Theory & Concepts</h4>
                                <span className="text-xs text-secondaryText">Slide 2</span>
                            </div>
                            <span className="text-red-500 font-bold text-sm">40% Clarity</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-red-400 h-2 rounded-full w-[40%]"></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h4 className="font-bold text-primary text-sm">Advanced Concepts I</h4>
                                <span className="text-xs text-secondaryText">Slide 4</span>
                            </div>
                            <span className="text-red-500 font-bold text-sm">32% Clarity</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-2 rounded-full w-[32%]"></div>
                        </div>
                        <div className="mt-3 bg-red-50 p-3 rounded-lg flex items-start gap-2">
                            <Sparkles size={14} className="text-red-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-red-700">AI Tip: Students showed signs of confusion here. Try breaking down the bias-variance tradeoff into two separate diagrams.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Strengths */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-50 rounded-lg text-green-600">
                        <CheckCircle size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-primary">Classroom Wins</h3>
                </div>

                <div className="space-y-6">
                     <div>
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h4 className="font-bold text-primary text-sm">Vector Basics</h4>
                                <span className="text-xs text-secondaryText">Slide 3</span>
                            </div>
                            <span className="text-green-600 font-bold text-sm">94% Clarity</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-2 rounded-full w-[94%]"></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h4 className="font-bold text-primary text-sm">Linear Systems</h4>
                                <span className="text-xs text-secondaryText">Slide 12</span>
                            </div>
                            <span className="text-green-600 font-bold text-sm">89% Clarity</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-2 rounded-full w-[89%]"></div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
};

export default PostSessionInsights;