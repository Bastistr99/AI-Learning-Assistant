import React, { useState, useRef } from 'react';
import { Lecture, Course, Slide } from '../types';
import { Search, Filter, MoreHorizontal, Folder, ArrowLeft, FileText, Calendar, ChevronRight, X, Play, BarChart2, Plus, Upload, Loader2, Wand2 } from 'lucide-react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import JSZip from 'jszip';
// We no longer strictly need generateLectureFromText for file imports, 
// but keeping it imported if you want to add "Paste Text" feature later.
// import { generateLectureFromText } from '../services/geminiService';

// Configure PDF.js worker
GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;

interface LecturesListProps {
  lectures: Lecture[];
  courses: Course[];
  selectedCourse: Course | null; 
  onSelectCourse: (course: Course | null) => void;
  onStartSession: (lecture: Lecture) => void;
  onViewInsights: (lecture: Lecture) => void;
  onAddCourse: (title: string) => void;
  onImportLecture: (courseId: string, lectureData: any) => void;
}

const LecturesList: React.FC<LecturesListProps> = ({ 
    lectures, 
    courses, 
    selectedCourse, 
    onSelectCourse, 
    onStartSession, 
    onViewInsights, 
    onAddCourse,
    onImportLecture
}) => {
  const [modalLecture, setModalLecture] = useState<Lecture | null>(null);
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  
  // Import Flow State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCourseTitle.trim()) {
        onAddCourse(newCourseTitle);
        setNewCourseTitle('');
        setShowNewCourseModal(false);
    }
  }

  // DIRECT MAPPING: 1 PDF Page = 1 Slide
  const extractSlidesFromPDF = async (file: File): Promise<Slide[]> => {
      setProcessingStatus('Analyzing Layout...');
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument(arrayBuffer).promise;
      const slides: Slide[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          // We still extract text for AI context, but the visual will be the PDF page itself
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          
          slides.push({
              id: i,
              title: `Page ${i}`,
              content: pageText.trim() || 'Visual Slide', 
              notes: '' 
          });
      }
      return slides;
  }

  // DIRECT MAPPING: 1 PPT Slide = 1 Slide
  const extractSlidesFromPPTX = async (file: File): Promise<Slide[]> => {
    setProcessingStatus('Reading PowerPoint...');
    const zip = await JSZip.loadAsync(file);
    
    // Find all slide XML files
    const slideParams: {name: string, id: number}[] = [];
    
    zip.folder("ppt/slides")?.forEach((relativePath, file) => {
        if (relativePath.match(/^slide\d+\.xml$/)) {
             const idMatch = relativePath.match(/\d+/);
             const id = idMatch ? parseInt(idMatch[0]) : 0;
             slideParams.push({ name: relativePath, id });
        }
    });

    // Sort by slide number (slide1.xml, slide2.xml...)
    slideParams.sort((a, b) => a.id - b.id);

    const parser = new DOMParser();
    const slides: Slide[] = [];

    setProcessingStatus('Processing Slides...');
    for (const slide of slideParams) {
        const content = await zip.file(`ppt/slides/${slide.name}`)?.async("string");
        if (content) {
            const xmlDoc = parser.parseFromString(content, "application/xml");
            // Extract text from <a:t> tags
            const textNodes = xmlDoc.getElementsByTagName("a:t");
            let slideText = '';
            for (let i = 0; i < textNodes.length; i++) {
                slideText += textNodes[i].textContent + ' ';
            }
            
            slides.push({
                id: slide.id,
                title: `Slide ${slide.id}`,
                content: slideText.trim() || 'Visual Content',
                notes: ''
            });
        }
    }

    return slides;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !selectedCourse) return;

      // Create a Blob URL for preview
      const url = URL.createObjectURL(file);
      setPreviewFile(file);
      setPreviewUrl(url);

      // Reset input so the same file can be selected again if cancelled
      e.target.value = '';
  }

  const handleCancelImport = () => {
      setPreviewFile(null);
      setPreviewUrl(null);
  }

  const handleProcessImport = async () => {
      if (!previewFile || !selectedCourse) return;

      const file = previewFile;
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      const persistentUrl = previewUrl; 

      setIsProcessing(true);
      setProcessingStatus('Initializing...');

      try {
          let slides: Slide[] = [];

          if (fileExtension === 'pdf') {
              slides = await extractSlidesFromPDF(file);
          } 
          else if (fileExtension === 'pptx') {
              slides = await extractSlidesFromPPTX(file);
          }
          else {
              throw new Error("Unsupported file type");
          }

          if (slides.length === 0) {
              throw new Error("No slides found in document");
          }

          setProcessingStatus('Preparing Presentation Slides...');
          
          // Create simple lecture object without heavy AI generation
          const lectureData = {
              title: file.name.replace(/\.[^/.]+$/, ""),
              description: `Imported from ${file.name} (${slides.length} slides)`,
              slides: slides,
              pdfUrl: (fileExtension === 'pdf' && persistentUrl) ? persistentUrl : undefined,
              pdfBlob: file // Pass the file blob for DB persistence
          };

          // Import
          onImportLecture(selectedCourse.id, lectureData);
          
          // Clear local state
          setPreviewFile(null);
          setPreviewUrl(null);
          
      } catch (error) {
          console.error(error);
          alert("Failed to process file. Ensure it is a valid PDF or PPTX.");
          handleCancelImport();
      } finally {
          setIsProcessing(false);
          setProcessingStatus('');
      }
  }

  return (
    <div className="p-4 md:p-10 w-full max-w-7xl mx-auto animate-fade-in relative">
      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[70] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center">
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center text-center max-w-sm">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-accent/30 rounded-full animate-ping"></div>
                    <div className="relative bg-white p-4 rounded-full border-2 border-accent">
                        <Wand2 size={32} className="text-primary animate-pulse" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">Setting up Classroom</h3>
                <p className="text-secondaryText text-sm mb-4">
                   {processingStatus}
                </p>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full rounded-full animate-loading-bar w-2/3"></div>
                </div>
            </div>
        </div>
      )}

      {/* IMPORT PREVIEW MODAL */}
      {previewFile && !isProcessing && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-surface shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-primary">Import Document</h3>
                            <p className="text-xs text-secondaryText">{previewFile.name}</p>
                        </div>
                    </div>
                    <button onClick={handleCancelImport} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                {/* PDF Preview Area */}
                <div className="flex-1 bg-gray-50 relative overflow-hidden flex flex-col items-center justify-center p-4">
                    {previewFile.name.toLowerCase().endsWith('.pdf') && previewUrl ? (
                         <iframe 
                            src={previewUrl} 
                            className="w-full h-full rounded-xl shadow-sm border border-gray-200"
                            title="PDF Preview" 
                         />
                    ) : (
                        <div className="text-center p-8 max-w-md">
                            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <FileText size={32} />
                            </div>
                            <h4 className="text-primary font-bold mb-2">Ready to Import</h4>
                            <p className="text-secondaryText text-sm mb-6">
                                We will create a lecture from <strong>{previewFile.name}</strong>.
                                <br/>The file will serve as your presentation slides.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-surface flex justify-end gap-3 shrink-0">
                    <button 
                        onClick={handleCancelImport}
                        className="px-6 py-3 rounded-xl border border-gray-200 font-bold text-secondaryText hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleProcessImport}
                        className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Create Lecture
                    </button>
                </div>
            </div>
          </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
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
        
        {selectedCourse ? (
             <div className="flex gap-2">
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-primary text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 flex items-center gap-2"
                 >
                    <Upload size={16} /> Import (PDF / PPTX)
                 </button>
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".pdf, .pptx" 
                    onChange={handleFileChange}
                 />
             </div>
        ) : (
            <button 
                onClick={() => setShowNewCourseModal(true)}
                className="bg-primary text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 flex items-center gap-2"
            >
                <Plus size={16} /> New Course
            </button>
        )}
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
            <span className="hidden md:inline">Filter</span>
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
             {/* Empty State / Add New Card Visual */}
             <button 
                onClick={() => setShowNewCourseModal(true)}
                className="rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center gap-4 text-gray-400 hover:border-gray-300 hover:text-primary transition-all"
             >
                 <Plus size={32} />
                 <span className="font-medium">Add Course</span>
             </button>
        </div>
      )}

      {/* VIEW: Lectures List (Inside a Course) */}
      {selectedCourse && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                    <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50">
                        <th className="p-5 font-semibold">Lecture Title</th>
                        <th className="p-5 font-semibold">Date Created</th>
                        <th className="p-5 font-semibold">Slides</th>
                        <th className="p-5 font-semibold">Clarity Score</th>
                        <th className="p-5 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredLectures.map((lecture) => {
                        // Calculate average clarity from stats
                        const avgClarity = lecture.recentSessionStats && lecture.recentSessionStats.length > 0
                            ? Math.round(lecture.recentSessionStats.reduce((acc, curr) => acc + curr.clarityScore, 0) / lecture.recentSessionStats.length)
                            : 0;

                        return (
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
                                    <div className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">
                                        {lecture.slides ? lecture.slides.length : 0}
                                    </div>
                                </div>
                            </td>
                            <td className="p-5">
                                <div className="flex items-center gap-2">
                                    <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                        <div style={{ width: `${avgClarity}%` }} className={`h-full rounded-full ${avgClarity >= 50 ? 'bg-accent' : 'bg-red-400'}`} />
                                    </div>
                                    <span className="text-xs font-bold text-primary">{avgClarity > 0 ? `${avgClarity}%` : '-'}</span>
                                </div>
                            </td>
                            <td className="p-5 text-right">
                                <button className="p-2 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-primary transition-colors">
                                    <ChevronRight size={20} />
                                </button>
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
            
            {filteredLectures.length === 0 && (
                <div className="p-10 text-center text-gray-400">
                    <p>No lectures found. Import a PDF or PPTX file to get started.</p>
                </div>
            )}
        </div>
      )}

      {/* NEW COURSE MODAL */}
      {showNewCourseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-fade-in-up">
                  <h3 className="text-xl font-bold text-primary mb-4">Create New Course</h3>
                  <form onSubmit={handleCreateCourse}>
                      <input 
                        type="text" 
                        placeholder="Course Title (e.g., Biology 101)"
                        className="w-full border border-gray-200 rounded-xl p-3 mb-6 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        autoFocus
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                      />
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setShowNewCourseModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-secondaryText hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-gray-800">Create</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* LECTURE DETAIL POPUP */}
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
                    <div className="mt-4 flex gap-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-secondaryText">{modalLecture.slides?.length || 0} Slides</span>
                         {modalLecture.pdfUrl && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">PDF Ready</span>}
                    </div>
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
                        Start Session
                    </button>
                    
                    <button 
                        onClick={() => {
                            closeModal();
                            onViewInsights(modalLecture);
                        }}
                        className="w-full bg-white border border-gray-200 text-primary py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
                    >
                        <BarChart2 size={20} />
                        View History
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default LecturesList;