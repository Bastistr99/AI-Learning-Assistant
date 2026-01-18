import React from 'react';
import { ArrowLeft, Sparkles, TrendingUp, AlertTriangle, CheckCircle, BarChart2, ThumbsUp, ThumbsDown, Bot, Target } from 'lucide-react';
import { Lecture, AiIntervention } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface PostSessionInsightsProps {
  lecture: Lecture;
  onBack: () => void;
}

const PostSessionInsights: React.FC<PostSessionInsightsProps> = ({ lecture, onBack }) => {
  
  // 1. Prepare Chart Data from Real Stats
  const chartData = lecture.slides.map((slide, index) => {
      // Find matching stat or default to 0/Null if not visited
      const stat = lecture.recentSessionStats?.find(s => s.slideIndex === index);
      const score = stat ? stat.clarityScore : 0; 
      
      return {
          slide: index + 1,
          title: slide.title,
          clarity: score
      };
  });

  // 2. Calculate Aggregates
  const totalClarity = chartData.reduce((acc, curr) => acc + curr.clarity, 0);
  const visitedSlides = chartData.filter(d => d.clarity > 0).length;
  const avgClarity = visitedSlides > 0 ? Math.round(totalClarity / visitedSlides) : 0;

  const confusionPoints = chartData.filter(d => d.clarity > 0 && d.clarity < 50);
  const wins = chartData.filter(d => d.clarity >= 80);

  // Sorting for "Breakdown" sections
  const lowestPerformingSlides = [...chartData]
      .filter(d => d.clarity > 0 && d.clarity < 60)
      .sort((a, b) => a.clarity - b.clarity); // Ascending (worst first)

  const highestPerformingSlides = [...chartData]
      .filter(d => d.clarity >= 80)
      .sort((a, b) => b.clarity - a.clarity); // Descending (best first)

  // 3. AI Performance Stats
  const allInterventions: AiIntervention[] = [];
  let totalPredictionVotes = 0;
  let predictionSum = 0;

  lecture.recentSessionStats?.forEach(stat => {
      if (stat.interventions) allInterventions.push(...stat.interventions);
      if (stat.predictionAccuracy !== undefined) {
          totalPredictionVotes++;
          predictionSum += stat.predictionAccuracy;
      }
  });
  
  // Suggestion Utility Score
  const ratedInterventions = allInterventions.filter(i => i.rating !== null);
  const helpfulCount = ratedInterventions.filter(i => i.rating === 'helpful').length;
  const unhelpfulCount = ratedInterventions.filter(i => i.rating === 'unhelpful').length;
  const aiHelpfulnessScore = ratedInterventions.length > 0 
      ? Math.round((helpfulCount / ratedInterventions.length) * 100) 
      : 0;
      
  // Prediction Reliability Score
  const aiReliabilityScore = totalPredictionVotes > 0 
      ? Math.round(predictionSum / totalPredictionVotes)
      : 0;

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
                <p className="text-secondaryText text-sm">Session Completed • {lecture.slides.length} Slides</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-accent/20 rounded-xl text-primary">
                    <BarChart2 size={24} />
                </div>
                <div>
                    <h3 className="text-secondaryText text-xs font-bold uppercase tracking-wider">Avg Clarity</h3>
                    <span className="text-2xl font-bold text-primary">{avgClarity}%</span>
                </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-red-50 rounded-xl text-red-500">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h3 className="text-secondaryText text-xs font-bold uppercase tracking-wider">Confusion Points</h3>
                    <span className="text-2xl font-bold text-primary">{confusionPoints.length} Areas</span>
                </div>
            </div>
             <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                    <Bot size={24} />
                </div>
                <div>
                    <h3 className="text-secondaryText text-xs font-bold uppercase tracking-wider">AI Utility</h3>
                    <span className="text-2xl font-bold text-primary">
                        {ratedInterventions.length > 0 ? `${aiHelpfulnessScore}%` : '-'}
                    </span>
                    <span className="text-xs text-secondaryText block">suggestion quality</span>
                </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <Target size={24} />
                </div>
                <div>
                    <h3 className="text-secondaryText text-xs font-bold uppercase tracking-wider">AI Accuracy</h3>
                    <span className="text-2xl font-bold text-primary">
                        {totalPredictionVotes > 0 ? `${aiReliabilityScore}%` : '-'}
                    </span>
                    <span className="text-xs text-secondaryText block">prediction match</span>
                </div>
            </div>
        </div>

        {/* Top Section: Clarity Chart */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-8">
            <h3 className="text-lg font-bold text-primary mb-6">Engagement & Clarity Timeline</h3>
            <div className="h-[300px] w-full">
                {visitedSlides > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
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
                            height={50} // Ensure height for labels
                            label={{ value: 'Slide Number', position: 'insideBottom', offset: -10, fill: '#9ca3af', fontSize: 12 }}
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
                            labelFormatter={(label) => `Slide ${label}`}
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
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <BarChart2 size={48} className="mb-4 opacity-20" />
                        <p>No session data recorded for this lecture yet.</p>
                    </div>
                )}
            </div>
        </div>

        {/* AI Performance Breakdown */}
        {(ratedInterventions.length > 0 || totalPredictionVotes > 0) && (
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-8">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                        <Sparkles size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-primary">AI Assistant Performance</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-sm font-bold text-green-700 mb-4 flex items-center gap-2">
                            <ThumbsUp size={16} /> Helpful Suggestions ({helpfulCount})
                        </h4>
                        <ul className="space-y-3">
                            {ratedInterventions.filter(i => i.rating === 'helpful').map(i => (
                                <li key={i.id} className="text-sm bg-green-50 text-green-900 p-3 rounded-xl border border-green-100 flex justify-between items-start gap-3">
                                    <span>{i.text}</span>
                                    <span className="text-xs font-medium opacity-50 whitespace-nowrap">Slide {i.slideIndex + 1}</span>
                                </li>
                            ))}
                            {helpfulCount === 0 && <p className="text-sm text-gray-400 italic">No suggestions marked as helpful.</p>}
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="text-sm font-bold text-red-700 mb-4 flex items-center gap-2">
                             <ThumbsDown size={16} /> Unhelpful Suggestions ({unhelpfulCount})
                        </h4>
                        <ul className="space-y-3">
                             {ratedInterventions.filter(i => i.rating === 'unhelpful').map(i => (
                                <li key={i.id} className="text-sm bg-red-50 text-red-900 p-3 rounded-xl border border-red-100 flex justify-between items-start gap-3">
                                    <span>{i.text}</span>
                                    <span className="text-xs font-medium opacity-50 whitespace-nowrap">Slide {i.slideIndex + 1}</span>
                                </li>
                            ))}
                             {unhelpfulCount === 0 && <p className="text-sm text-gray-400 italic">No suggestions rejected.</p>}
                        </ul>
                    </div>
                </div>
            </div>
        )}

        {/* Breakdown Section */}
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
                    {lowestPerformingSlides.length > 0 ? (
                        lowestPerformingSlides.slice(0, 3).map((item, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <h4 className="font-bold text-primary text-sm truncate max-w-[200px]">{item.title || `Slide ${item.slide}`}</h4>
                                    <span className="text-xs text-secondaryText">Slide {item.slide}</span>
                                </div>
                                <span className="text-red-500 font-bold text-sm">{item.clarity}% Clarity</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${item.clarity}%` }}></div>
                            </div>
                            {idx === 0 && (
                                <div className="mt-3 bg-red-50 p-3 rounded-lg flex items-start gap-2">
                                    <Sparkles size={14} className="text-red-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-red-700">AI Tip: Consider adding more visual examples or slowing down on this topic in the next session.</p>
                                </div>
                            )}
                        </div>
                        ))
                    ) : (
                        <p className="text-secondaryText text-sm italic">No significant confusion points detected. Great job!</p>
                    )}
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
                     {highestPerformingSlides.length > 0 ? (
                        highestPerformingSlides.slice(0, 3).map((item, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <h4 className="font-bold text-primary text-sm truncate max-w-[200px]">{item.title || `Slide ${item.slide}`}</h4>
                                    <span className="text-xs text-secondaryText">Slide {item.slide}</span>
                                </div>
                                <span className="text-green-600 font-bold text-sm">{item.clarity}% Clarity</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${item.clarity}%` }}></div>
                            </div>
                        </div>
                        ))
                     ) : (
                        <p className="text-secondaryText text-sm italic">Keep teaching to see your top performing slides here.</p>
                     )}
                </div>
            </div>

        </div>
    </div>
  );
};

export default PostSessionInsights;