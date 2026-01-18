import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, StopCircle, ChevronRight, ChevronLeft, Clock, AlertTriangle, Sparkles, Power, Maximize2, Minimize2, Loader2, ThumbsUp, ThumbsDown, Check, X } from 'lucide-react';
import { Lecture, SessionSlideStat, AccessibilitySettings, AiIntervention } from '../types';
import { analyzeClassroom } from '../services/geminiService';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';

// Resolve PDF.js library
GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;

interface LiveSessionProps {
  lecture: Lecture;
  globalAiEnabled: boolean;
  accessibility: AccessibilitySettings;
  onEndSession: (stats: SessionSlideStat[]) => void;
  onBack: () => void;
}

const LiveSession: React.FC<LiveSessionProps> = ({ lecture, globalAiEnabled, accessibility, onEndSession, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const webcamCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const nextSlideCanvasRef = useRef<HTMLCanvasElement>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  
  // PDF Render Task Reference (to cancel ongoing renders)
  const renderTaskRef = useRef<any>(null);
  
  // Store accumulated scores per slide: Map<SlideIndex, ArrayOfScores>
  const slideScoresRef = useRef<Map<number, number[]>>(new Map());
  
  // Store prediction accuracy votes: Map<SlideIndex, Array<boolean>> (true = accurate, false = inaccurate)
  const accuracyVotesRef = useRef<Map<number, boolean[]>>(new Map());

  // Store all generated interventions to pass to summary
  const allInterventionsRef = useRef<AiIntervention[]>([]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // AI State - Initialize with global preference
  const [isAiEnabled, setIsAiEnabled] = useState(globalAiEnabled);
  const [clarityScore, setClarityScore] = useState<number>(95); // 0-100
  
  // Feedback state for the CURRENT prediction frame
  const [currentPredictionFeedback, setCurrentPredictionFeedback] = useState<'accurate' | 'inaccurate' | null>(null);

  // We now store objects, not just strings
  const [activeTips, setActiveTips] = useState<AiIntervention[]>([]);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);

  // PDF State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(!!lecture.pdfUrl);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);

  // Safety check if slides are missing (fallback for text mode)
  const slides = lecture.slides && lecture.slides.length > 0 ? lecture.slides : [
      { id: 0, title: lecture.title, content: lecture.description, notes: "No slides content available." }
  ];

  // Load PDF on Mount
  useEffect(() => {
      const loadPdf = async () => {
          if (!lecture.pdfUrl) {
              setIsPdfLoading(false);
              return;
          }
          try {
              console.log("Loading PDF from:", lecture.pdfUrl);
              const loadingTask = getDocument({ url: lecture.pdfUrl!, verbosity: 0 });
              const doc = await loadingTask.promise;
              setPdfDoc(doc);
              setNumPages(doc.numPages);
              setPdfError(null);
          } catch (error) {
              console.error("Error loading PDF:", error);
              setPdfError("Failed to load PDF presentation.");
          } finally {
              setIsPdfLoading(false);
          }
      };
      loadPdf();
  }, [lecture.pdfUrl]);

  // Render Current Slide (PDF Page)
  useEffect(() => {
      const renderPage = async () => {
          if (!pdfDoc || !pdfCanvasRef.current || !slideContainerRef.current) return;

          // Cancel any pending render task to avoid race conditions
          if (renderTaskRef.current) {
              try {
                  renderTaskRef.current.cancel();
              } catch (e) {
                  // Ignore cancellation errors
              }
          }

          try {
              // PDF pages are 1-indexed
              const pageNumber = currentSlideIndex + 1;
              if (pageNumber > pdfDoc.numPages) return;

              const page = await pdfDoc.getPage(pageNumber);
              const canvas = pdfCanvasRef.current;
              const context = canvas.getContext('2d');
              
              if (!context) return;

              // SCALING LOGIC
              // We want the slide to fit nicely within the container (contain)
              const container = slideContainerRef.current;
              const rect = container.getBoundingClientRect();
              
              // Account for some padding
              const maxWidth = rect.width - 32;
              const maxHeight = rect.height - 32;

              const unscaledViewport = page.getViewport({ scale: 1 });
              const scaleX = maxWidth / unscaledViewport.width;
              const scaleY = maxHeight / unscaledViewport.height;
              
              // Use the smaller scale to ensure it fits (Contain)
              // Multiply by devicePixelRatio for sharp text
              const dpr = window.devicePixelRatio || 1;
              const scale = Math.min(scaleX, scaleY);
              
              const viewport = page.getViewport({ scale: scale * dpr });
              
              // Set canvas dimensions to the high-res viewport
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              
              // Use CSS to scale it back down to the logical size
              canvas.style.width = `${viewport.width / dpr}px`;
              canvas.style.height = `${viewport.height / dpr}px`;

              // Clear canvas before rendering to avoid artifacts
              context.clearRect(0, 0, canvas.width, canvas.height);

              const renderContext = {
                  canvasContext: context!,
                  viewport: viewport,
              };
              
              // Store the render task
              const task = page.render(renderContext);
              renderTaskRef.current = task;
              
              await task.promise;

          } catch (error: any) {
              if (error?.name !== 'RenderingCancelledException') {
                  console.error("Error rendering page:", error);
              }
          }
      };
      
      // Trigger render, and also re-render on resize
      renderPage();
      
      const handleResize = () => {
         // Debounce or just call renderPage
         renderPage();
      };
      window.addEventListener('resize', handleResize);

      // Cleanup function
      return () => {
           window.removeEventListener('resize', handleResize);
           if (renderTaskRef.current) {
              try {
                  renderTaskRef.current.cancel();
              } catch (e) {}
          }
      };
  }, [pdfDoc, currentSlideIndex]);

  // Render Next Slide Preview (Thumbnail)
  useEffect(() => {
      let active = true;
      const renderNextPage = async () => {
          if (!pdfDoc || !nextSlideCanvasRef.current) return;
          
          const nextPageNum = currentSlideIndex + 2; // +1 for 0-index, +1 for next
          
          const canvas = nextSlideCanvasRef.current;
          const ctx = canvas.getContext('2d');
          
          if (nextPageNum > pdfDoc.numPages) {
               ctx?.clearRect(0,0, canvas.width, canvas.height);
               return;
          }

          try {
              const page = await pdfDoc.getPage(nextPageNum);
              if (!active) return;

              // Fixed small scale for thumbnail
              const unscaledViewport = page.getViewport({ scale: 1 });
              // Target height ~100px
              const scale = 120 / unscaledViewport.height;
              const viewport = page.getViewport({ scale });
              
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              await page.render({ canvasContext: ctx!, viewport }).promise;
          } catch(e) {
              // Ignore errors for preview
          }
      }
      renderNextPage();
      return () => { active = false; };
  }, [pdfDoc, currentSlideIndex]);


  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fullscreen Listener
  useEffect(() => {
    const handleFsChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
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
    if (!isAiEnabled) {
        setIsAnalyzing(false);
        return;
    }

    const analysisInterval = setInterval(async () => {
      if (!videoRef.current || !webcamCanvasRef.current || isAnalyzing) return;

      setIsAnalyzing(true);

      try {
        // 1. Capture Webcam (Optimized for Tokens: Max Width 640px)
        const webcamCtx = webcamCanvasRef.current.getContext('2d');
        let webcamBase64 = '';
        if (webcamCtx) {
            // Downscale to 640px width to save tokens
            const MAX_WIDTH = 640;
            const scale = MAX_WIDTH / videoRef.current.videoWidth;
            const targetWidth = MAX_WIDTH;
            const targetHeight = videoRef.current.videoHeight * scale;

            webcamCanvasRef.current.width = targetWidth;
            webcamCanvasRef.current.height = targetHeight;
            
            webcamCtx.drawImage(videoRef.current, 0, 0, targetWidth, targetHeight);
            webcamBase64 = webcamCanvasRef.current.toDataURL('image/jpeg', 0.8);
        }

        // 2. Capture Slide Visual (if PDF is active)
        let slideBase64 = undefined;
        if (lecture.pdfUrl && pdfCanvasRef.current) {
            slideBase64 = pdfCanvasRef.current.toDataURL('image/jpeg', 0.6); 
        }

        // 3. Get Context Text
        const currentTopic = slides[currentSlideIndex]?.content || slides[currentSlideIndex]?.title || "General Lecture";

        // Call Gemini (simulate = false for REAL analysis)
        const result = await analyzeClassroom(webcamBase64, currentTopic, false, slideBase64);

        // Map Confusion (0-10) to Clarity % (100-0)
        const newClarity = Math.max(0, Math.min(100, (10 - result.confusionScore) * 10));
        
        setClarityScore(newClarity);
        
        // Reset prediction feedback UI for the new frame
        setCurrentPredictionFeedback(null);
        
        // 4. Handle Suggestions (PERSISTENT)
        if (result.tips && result.tips.length > 0) {
            // Check for duplicates before adding
            setActiveTips(prevTips => {
                const existingTexts = new Set(prevTips.map(t => t.text));
                const uniqueNewTips = result.tips.filter(t => !existingTexts.has(t));
                
                const newInterventionObjects: AiIntervention[] = uniqueNewTips.map((text, idx) => ({
                    id: `tip-${Date.now()}-${idx}`,
                    text: text,
                    timestamp: Date.now(),
                    slideIndex: currentSlideIndex,
                    rating: null
                }));

                // Add to history
                newInterventionObjects.forEach(tip => allInterventionsRef.current.push(tip));
                
                return [...prevTips, ...newInterventionObjects];
            });
        }
        // Note: We DO NOT clear tips if result.tips is empty. They stay until slide changes or manually dismissed.

        // RECORD STATS
        const currentScores = slideScoresRef.current.get(currentSlideIndex) || [];
        currentScores.push(newClarity);
        slideScoresRef.current.set(currentSlideIndex, currentScores);

      } catch (e) {
        console.error("Analysis loop error:", e);
      } finally {
        setIsAnalyzing(false);
      }

    }, 60000); 

    return () => clearInterval(analysisInterval);
  }, [currentSlideIndex, isAnalyzing, isAiEnabled, slides, lecture.pdfUrl]);

  // Handle rating the CLARITY PREDICTION itself
  const handleRatePrediction = (isAccurate: boolean) => {
      setCurrentPredictionFeedback(isAccurate ? 'accurate' : 'inaccurate');
      
      const currentVotes = accuracyVotesRef.current.get(currentSlideIndex) || [];
      currentVotes.push(isAccurate);
      accuracyVotesRef.current.set(currentSlideIndex, currentVotes);
  };

  // Handle rating the TIPS
  const handleRateTip = (id: string, rating: 'helpful' | 'unhelpful') => {
      // 1. Update Active View
      setActiveTips(prev => prev.map(tip => 
          tip.id === id ? { ...tip, rating } : tip
      ));

      // 2. Update History Ref (The Single Source of Truth for Insights)
      const index = allInterventionsRef.current.findIndex(t => t.id === id);
      if (index !== -1) {
          allInterventionsRef.current[index].rating = rating;
      }
  };

  const handleDismissTip = (id: string) => {
       setActiveTips(prev => prev.filter(t => t.id !== id));
  };

  const handleEndClass = () => {
    // Calculate averages per slide
    const stats: SessionSlideStat[] = [];
    const maxSlides = Math.max(slides.length, numPages);

    for (let i = 0; i < maxSlides; i++) {
        // Clarity Average
        const scores = slideScoresRef.current.get(i);
        let avgScore = 0;
        if (scores && scores.length > 0) {
            avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        }

        // Prediction Accuracy Calculation
        const votes = accuracyVotesRef.current.get(i);
        let accuracyPct = undefined;
        if (votes && votes.length > 0) {
            const positiveVotes = votes.filter(v => v).length;
            accuracyPct = Math.round((positiveVotes / votes.length) * 100);
        }

        // Attach interventions for this slide
        const slideInterventions = allInterventionsRef.current.filter(inv => inv.slideIndex === i);
        
        stats.push({
            slideIndex: i,
            clarityScore: Math.round(avgScore),
            interventions: slideInterventions,
            predictionAccuracy: accuracyPct
        });
    }

    onEndSession(stats);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextSlide = () => {
    const max = Math.max(slides.length, numPages);
    if (currentSlideIndex < max - 1) {
        setCurrentSlideIndex(p => p + 1);
        setActiveTips([]); // Clear tips on slide change
        setCurrentPredictionFeedback(null); // Reset feedback UI
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
        setCurrentSlideIndex(p => p - 1);
        setActiveTips([]);
        setCurrentPredictionFeedback(null);
    }
  };

  const toggleFullScreen = () => {
    if (!slideContainerRef.current) return;

    if (!document.fullscreenElement) {
        slideContainerRef.current.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
  };

  const currentSlide = slides[currentSlideIndex] || { title: `Slide ${currentSlideIndex + 1}`, content: '', notes: '' };
  const nextSlide = slides[currentSlideIndex + 1];

  const getBarColor = (score: number) => {
    const isColorBlind = accessibility.colorBlindMode;
    if (score >= 70) return isColorBlind ? "bg-blue-500" : "bg-accent"; 
    if (score >= 50) return isColorBlind ? "bg-slate-400" : "bg-yellow-400"; 
    return isColorBlind ? "bg-orange-500" : "bg-red-500"; 
  };

  const getStatusText = (score: number) => {
      const isColorBlind = accessibility.colorBlindMode;
      if (score >= 70) return { text: 'Excellent', color: isColorBlind ? 'text-blue-600' : 'text-green-600' };
      if (score >= 50) return { text: 'Moderate', color: isColorBlind ? 'text-slate-500' : 'text-yellow-600' };
      return { text: 'Confusion', color: isColorBlind ? 'text-orange-600' : 'text-red-500' };
  };

  const getBarWidth = (score: number) => {
      return `${Math.max(5, score)}%`;
  };

  return (
    <div className="h-screen w-full bg-background text-primary flex flex-col font-sans overflow-hidden relative selection:bg-accent selection:text-primary">
      {/* Hidden Capture Elements */}
      <video ref={videoRef} autoPlay muted playsInline className="hidden" />
      <canvas ref={webcamCanvasRef} className="hidden" />

      {/* HEADER */}
      <header className="h-20 px-8 flex items-center justify-between bg-surface border-b border-gray-200 shadow-sm z-20 shrink-0">
          <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-primary">
                  <ArrowLeft size={20} />
              </button>
              <div>
                  <h1 className="text-lg font-bold text-primary tracking-tight">{lecture.title}</h1>
                  <p className="text-xs text-secondaryText flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      Live Session
                  </p>
              </div>
          </div>

          <div className="flex items-center gap-6">
              {/* AI Toggle */}
              <div 
                className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-300 cursor-pointer ${isAiEnabled ? 'bg-primary text-white border-primary' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                onClick={() => {
                    setIsAiEnabled(!isAiEnabled);
                }}
              >
                 <div className={`p-1 rounded-full ${isAiEnabled ? 'bg-accent text-primary' : 'bg-gray-300 text-white'}`}>
                    <Power size={14} strokeWidth={3} />
                 </div>
                 <span className={`text-sm font-bold`}>
                    AI Assistant {isAiEnabled ? 'On' : 'Off'}
                 </span>
              </div>

              <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>

              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 shadow-sm text-primary">
                  <Clock size={16} className="text-gray-400" />
                  <span className="font-mono text-sm font-medium">{formatTime(timer)}</span>
              </div>
              
              <button 
                onClick={() => setShowEndConfirmation(true)}
                className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
              >
                <StopCircle size={18} />
                End
              </button>
          </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden bg-background">
          
          {/* LEFT: SLIDE DISPLAY (Main Visual) */}
          <div className="flex-1 flex flex-col h-full p-8 overflow-hidden min-w-0">
               {/* Slide Container */}
               <div ref={slideContainerRef} className="flex-1 bg-surface rounded-3xl shadow-sm border border-gray-200 relative flex flex-col items-center justify-center transition-all group overflow-hidden bg-gray-50">
                    
                    {/* PDF RENDERING LAYER */}
                    {lecture.pdfUrl ? (
                         <div className="w-full h-full flex items-center justify-center p-4 relative">
                              {isPdfLoading && (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20">
                                      <Loader2 size={48} className="animate-spin mb-4 text-primary" />
                                      <p className="text-sm font-bold text-gray-500">Loading Presentation...</p>
                                  </div>
                              )}
                              
                              {pdfError && (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 text-center p-8">
                                      <div className="p-4 bg-red-50 rounded-full mb-4 text-red-500"><AlertTriangle size={32}/></div>
                                      <h3 className="text-lg font-bold text-primary mb-2">Presentation Load Error</h3>
                                      <p className="text-gray-500">{pdfError}</p>
                                  </div>
                              )}

                              <canvas 
                                ref={pdfCanvasRef} 
                                className="shadow-2xl rounded-sm bg-white" 
                              />
                         </div>
                    ) : (
                        /* Text Fallback (Only if no PDF) */
                        <div className="w-full max-w-4xl flex flex-col items-center justify-center text-center my-auto p-16">
                            <h2 className="text-5xl font-bold mb-8 text-primary tracking-tight leading-tight">{currentSlide.title}</h2>
                            <p className="text-2xl text-secondaryText font-light">{currentSlide.content}</p>
                            <div className="mt-16 w-32 h-2 bg-gray-100 rounded-full overflow-hidden mx-auto">
                                <div className="bg-accent h-full w-1/2"></div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Controls */}
                    <div className="absolute bottom-8 right-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                        <button onClick={handlePrevSlide} disabled={currentSlideIndex === 0} className="p-4 bg-gray-50/90 backdrop-blur border border-gray-200 rounded-full hover:bg-gray-100 disabled:opacity-50 text-primary transition-all shadow-lg">
                            <ChevronLeft size={24}/>
                        </button>
                        <button onClick={handleNextSlide} disabled={currentSlideIndex === (Math.max(slides.length, numPages) - 1)} className="p-4 bg-primary/90 backdrop-blur text-accent shadow-lg shadow-primary/10 rounded-full hover:bg-gray-800 disabled:opacity-50 transition-all">
                            <ChevronRight size={24}/>
                        </button>
                    </div>

                    <button 
                        onClick={toggleFullScreen}
                        className="absolute bottom-8 left-8 p-4 text-gray-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 bg-white/50 backdrop-blur rounded-xl z-30"
                    >
                        {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                    </button>
               </div>
               
               <div className="flex justify-between items-center px-4 mt-4">
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Slide {currentSlideIndex + 1} / {Math.max(slides.length, numPages)}</span>
               </div>
          </div>

          {/* RIGHT: AI SIDEBAR */}
          <div className="w-80 flex flex-col gap-4 p-6 border-l border-gray-100 bg-surface/50 h-full overflow-hidden shrink-0">
              
              {/* CLARITY WIDGET (PROGRESS BAR) */}
              {isAiEnabled && (
                <div className="bg-surface rounded-3xl p-6 border border-gray-200 shadow-sm relative overflow-hidden animate-fade-in-up shrink-0">
                    <div className="flex justify-between items-end mb-4 relative z-10">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles size={14} className="text-primary" />
                            Live Clarity
                        </h3>
                        {isAnalyzing && <Loader2 size={14} className="animate-spin text-gray-400" />}
                    </div>
                    
                    <div className="w-full h-12 bg-gray-100 rounded-xl relative overflow-hidden flex items-center mb-3">
                        <div 
                                className={`h-full transition-all duration-1000 ease-out flex items-center justify-end pr-3 ${getBarColor(clarityScore)}`} 
                                style={{ 
                                    width: getBarWidth(clarityScore),
                                    backgroundImage: accessibility.colorBlindMode && clarityScore < 60 ? 
                                        'repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(255,255,255,0.2) 4px, rgba(255,255,255,0.2) 8px)' : 'none'
                                }}
                        >
                                <span className="text-sm font-bold text-primary mix-blend-multiply opacity-90">
                                    {Math.round(clarityScore)}%
                                </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-medium text-secondaryText relative z-10 mb-4">
                        <span>Status:</span>
                        <span className={`font-bold ${getStatusText(clarityScore).color}`}>
                            {getStatusText(clarityScore).text}
                        </span>
                    </div>

                    {/* PREDICTION FEEDBACK CONTROLS */}
                    <div className="border-t border-gray-100 pt-3">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Is this score accurate?</p>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => handleRatePrediction(true)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                                    currentPredictionFeedback === 'accurate' 
                                    ? 'bg-green-500 text-white shadow-md scale-[1.02]' 
                                    : 'bg-gray-50 text-gray-500 hover:bg-green-50 hover:text-green-600'
                                }`}
                             >
                                 <Check size={14} strokeWidth={3} /> Yes
                             </button>
                             <button 
                                onClick={() => handleRatePrediction(false)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                                    currentPredictionFeedback === 'inaccurate' 
                                    ? 'bg-red-500 text-white shadow-md scale-[1.02]' 
                                    : 'bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600'
                                }`}
                             >
                                 <X size={14} strokeWidth={3} /> No
                             </button>
                        </div>
                    </div>
                </div>
              )}

              {/* SPEAKER NOTES */}
              {currentSlide.notes && (
                <div className="bg-surface rounded-3xl p-6 border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col transition-all duration-300">
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Speaker Notes</h3>
                     <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                          <p className="text-sm text-primary font-medium leading-relaxed">
                              {currentSlide.notes}
                          </p>
                     </div>
                </div>
              )}

              {/* DYNAMIC AI SUGGESTIONS (PERSISTENT LIST) */}
              {isAiEnabled && activeTips.length > 0 && (
                <div className="bg-red-50 rounded-3xl border border-red-100 shadow-sm animate-fade-in-up shrink-0 max-h-80 flex flex-col overflow-hidden">
                    <div className="p-6 pb-3 flex items-center justify-between text-red-600 shrink-0 bg-red-50 z-10">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={20} fill="currentColor" className="text-red-100" />
                            <h4 className="font-bold text-sm">Interventions ({activeTips.length})</h4>
                        </div>
                    </div>
                    <div className="overflow-y-auto p-6 pt-0 custom-scrollbar flex-1">
                        <ul className="space-y-3">
                            {activeTips.map((tip) => (
                                <li key={tip.id} className="text-xs text-red-900 bg-white p-3 rounded-xl border border-red-100 leading-snug shadow-sm flex flex-col gap-2 group relative">
                                    <button 
                                        onClick={() => handleDismissTip(tip.id)}
                                        className="absolute top-2 right-2 text-red-200 hover:text-red-400"
                                    >
                                        <div className="sr-only">Dismiss</div>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                    <span className="pr-4">{tip.text}</span>
                                    {/* Grading Buttons */}
                                    <div className="flex gap-2 pt-1 border-t border-red-50">
                                        <button 
                                            onClick={() => handleRateTip(tip.id, 'helpful')}
                                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-bold transition-colors ${tip.rating === 'helpful' ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-50 hover:bg-green-50 text-green-700'}`}
                                        >
                                            <ThumbsUp size={12} /> Useful
                                        </button>
                                        <button 
                                            onClick={() => handleRateTip(tip.id, 'unhelpful')}
                                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-bold transition-colors ${tip.rating === 'unhelpful' ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-50 hover:bg-red-50 text-red-700'}`}
                                        >
                                            <ThumbsDown size={12} /> Ignore
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
              )}
              
              {/* NEXT SLIDE PREVIEW */}
              <div className="bg-surface rounded-3xl p-6 border border-gray-200 shadow-sm h-32 opacity-80 hover:opacity-100 transition-opacity cursor-not-allowed shrink-0 overflow-hidden flex flex-col">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Up Next</h3>
                  
                  {lecture.pdfUrl && pdfDoc ? (
                       <div className="flex-1 w-full bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                           <canvas ref={nextSlideCanvasRef} className="max-w-full max-h-full" />
                       </div>
                  ) : nextSlide ? (
                       <div className="text-xs font-bold text-primary truncate">{nextSlide.title}</div>
                  ) : (
                       <div className="text-xs text-gray-400 italic">End of Presentation</div>
                  )}
              </div>

          </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {showEndConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100">
                <h3 className="text-xl font-bold text-primary mb-2">End Session?</h3>
                <p className="text-secondaryText mb-8 text-sm">
                    This will stop the AI analysis and generate your post-lecture insights report.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowEndConfirmation(false)}
                        className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-secondaryText hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleEndClass}
                        className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
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