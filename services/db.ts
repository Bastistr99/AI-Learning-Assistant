import Dexie, { Table } from 'dexie';
import { Course, Lecture, CalendarEvent, UserProfile, AppSettings } from '../types';

export class LearningAssistantDB extends Dexie {
  courses!: Table<Course>;
  lectures!: Table<Lecture>;
  calendarEvents!: Table<CalendarEvent>;
  settings!: Table<AppSettings>;
  profile!: Table<UserProfile>;

  constructor() {
    super('LearningAssistantDB');
    this.version(1).stores({
      courses: 'id, title', // Primary key and indexed props
      lectures: 'id, courseId, title, dateCreated',
      calendarEvents: 'id, date, lectureId',
      settings: '++id', // Singleton
      profile: '++id' // Singleton
    });
  }
}

export const db = new LearningAssistantDB();
