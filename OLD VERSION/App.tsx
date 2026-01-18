import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Classroom from './components/Classroom';
import LecturesList from './components/LecturesList';
import GlobalInsights from './components/GlobalInsights';
import Profile from './components/Profile';
import LiveSession from './components/LiveSession';
import PostSessionInsights from './components/PostSessionInsights';
import { Lecture, NavItem, SessionState, Course } from './types';
import StudentView from './components/StudentView'; // Import the new component

// Mock Data - Courses
const MOCK_COURSES: Course[] = [
  { id: 'c1', title: 'Machine Learning I', studentCount: 112, lectureCount: 12 },
  { id: 'c2', title: 'Statistics & Probability', studentCount: 95, lectureCount: 8 },
  { id: 'c3', title: 'Deep Learning Advanced', studentCount: 45, lectureCount: 5 },
  { id: 'c4', title: 'Data Ethics', studentCount: 150, lectureCount: 3 },
];

// Mock Data - Lectures
const MOCK_LECTURES: Lecture[] = [
  {
    id: '1',
    courseId: 'c1',
    title: 'Machine Learning 2',
    description: 'Neural Networks and Deep Learning fundamentals.',
    lastSessionDuration: 60,
    lastSessionAttendance: 92,
    studentsCount: 112,
    dateCreated: '2023-11-01',
  },
  {
    id: '2',
    courseId: 'c1',
    title: 'Machine Learning 1',
    description: 'Introduction to Supervised and Unsupervised learning.',
    lastSessionDuration: 55,
    lastSessionAttendance: 88,
    studentsCount: 105,
    dateCreated: '2023-10-15',
  },
  {
    id: '3',
    courseId: 'c2',
    title: 'Statistics 1',
    description: 'Probability theory and basic distributions.',
    lastSessionDuration: 45,
    lastSessionAttendance: 76,
    studentsCount: 98,
    dateCreated: '2023-09-20',
  },
  {
    id: '4',
    courseId: 'c2',
    title: 'Statistics 2',
    description: 'Hypothesis testing and regression analysis.',
    lastSessionDuration: 60,
    lastSessionAttendance: 82,
    studentsCount: 95,
    dateCreated: '2023-10-05',
  },
  {
    id: '5',
    courseId: 'c3',
    title: 'Basics of AI',
    description: 'History and overview of Artificial Intelligence.',
    lastSessionDuration: 50,
    lastSessionAttendance: 95,
    studentsCount: 150,
    dateCreated: '2023-08-12',
  }
];

const App: React.FC = () => {
  const [activeNav, setActiveNav] = useState<NavItem>(NavItem.Classroom);
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const isStudentMode = window.location.pathname === '/student';

  if (isStudentMode) {
    return <StudentView />;
  }
  
  // Lifted state: selectedCourse is now managed here to allow Sidebar to reset it
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Navigation Handler
  const handleNavigate = (item: NavItem) => {
    setActiveNav(item);
    // BUG FIX: Reset view depth when clicking sidebar items
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
  const handleEndSession = () => {
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

  // Content Render Logic
  const renderContent = () => {
    // 1. Live Session Flow overrides Nav
    if (sessionState === 'live' && selectedLecture) {
      return (
        <LiveSession 
          lecture={selectedLecture} 
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
        return <Profile />;
      
      case NavItem.Lectures:
        return (
          <LecturesList 
            lectures={MOCK_LECTURES} 
            courses={MOCK_COURSES}
            selectedCourse={selectedCourse}
            onSelectCourse={setSelectedCourse}
            onStartSession={handleStartSession}
            onViewInsights={handleViewInsights}
          />
        );
      
      case NavItem.Insights:
        return (
            <GlobalInsights 
                lectures={MOCK_LECTURES} 
                courses={MOCK_COURSES}
                selectedCourse={selectedCourse}
                onSelectCourse={setSelectedCourse}
                onViewInsights={handleViewInsights}
            />
        );
      
      case NavItem.Classroom:
      default:
        return (
          <Classroom 
            lectures={MOCK_LECTURES} 
            onSelectLecture={handleStartSession}
            onNewLecture={() => alert("Create new lecture modal.")}
          />
        );
    }
  };

  const isLiveMode = sessionState === 'live';

  return (
    <div className="flex min-h-screen w-full bg-background font-sans text-primary selection:bg-accent selection:text-primary">
      
      {/* Sidebar hidden only in Live Mode to maximize screen real estate */}
      {!isLiveMode && (
        <Sidebar activeItem={activeNav} onNavigate={handleNavigate} />
      )}

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${!isLiveMode ? 'ml-64' : ''}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;