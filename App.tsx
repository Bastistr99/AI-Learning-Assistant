import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './services/db';
import Sidebar from './components/Sidebar';
import Classroom from './components/Classroom';
import LecturesList from './components/LecturesList';
import GlobalInsights from './components/GlobalInsights';
import Profile from './components/Profile';
import LiveSession from './components/LiveSession';
import PostSessionInsights from './components/PostSessionInsights';
import CalendarView from './components/CalendarView';
import { Lecture, NavItem, SessionState, Course, SessionSlideStat, CalendarEvent, UserProfile, AppSettings } from './types';

// --- MOCK DATA: SLIDE DECKS ---

const DEFAULT_SLIDES = [
    { id: 1, title: "Introduction", content: "Overview of the topic and objectives.", notes: "Welcome the students and set the stage for the semester." },
    { id: 2, title: "Core Concepts", content: "Defining key terms and methodologies.", notes: "Ensure everyone understands the basic vocabulary before moving on." },
    { id: 3, title: "Summary", content: "Recap of main points and next steps.", notes: "Remind them about the upcoming assignment deadline." },
];

const ML_SLIDES = [
    { id: 1, title: "Neural Networks Intro", content: "Biological inspiration vs Artificial Neurons.", notes: "Start with the perceptron. Ask class about their biology background." },
    { id: 2, title: "Activation Functions", content: "ReLU, Sigmoid, Tanh: Why non-linearity matters.", notes: "Draw the ReLU graph on the board. Explain the vanishing gradient problem." },
    { id: 3, title: "Backpropagation", content: "The Chain Rule and Gradient Descent.", notes: "Use the 'hiking down a misty mountain' analogy for Gradient Descent." },
];

const STATS_SLIDES = [
    { id: 1, title: "Bayes' Theorem", content: "Posterior = (Likelihood * Prior) / Evidence.", notes: "Use the medical test paradox example to explain false positives." },
    { id: 2, title: "Distributions", content: "Normal, Binomial, and Poisson distributions.", notes: "Emphasize the Central Limit Theorem. It is the foundation of hypothesis testing." },
    { id: 3, title: "Hypothesis Testing", content: "P-values, Null Hypothesis, and Type I/II errors.", notes: "Remind them that p < 0.05 is not a magic number for truth." },
];

const DL_SLIDES = [
    { id: 1, title: "Convolutional Networks", content: "Kernels, Filters, and Feature Maps.", notes: "Demonstrate edge detection using a simple 3x3 filter." },
    { id: 2, title: "Pooling Layers", content: "Max Pooling vs Average Pooling.", notes: "Explain how pooling provides translation invariance." },
    { id: 3, title: "ResNet & Skip Connections", content: "Solving the vanishing gradient in deep networks.", notes: "Show the residual block diagram." },
];

const ETHICS_SLIDES = [
    { id: 1, title: "Algorithmic Bias", content: "Historical, Representation, and Measurement bias.", notes: "Discuss the Amazon hiring algorithm case study." },
    { id: 2, title: "Fairness Metrics", content: "Demographic Parity vs Equalized Odds.", notes: "Ask the class: Is it better to be fair to the group or the individual?" },
    { id: 3, title: "Privacy & GDPR", content: "Data protection and the right to explanation.", notes: "Explain what 'Right to be forgotten' technically entails." },
];

const NLP_SLIDES = [
    { id: 1, title: "Word Embeddings", content: "Word2Vec, GloVe, and Semantic Vector Spaces.", notes: "Show the King - Man + Woman = Queen vector math." },
    { id: 2, title: "The Transformer", content: "Attention is All You Need: Self-Attention mechanism.", notes: "Compare RNN sequential processing vs Transformer parallelization." },
    { id: 3, title: "LLM Alignment", content: "RLHF: Reinforcement Learning from Human Feedback.", notes: "Discuss how ChatGPT is fine-tuned to be helpful and harmless." },
];

// --- MOCK DATA: COURSES ---

