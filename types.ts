export interface Course {
  id: string;
  title: string;
  studentCount: number;
  lectureCount: number;
  color?: string; // For folder decoration
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

export type SessionState = 'idle' | 'live' | 'summary';

export enum NavItem {
  Profile = 'Profile',
  Classroom = 'Classroom',
  Lectures = 'Lectures',
  Insights = 'Insights',
}