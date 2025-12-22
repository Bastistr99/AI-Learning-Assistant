import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, StopCircle, Smile, Meh, Frown, ChevronRight, ChevronLeft, Clock, AlertTriangle, Lightbulb } from 'lucide-react';
import { Lecture } from '../types';
import { analyzeClassroom } from '../services/geminiService';

interface LiveSessionProps {
  lecture: Lecture;
  onEndSession: () => void;
  onBack: () => void;
}

// Mock Slides Data
const SLIDES = [
    { id: 1, title: "Introduction to Neural Networks", content: "Architecture & Basics", notes: "Start with the biological analogy of neurons. Mention perceptrons. Ask class about their biology background." },
    { id: 2, title: "Activation Functions", content: "ReLU, Sigmoid, Tanh", notes: "Explain why linearity is a problem. Draw ReLU on the whiteboard if needed. Focus on the vanishing gradient problem briefly." },
    { id: 3, title: "Backpropagation", content: "The Chain Rule", notes: "This is the hardest part. Go slow. Use the 'hiking down a mountain' analogy for Gradient Descent." },
];

const LiveSession: React.FC<LiveSessionProps> = ({ lecture, onEndSession, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  
  // AI State
  const [clarityScore, setClarityScore] = useState<number>(90); // 0-100
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // UI State
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Camera setup
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Real-time AI Analysis Loop
  useEffect(() => {
    const analysisInterval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

      setIsAnalyzing(true);

      try {
        // 1. Capture Frame
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            // Ensure canvas matches video dimensions
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            
            ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            
            const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.8);
            const currentTopic = SLIDES[currentSlideIndex].content;

            // 2. Call Gemini Service
            const result = await analyzeClassroom(base64Image, currentTopic);

            // 3. Update State based on result
            // Gemini now returns `clarityPercent` (0-100)
            const newClarity = typeof result.clarityPercent === 'number' ? Math.max(0, Math.min(100, result.clarityPercent)) : 0;

            // Smooth transition for the chart
            setClarityScore((prev) => (prev + newClarity) / 2);
            setAiTips(result.tips || []);

            // Trigger notification if tips arrived
            if (result.tips.length > 0) {
                setToastMessage("AI Suggestions Available");
                setTimeout(() => setToastMessage(null), 5000);
            }
        }
      } catch (e) {
        console.error("Analysis loop error:", e);
      } finally {
        setIsAnalyzing(false);
      }

    }, 15000); // Analyze every 15 seconds

    return () => clearInterval(analysisInterval);
  }, [currentSlideIndex, isAnalyzing]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextSlide = () => {
    if (currentSlideIndex < SLIDES.length - 1) {
        setCurrentSlideIndex(p => p + 1);
        setAiTips([]); // Clear old tips for new slide
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
        setCurrentSlideIndex(p => p - 1);
        setAiTips([]);
    }
  };

  // Ambient UI Logic
  const getAmbientBorderClass = () => {
      if (clarityScore >= 80) return "border-l-4 border-accent"; // Lime Green
      if (clarityScore >= 60) return "border-l-4 border-yellow-500"; // Warning
      return "border-l-4 border-orange-500"; // Danger
  };

  const getSentimentIcon = () => {
      if (clarityScore >= 80) return <Smile size={32} className="text-accent" />; 
      if (clarityScore >= 60) return <Meh size={32} className="text-yellow-500" />;
      return <Frown size={32} className="text-orange-500" />;
  };

  const currentSlide = SLIDES[currentSlideIndex];
  const nextSlide = SLIDES[currentSlideIndex + 1];

  return (
    <div className="h-screen w-full bg-primary text-gray-200 flex flex-col font-sans overflow-hidden relative">
      {/* Hidden Capture Elements */}
      <video ref={videoRef} autoPlay muted playsInline className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {/* HEADER */}
      <header className="h-16 px-6 border-b border-gray-800 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400">
                  <ArrowLeft size={20} />
              </button>
              <div>
                  <h1 className="text-sm font-bold text-white tracking-wide">{lecture.title}</h1>
                  <p className="text-xs text-gray-500">Speaker View • {isAnalyzing ? 'Analyzing...' : 'Live'}</p>
              </div>
          </div>

          <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-800 rounded-full border border-gray-700">
                  <Clock size={16} className="text-accent" />
                  <span className="font-mono text-sm font-medium text-white">{formatTime(timer)}</span>
              </div>
              <button 
                onClick={() => setShowEndConfirmation(true)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              >
                <StopCircle size={16} />
                End Class
              </button>
          </div>
      </header>

      {/* MAIN GRID */}
      <div className="flex-1 p-6 grid grid-cols-12 gap-6 h-full overflow-hidden">
          
          {/* LEFT: CURRENT SLIDE (SPEAKER VIEW) - 8 COLS */}
          <div className="col-span-8 flex flex-col h-full">
               {/* Slide Container */}
               <div className={`flex-1 bg-white rounded-r-2xl rounded-l-md relative flex items-center justify-center text-primary p-12 transition-all duration-700 ${getAmbientBorderClass()}`}>
                    <div className="text-center">
                        <h2 className="text-4xl font-bold mb-6 text-primary">{currentSlide.title}</h2>
                        <p className="text-xl text-secondaryText">{currentSlide.content}</p>
                        <div className="mt-12 w-24 h-1.5 bg-gray-100 mx-auto rounded-full overflow-hidden">
                            <div className="bg-primary h-full w-2/3"></div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="absolute bottom-6 right-6 flex gap-2">
                        <button onClick={handlePrevSlide} disabled={currentSlideIndex === 0} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 disabled:opacity-50 text-primary transition-colors">
                            <ChevronLeft size={24}/>
                        </button>
                        <button onClick={handleNextSlide} disabled={currentSlideIndex === SLIDES.length - 1} className="p-3 bg-primary text-white rounded-full hover:bg-gray-700 disabled:opacity-50 transition-colors">
                            <ChevronRight size={24}/>
                        </button>
                    </div>
               </div>
               
               {/* Footer Info */}
               <div className="mt-4 flex justify-between text-gray-500 text-sm font-medium">
                   <span>Slide {currentSlideIndex + 1} of {SLIDES.length}</span>
                   {clarityScore < 60 && (
                       <span className="text-orange-400 flex items-center gap-2 animate-pulse">
                           <AlertTriangle size={14}/> 
                           Clarity dropping
                       </span>
                   )}
               </div>
          </div>

          {/* RIGHT: PERIPHERALS - 4 COLS */}
          <div className="col-span-4 flex flex-col gap-6 h-full">
              
              {/* Next Slide Preview */}
              <div className="h-1/3 bg-gray-800 rounded-2xl border border-gray-700 p-5">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Next Slide</h3>
                  {nextSlide ? (
                      <div className="bg-gray-700/50 rounded-lg h-[80%] flex items-center justify-center text-center p-4 border border-gray-600/30">
                           <div>
                                <h4 className="font-bold text-white mb-2">{nextSlide.title}</h4>
                                <p className="text-xs text-gray-400">{nextSlide.content}</p>
                           </div>
                      </div>
                  ) : (
                      <div className="bg-gray-700/50 rounded-lg h-[80%] flex items-center justify-center text-gray-500 italic">
                          End of Lecture
                      </div>
                  )}
              </div>

              {/* Speaker Notes / AI TIPS */}
              <div className="flex-1 bg-gray-800 rounded-2xl border border-gray-700 p-6 overflow-y-auto">
                   <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Speaker Notes</h3>
                   <p className="text-lg leading-relaxed text-gray-300 font-medium mb-6">
                       {currentSlide.notes}
                   </p>

                   {/* DYNAMIC AI TIPS */}
                   {aiTips.length > 0 ? (
                       <div className="mt-6 p-4 bg-orange-900/30 border-l-2 border-orange-500 rounded-r-lg animate-fade-in">
                           <h4 className="text-orange-400 font-bold text-sm mb-3 flex items-center gap-2">
                               <Lightbulb size={16}/> 
                               AI Suggestions
                           </h4>
                           <ul className="space-y-2">
                               {aiTips.map((tip, idx) => (
                                   <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                                       <span className="text-orange-500 mt-1">•</span> {tip}
                                   </li>
                               ))}
                           </ul>
                       </div>
                   ) : (
                       <div className="mt-6 p-4 bg-green-900/20 border-l-2 border-accent/50 rounded-r-lg">
                           <p className="text-xs text-accent">Classroom engagement looks good. Keep going!</p>
                       </div>
                   )}
              </div>

              {/* AI Sentiment Widget */
                console.log(clarityScore)
              }
              <div className="h-28 bg-gray-800 rounded-2xl border border-gray-700 p-6 flex items-center justify-between">
                   <div>
                       <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Live Clarity</h3>
                       <div className="flex items-baseline gap-1">
                           <span className={`text-3xl font-bold ${clarityScore < 60 ? 'text-orange-400' : 'text-white'}`}>
                               {Math.round(clarityScore)}
                           </span>
                           <span className="text-gray-600">%</span>
                       </div>
                   </div>
                   
                   <div className="flex items-center gap-4">
                       <div className="h-12 w-[1px] bg-gray-700"></div>
                       <div className="flex flex-col items-center gap-1">
                           {getSentimentIcon()}
                           <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                               {clarityScore >= 80 ? 'Good' : clarityScore >= 60 ? 'Mixed' : 'Low'}
                           </span>
                       </div>
                   </div>
              </div>
          </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-5 py-3 rounded-xl shadow-xl border border-gray-700 flex items-center gap-3 animate-fade-in-up z-50">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span className="text-sm font-medium">{toastMessage}</span>
          </div>
      )}

      {/* CONFIRMATION MODAL */}
      {showEndConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-gray-100">
                <h3 className="text-xl font-bold text-primary mb-2">End Session?</h3>
                <p className="text-secondaryText mb-8">
                    Are you sure you want to stop the live analysis? This will generate the post-lecture report.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowEndConfirmation(false)}
                        className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-secondaryText hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onEndSession}
                        className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-black transition-colors"
                    >
                        End Session
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default LiveSession;