const INITIAL_COURSES: Course[] = [
  { id: 'c1', title: 'Machine Learning I', studentCount: 112, lectureCount: 3 },
  { id: 'c2', title: 'Statistics & Probability', studentCount: 95, lectureCount: 3 },
  { id: 'c3', title: 'Deep Learning Advanced', studentCount: 45, lectureCount: 3 },
  { id: 'c4', title: 'Data Ethics', studentCount: 150, lectureCount: 3 },
  { id: 'c5', title: 'Natural Language Processing', studentCount: 88, lectureCount: 3 },
];

// Helper to generate mock stats
const generateMockStats = (slideCount: number, minScore: number = 40): SessionSlideStat[] => {
    return Array.from({ length: slideCount }, (_, i) => ({
        slideIndex: i,
        clarityScore: Math.floor(Math.random() * (100 - minScore) + minScore)
    }));
};

// --- MOCK DATA: LECTURES ---

const INITIAL_LECTURES: Lecture[] = [
  // COURSE 1: Machine Learning I
  {
    id: 'l1-1', courseId: 'c1', title: 'Intro to ML & Supervised Learning',
    description: 'Foundations of regression and classification.',
    lastSessionDuration: 55, lastSessionAttendance: 98, studentsCount: 112,
    dateCreated: '2023-09-10', slides: DEFAULT_SLIDES, recentSessionStats: generateMockStats(3, 70)
  },
  {
    id: 'l1-2', courseId: 'c1', title: 'Neural Networks Fundamentals',
    description: 'Perceptrons, MLPs and Backpropagation.',
    lastSessionDuration: 60, lastSessionAttendance: 92, studentsCount: 112,
    dateCreated: '2023-10-15', slides: ML_SLIDES, recentSessionStats: generateMockStats(3, 50)
  },
  {
    id: 'l1-3', courseId: 'c1', title: 'Model Evaluation Metrics',
    description: 'Precision, Recall, F1-Score and ROC Curves.',
    lastSessionDuration: 45, lastSessionAttendance: 88, studentsCount: 112,
    dateCreated: '2023-11-01', slides: DEFAULT_SLIDES, recentSessionStats: generateMockStats(3, 60)
  },

  // COURSE 2: Statistics
  {
    id: 'l2-1', courseId: 'c2', title: 'Probability Theory Basics',
    description: 'Random variables and probability distributions.',
    lastSessionDuration: 50, lastSessionAttendance: 90, studentsCount: 95,
    dateCreated: '2023-09-12', slides: STATS_SLIDES, recentSessionStats: generateMockStats(3, 65)
  },
  {
    id: 'l2-2', courseId: 'c2', title: 'Inferential Statistics',
    description: 'Hypothesis testing and confidence intervals.',
    lastSessionDuration: 65, lastSessionAttendance: 85, studentsCount: 95,
    dateCreated: '2023-10-05', slides: STATS_SLIDES, recentSessionStats: generateMockStats(3, 45) // Hard topic
  },
  {
    id: 'l2-3', courseId: 'c2', title: 'Bayesian Inference',
    description: 'Introduction to Bayesian thinking and priors.',
    lastSessionDuration: 60, lastSessionAttendance: 82, studentsCount: 95,
    dateCreated: '2023-11-10', slides: STATS_SLIDES, recentSessionStats: generateMockStats(3, 55)
  },

  // COURSE 3: Deep Learning
  {
    id: 'l3-1', courseId: 'c3', title: 'Computer Vision & CNNs',
    description: 'Image processing with Convolutional Neural Networks.',
    lastSessionDuration: 70, lastSessionAttendance: 44, studentsCount: 45,
    dateCreated: '2023-09-20', slides: DL_SLIDES, recentSessionStats: generateMockStats(3, 80)
  },
  {
    id: 'l3-2', courseId: 'c3', title: 'Sequence Models (RNNs)',
    description: 'Recurrent Neural Networks and LSTMs.',
    lastSessionDuration: 65, lastSessionAttendance: 42, studentsCount: 45,
    dateCreated: '2023-10-12', slides: DEFAULT_SLIDES, recentSessionStats: generateMockStats(3, 60)
  },
  {
    id: 'l3-3', courseId: 'c3', title: 'Generative Adversarial Networks',
    description: 'GANs, Generators, and Discriminators.',
    lastSessionDuration: 55, lastSessionAttendance: 40, studentsCount: 45,
    dateCreated: '2023-11-05', slides: DL_SLIDES, recentSessionStats: generateMockStats(3, 75)
  },

  // COURSE 4: Data Ethics
  {
    id: 'l4-1', courseId: 'c4', title: 'Bias in AI Systems',
    description: 'Sources of bias and mitigation strategies.',
    lastSessionDuration: 50, lastSessionAttendance: 145, studentsCount: 150,
    dateCreated: '2023-09-15', slides: ETHICS_SLIDES, recentSessionStats: generateMockStats(3, 85)
  },
  {
    id: 'l4-2', courseId: 'c4', title: 'Privacy Preserving ML',
    description: 'Differential Privacy and Federated Learning.',
    lastSessionDuration: 55, lastSessionAttendance: 130, studentsCount: 150,
    dateCreated: '2023-10-20', slides: ETHICS_SLIDES, recentSessionStats: generateMockStats(3, 65)
  },
  {
    id: 'l4-3', courseId: 'c4', title: 'AI Governance & Policy',
    description: 'Regulations, GDPR, and the EU AI Act.',
    lastSessionDuration: 60, lastSessionAttendance: 140, studentsCount: 150,
    dateCreated: '2023-11-15', slides: ETHICS_SLIDES, recentSessionStats: generateMockStats(3, 70)
  },

  // COURSE 5: NLP
  {
    id: 'l5-1', courseId: 'c5', title: 'Text Preprocessing & Embeddings',
    description: 'Tokenization, Stemming, and Word Vectors.',
    lastSessionDuration: 55, lastSessionAttendance: 85, studentsCount: 88,
    dateCreated: '2023-09-25', slides: NLP_SLIDES, recentSessionStats: generateMockStats(3, 90)
  },
  {
    id: 'l5-2', courseId: 'c5', title: 'Transformers & BERT',
    description: 'The architecture behind modern LLMs.',
    lastSessionDuration: 75, lastSessionAttendance: 88, studentsCount: 88,
    dateCreated: '2023-10-30', slides: NLP_SLIDES, recentSessionStats: generateMockStats(3, 50)
  },
  {
    id: 'l5-3', courseId: 'c5', title: 'Prompt Engineering',
    description: 'Optimizing inputs for Large Language Models.',
    lastSessionDuration: 45, lastSessionAttendance: 86, studentsCount: 88,
    dateCreated: '2023-11-20', slides: NLP_SLIDES, recentSessionStats: generateMockStats(3, 95)
  },
];

