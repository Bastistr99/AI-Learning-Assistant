import React from 'react';
import LectureCard from './LectureCard';
import { Lecture } from '../types';

interface DashboardProps {
  lectures: Lecture[];
  onSelectLecture: (lecture: Lecture) => void;
  onNewLecture: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ lectures, onSelectLecture, onNewLecture }) => {
  return (
    <div className="p-10 w-full max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">My Lectures</h1>
        <p className="text-secondaryText">Manage and present your course materials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* New Lecture Button */}
        <LectureCard onClick={onNewLecture} />

        {/* Existing Lectures */}
        {lectures.map((lecture) => (
          <LectureCard 
            key={lecture.id} 
            lecture={lecture} 
            onClick={() => onSelectLecture(lecture)} 
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;