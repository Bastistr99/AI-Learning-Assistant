import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, StopCircle, ChevronRight, ChevronLeft, Clock, AlertTriangle, Lightbulb, Sun, Moon } from 'lucide-react';
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
  const [clarityScore, setClarityScore] = useState<number>(90); 
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // UI State
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Camera setup (Hidden for analysis only)
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };
    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Real-time AI Analysis Loop
  useEffect(() => {
    console.log('🔄 [LiveSession] Analysis loop mounted for slide:', currentSlideIndex);
    const analysisInterval = setInterval(async () => {
      console.log('⏱️ [LiveSession] Analysis tick - video:', !!videoRef.current, 'canvas:', !!canvasRef.current, 'analyzing:', isAnalyzing);
      if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

      setIsAnalyzing(true);

      try {
        // 1. Capture Frame
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            // Ensure canvas matches video dimensions
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            console.log('🎥 [LiveSession] Canvas captured:', canvasRef.current.width, 'x', canvasRef.current.height);
            
            ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            
            const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.8);
            const currentTopic = SLIDES[currentSlideIndex].content;
            console.log('📹 [LiveSession] Calling analyzeClassroom for topic:', currentTopic);

            // 2. Call Gemini Service
            const result = await analyzeClassroom(base64Image, currentTopic);
            console.log('✅ [LiveSession] Analysis result received:', result);

            // 3. Update State based on result
            // Gemini now returns `clarityPercent` (0-100)
            const newClarity = typeof result.clarityPercent === 'number' ? Math.max(0, Math.min(100, result.clarityPercent)) : 0;

            // Use Gemini output directly
            setClarityScore(newClarity);
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
    if (currentSlideIndex < SLIDES.length - 1) setCurrentSlideIndex(p => p + 1);
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) setCurrentSlideIndex(p => p - 1);
  };

  // Ambient UI Logic - REDESIGNED: Static, Left-Border Only, No Blinking
  const getAmbientBorderClass = () => {
      if (clarityScore >= 80) return "border-l-4 border-accent"; // Lime Green (Consistent with App)
      if (clarityScore >= 60) return "border-l-4 border-yellow-500"; // Warning Yellow
      return "border-l-4 border-orange-500"; // Static Orange (No Pulse)
  };

  const getClarityColorClass = () => {
      if (clarityScore >= 80) return "bg-accent"; // Lime Green
      if (clarityScore >= 60) return "bg-yellow-500";
      return "bg-orange-500";
  }

  const currentSlide = SLIDES[currentSlideIndex];
  const nextSlide = SLIDES[currentSlideIndex + 1];

  return (
    <div className={`h-screen w-full flex flex-col font-sans overflow-hidden relative ${isDarkMode ? 'bg-primary text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
      {/* Hidden Data Source */}
      <video ref={videoRef} autoPlay muted className="hidden" />
      <canvas ref={canvasRef} width={640} height={480} className="hidden" />

      {/* HEADER */}
      <header className={`h-16 px-6 border-b flex items-center justify-between ${isDarkMode ? 'bg-black/20 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-4">
              <button onClick={onBack} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}>
                  <ArrowLeft size={20} />
              </button>
              <div>
                  <h1 className={`text-sm font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-primary'}`}>{lecture.title}</h1>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Speaker View</p>
              </div>
          </div>

          <div className="flex items-center gap-6">
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-200 border-gray-300'}`}>
                  <Clock size={16} className="text-accent" />
                  <span className={`font-mono text-sm font-medium ${isDarkMode ? 'text-white' : 'text-primary'}`}>{formatTime(timer)}</span>
              </div>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={() => setShowEndConfirmation(true)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isDarkMode ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20' : 'text-red-500 bg-red-100 hover:bg-red-200 border border-red-200'}`}
              >
                <StopCircle size={16} />
                End Class
              </button>
          </div>
      </header>

      {/* MAIN GRID */}
      <div className="flex-1 p-6 grid grid-cols-10 gap-6 h-full overflow-hidden">
          
          {/* LEFT: CURRENT SLIDE (SPEAKER VIEW) - 7 COLS */}
          <div className="col-span-7 flex flex-col h-full">
               {/* Slide Container: White background, subtle left border status indicator */}
               <div className={`flex-1 rounded-r-2xl rounded-l-md relative flex items-center justify-center p-12 transition-colors duration-500 ${getAmbientBorderClass()} ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-primary'}`}>
                    <div className="text-center">
                        <h2 className={`text-4xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-primary'}`}>{currentSlide.title}</h2>
                        <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-secondaryText'}`}>{currentSlide.content}</p>
                        <div className={`mt-12 w-24 h-1.5 mx-auto rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <div className={`h-full w-2/3 ${isDarkMode ? 'bg-accent' : 'bg-primary'}`}></div>
                        </div>
                    </div>

                    {/* Slide Navigation Controls */}
                    <div className="absolute bottom-6 right-6 flex gap-2">
                        <button onClick={handlePrevSlide} disabled={currentSlideIndex === 0} className={`p-3 rounded-full disabled:opacity-50 transition-colors ${isDarkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}>
                            <ChevronLeft size={24}/>
                        </button>
                        <button onClick={handleNextSlide} disabled={currentSlideIndex === SLIDES.length - 1} className={`p-3 rounded-full disabled:opacity-50 transition-colors ${isDarkMode ? 'bg-primary text-white hover:bg-gray-700' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`}>
                            <ChevronRight size={24}/>
                        </button>
                    </div>
               </div>
               
               {/* Current Slide Footer Info */}
               <div className={`mt-4 flex justify-between text-sm font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                   <span>Slide {currentSlideIndex + 1} of {SLIDES.length}</span>
                   {clarityScore < 60 && (
                       <span className="text-orange-400 flex items-center gap-2">
                           <AlertTriangle size={14}/> 
                           Clarity dropping
                       </span>
                   )}
               </div>
          </div>

          {/* RIGHT: PERIPHERALS - 3 COLS */}
          <div className="col-span-3 flex flex-col gap-6 h-full">
              
              {/* Next Slide Preview */}
              <div className={`h-1/3 rounded-2xl border p-5 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Next Slide</h3>
                  {nextSlide ? (
                      <div className={`rounded-lg h-[80%] flex items-center justify-center text-center p-4 border ${isDarkMode ? 'bg-gray-700/50 border-gray-600/30' : 'bg-gray-100/50 border-gray-200/30'}`}>
                           <div>
                                <h4 className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-primary'}`}>{nextSlide.title}</h4>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{nextSlide.content}</p>
                           </div>
                      </div>
                  ) : (
                      <div className={`rounded-lg h-[80%] flex items-center justify-center italic ${isDarkMode ? 'bg-gray-700/50 text-gray-500' : 'bg-gray-100/50 text-gray-400'}`}>
                          End of Lecture
                      </div>
                  )}
              </div>

              {/* Speaker Notes */}
              <div className={`flex-1 rounded-2xl border p-6 overflow-y-auto ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                   <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Speaker Notes</h3>
                   <p className={`text-lg leading-relaxed font-medium ${isDarkMode ? 'text-gray-300' : 'text-secondaryText'}`}>
                       {currentSlide.notes}
                   </p>
                   {/* Contextual Smart Cue - Static */}
                   {clarityScore < 60 && (
                       <div className={`mt-6 p-4 border-l-2 rounded-r-lg ${isDarkMode ? 'bg-orange-900/20 border-orange-500/50' : 'bg-orange-100/50 border-orange-300'}`}>
                           <h4 className="text-orange-400 font-bold text-sm mb-1 flex items-center gap-2">
                               <AlertTriangle size={14}/> 
                               Suggestion
                           </h4>
                           <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-orange-900'}`}>Students seem confused. Try explaining the "Vanishing Gradient" again with a diagram.</p>
                       </div>
                   )}
              </div>

              {/* AI Clarity Meter */}
              <div className={`h-28 rounded-2xl border p-6 flex flex-col justify-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                   <div className="flex justify-between items-baseline mb-2">
                       <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Clarity</h3>
                       <span className={`text-xl font-bold ${clarityScore < 60 ? 'text-orange-400' : isDarkMode ? 'text-white' : 'text-primary'}`}>
                           {Math.round(clarityScore)}%
                       </span>
                   </div>
                   <div className={`w-full rounded-full h-2.5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                       <div 
                         className={`h-2.5 rounded-full transition-all duration-500 ${getClarityColorClass()}`}
                         style={{ width: `${clarityScore}%` }}
                       ></div>
                   </div>
              </div>
          </div>
      </div>

      {/* TOAST NOTIFICATION (Subtle, No Pulse) */}
      {toastMessage && (
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl shadow-xl border flex items-center gap-3 animate-fade-in-up z-50 ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-800 border-gray-200'}`}>
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span className="text-sm font-medium">{toastMessage}</span>
          </div>
      )}

      {/* CONFIRMATION MODAL */}
      {showEndConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className={`rounded-2xl p-8 max-w-sm w-full shadow-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-primary'}`}>End Session?</h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-secondaryText'} mb-8`}>
                    Are you sure you want to stop the live analysis? This will generate the post-lecture report.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowEndConfirmation(false)}
                        className={`flex-1 py-3 rounded-xl border font-bold transition-colors ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-secondaryText hover:bg-gray-50'}`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onEndSession}
                        className={`flex-1 py-3 rounded-xl bg-primary text-white font-bold transition-colors ${isDarkMode ? 'hover:bg-black' : 'hover:bg-gray-800'}`}
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