const App: React.FC = () => {
  const [activeNav, setActiveNav] = useState<NavItem>(NavItem.Classroom);
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  
  // DB DATA
  const courses = useLiveQuery(() => db.courses.toArray()) || [];
  const rawLectures = useLiveQuery(() => db.lectures.toArray()) || [];
  const calendarEvents = useLiveQuery(() => db.calendarEvents.toArray()) || [];
  
  // Helper: Hydrate lectures with PDF URLs if blob exists
  const [lectures, setLectures] = useState<Lecture[]>([]);

  useEffect(() => {
      // Seed Data if empty
      const seedData = async () => {
          const count = await db.courses.count();
          if (count === 0) {
              await db.courses.bulkAdd(INITIAL_COURSES);
              await db.lectures.bulkAdd(INITIAL_LECTURES);
              
              const today = new Date();
              await db.calendarEvents.bulkAdd([
                {
                    id: 'evt-1',
                    lectureId: 'l1-3',
                    courseId: 'c1',
                    title: 'Model Evaluation Metrics',
                    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1), // Tomorrow
                    time: '10:00',
                    duration: 90
                },
                {
                    id: 'evt-2',
                    lectureId: 'l2-2',
                    courseId: 'c2',
                    title: 'Inferential Statistics',
                    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3), 
                    time: '14:00',
                    duration: 60
                },
                {
                    id: 'evt-3',
                    lectureId: 'l5-2',
                    courseId: 'c5',
                    title: 'Transformers & BERT',
                    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5), 
                    time: '09:00',
                    duration: 75
                }
              ]);
          }
      };
      seedData();
  }, []);

  // Update lectures when rawLectures changes (hydrating blobs)
  useEffect(() => {
      const hydrated = rawLectures.map(l => ({
          ...l,
          pdfUrl: l.pdfBlob ? URL.createObjectURL(l.pdfBlob) : l.pdfUrl
      }));
      setLectures(hydrated);
      
      // Cleanup URLs to avoid memory leaks? 
      // In a real app we'd carefully revoke these.
  }, [rawLectures]);

  
  // User & Settings State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'John Doe',
    role: 'Professor of Computer Science',
    email: 'john.doe@university.edu',
    avatar: 'JD'
  });
  
  const [appSettings, setAppSettings] = useState<AppSettings>({
    aiEnabled: true,
    emailNotifications: true,
    accessibility: {
      colorBlindMode: false,
      reducedMotion: false,
      highContrast: false
    }
  });
  
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Data Handlers
  const handleAddCourse = async (title: string) => {
    const newCourse: Course = {
      id: `c${Date.now()}`,
      title,
      studentCount: 0,
      lectureCount: 0
    };
    await db.courses.add(newCourse);
  };

  const handleImportLecture = async (courseId: string, lectureData: any) => {
      // Note: lectureData.pdfUrl might be a blob URL from the input preview
      // Ideally, the input component should pass the File object directly.
      // We will assume 'lectureData.file' or similar is available if we passed it, 
      // but sticking to the current prop structure:
      
      // In a real refactor, LecturesList should pass the File object.
      // We'll handle that next. For now, basic struct:
      
    const newLecture: Lecture = {
      id: `l${Date.now()}`,
      courseId,
      title: lectureData.title || 'Untitled Lecture',
      description: lectureData.description || 'Imported lecture',
      lastSessionDuration: 0,
      lastSessionAttendance: 0,
      studentsCount: 0,
      dateCreated: new Date().toISOString().split('T')[0],
      slides: lectureData.slides || DEFAULT_SLIDES,
      // If we had the file, we'd store it here: pdfBlob: lectureData.file
      // Since LecturesList handles the import, we need to update it to pass the file.
      // We'll update this logic after checking LecturesList interaction.
    };
    
    // For now, if we have a file in lectureData (we will ensure this later), save it
    if (lectureData.pdfBlob) {
        newLecture.pdfBlob = lectureData.pdfBlob;
    }

    await db.lectures.add(newLecture);
    
    // Update course lecture count
    const course = await db.courses.get(courseId);
    if (course) {
        await db.courses.update(courseId, { lectureCount: course.lectureCount + 1 });
    }
  };

  const handleAddCalendarEvent = async (event: CalendarEvent) => {
      await db.calendarEvents.add(event);
  };

  // Navigation Handler
  const handleNavigate = (item: NavItem) => {
    setActiveNav(item);
    setSelectedCourse(null);
    setSelectedLecture(null);
    setSessionState('idle');
  };

  // Starts a Live Session
  const handleStartSession = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setSessionState('live');
  };

  // Ends a Live Session and goes to Summary
  const handleEndSession = async (stats: SessionSlideStat[]) => {
    if (selectedLecture) {
        // Save the new stats to the lecture
        const updatedLecture: Lecture = { 
            ...selectedLecture, 
            recentSessionStats: stats 
        };
        
        // Update local selected state
        setSelectedLecture(updatedLecture);
        
        // Update DB
        await db.lectures.put(updatedLecture);
    }
    setSessionState('summary');
  };

  // Directly view insights (History/Review mode)
  const handleViewInsights = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setSessionState('summary');
  };

  const handleBackToApp = () => {
    setSelectedLecture(null);
    setSessionState('idle');
  };

  // Apply Reduced Motion at Root Level (Simple implementation)
  React.useEffect(() => {
    if (appSettings.accessibility.reducedMotion) {
      document.documentElement.style.setProperty('--transition-speed', '0s');
      // Force disable animations
      const style = document.createElement('style');
      style.id = 'reduce-motion-style';
      style.innerHTML = `*, *::before, *::after { animation: none !important; transition: none !important; }`;
      document.head.appendChild(style);
    } else {
      const style = document.getElementById('reduce-motion-style');
      if (style) style.remove();
    }
  }, [appSettings.accessibility.reducedMotion]);

  // Content Render Logic
  const renderContent = () => {
    // 1. Live Session Flow overrides Nav
    if (sessionState === 'live' && selectedLecture) {
      return (
        <LiveSession 
          lecture={selectedLecture} 
          globalAiEnabled={appSettings.aiEnabled}
          accessibility={appSettings.accessibility}
          onEndSession={handleEndSession}
          onBack={handleBackToApp} // Allows aborting
        />
      );
    }

    // 2. Summary/Insights View Flow
    if (sessionState === 'summary' && selectedLecture) {
      return (
        <PostSessionInsights 
          lecture={selectedLecture} 
          onBack={handleBackToApp} 
        />
      );
    }

    // 3. Main Navigation Tabs
    switch (activeNav) {
      case NavItem.Profile:
        return (
          <Profile 
            user={userProfile}
            settings={appSettings}
            onUpdateUser={setUserProfile}
            onUpdateSettings={setAppSettings}
          />
        );
      
      case NavItem.Courses:
        return (
          <LecturesList 
            lectures={lectures} 
            courses={courses}
            selectedCourse={selectedCourse}
            onSelectCourse={setSelectedCourse}
            onStartSession={handleStartSession}
            onViewInsights={handleViewInsights}
            onAddCourse={handleAddCourse}
            onImportLecture={handleImportLecture}
          />
        );
      
      case NavItem.Calendar:
        return (
            <CalendarView 
                events={calendarEvents}
                courses={courses}
                lectures={lectures}
                onAddEvent={handleAddCalendarEvent}
                onStartSession={handleStartSession}
            />
        );

      case NavItem.Insights:
        return (
            <GlobalInsights 
                lectures={lectures} 
                courses={courses}
                selectedCourse={selectedCourse}
                onSelectCourse={setSelectedCourse}
                onViewInsights={handleViewInsights}
                accessibility={appSettings.accessibility}
            />
        );
      
      case NavItem.Classroom:
      default:
        return (
          <Classroom 
            lectures={lectures} 
            events={calendarEvents}
            onSelectLecture={handleStartSession}
            onNewLecture={() => setActiveNav(NavItem.Courses)}
          />
        );
    }
  };

  const isLiveMode = sessionState === 'live';

  return (
    <div className="flex min-h-screen w-full bg-background font-sans text-primary selection:bg-accent selection:text-primary">
      
      {/* Sidebar hidden only in Live Mode. On mobile it's a bottom bar. */}
      {!isLiveMode && (
        <Sidebar activeItem={activeNav} onNavigate={handleNavigate} />
      )}

      {/* Main Content */}
      <main className={`
        flex-1 transition-all duration-300
        /* Desktop: Add left margin for sidebar */
        /* md (Tablet): 80px (w-20) */
        /* lg (Laptop): 256px (w-64) */
        ${!isLiveMode ? 'md:ml-20 lg:ml-64' : ''}
        /* Mobile: Add bottom padding for nav bar */
        ${!isLiveMode ? 'pb-20 md:pb-0' : ''}
      `}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;