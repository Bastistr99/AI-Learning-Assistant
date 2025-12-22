import React, { useEffect, useRef, useState } from 'react';
import { analyzeClassroom } from '../services/geminiService';
import { Sparkles, Wifi } from 'lucide-react';

const StudentView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState('Connecting...');
  const [clarity, setClarity] = useState<number | null>(null);

  // 1. Start Selfie Camera
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus('Active');
      })
      .catch(err => setStatus('Camera Error: ' + err.message));
  }, []);

  // 2. Analysis Loop (Runs locally on student phone)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        
        const base64 = canvasRef.current.toDataURL('image/jpeg', 0.7);
        
        // In a real app, you would fetch the current topic from a DB
        try {
            const result = await analyzeClassroom(base64, "General Lecture Flow");
            setClarity(result.clarityPercent);
            console.log("Sending analysis to teacher:", result);
        } catch (error) {
            alert("AI Error: " + (error as Error).message); 
        }
      }
    }, 5000); // Analyze every 5 seconds to save battery

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-full bg-primary flex flex-col items-center justify-center text-white p-6">
      {/* Hidden processing elements */}
      <video ref={videoRef} autoPlay muted playsInline className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <Wifi size={32} className="text-accent" />
      </div>

      <h1 className="text-2xl font-bold mb-2">Connected to Class</h1>
      <p className="text-gray-400 text-center mb-8">
        Your learning engagement is being analyzed anonymously to help the professor.
      </p>

      {/* Local Feedback (Optional) */}
      {clarity !== null && (
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 w-full max-w-xs text-center">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Your Status</span>
            <div className="text-2xl font-bold text-accent mt-1">
                {clarity > 70 ? 'Focused' : 'Confused'}
            </div>
        </div>
      )}
      
      <div className="mt-auto text-xs text-gray-600 flex items-center gap-2">
        <Sparkles size={12} /> Powered by Gemini AI
      </div>
    </div>
  );
};

export default StudentView;