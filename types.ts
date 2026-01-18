export interface Course {
  id: string;
  title: string;
  studentCount: number;
  lectureCount: number;
  color?: string; // For folder decoration
}

export interface Slide {
  id: number;
  title: string;
  content: string;
  notes: string;
}

export interface AiIntervention {
  id: string;
  text: string;
  timestamp: number;
  slideIndex: number;
  rating: 'helpful' | 'unhelpful' | null;
}

export interface SessionSlideStat {
  slideIndex: number;
  clarityScore: number;
  interventions?: AiIntervention[];
  predictionAccuracy?: number; // 0-100: Percentage of times user marked prediction as "Accurate"
}

export interface Lecture {
  id: string;
  courseId: string; // Foreign key to Course
  title: string;
  description: string;
  lastSessionDuration: number; // in minutes
  lastSessionAttendance: number; // percentage
  slideCount?: number;
  studentsCount?: number;
  nextSessionDate?: string;
  dateCreated: string;
  slides: Slide[];
  recentSessionStats?: SessionSlideStat[];
  pdfUrl?: string; // URL to the blob of the actual PDF file
  pdfBlob?: Blob; // Persisted PDF file
}

export interface AnalysisResult {
  timestamp: number;
  engagementScore: number; // 1-10
  confusionScore: number; // 1-10
  feedback: string;
}

export interface InsightDataPoint {
  slide: number;
  clarity: number; // 0-100
}

export interface CalendarEvent {
  id: string;
  lectureId: string;
  courseId: string;
  title: string; // Denormalized for easier access
  date: Date;
  time: string; // e.g. "14:00"
  duration: number; // minutes
}

export interface UserProfile {
  name: string;
  role: string;
  email: string;
  avatar: string; // Initials
}

export interface AccessibilitySettings {
  colorBlindMode: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

export interface AppSettings {
  aiEnabled: boolean;
  emailNotifications: boolean;
  accessibility: AccessibilitySettings;
}

export type SessionState = 'idle' | 'live' | 'summary';

export enum NavItem {
  Profile = 'Profile',
  Classroom = 'Classroom',
  Courses = 'Courses', // Renamed from Lectures
  Calendar = 'Calendar',
  Insights = 'Insights',
}