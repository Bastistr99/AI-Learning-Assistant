import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LectureCard from '../../components/LectureCard';
import { Lecture } from '../../types';

describe('LectureCard', () => {
  it('renders the "New Lecture" card when no lecture is provided', () => {
    const handleClick = vi.fn();
    render(<LectureCard onClick={handleClick} />);

    expect(screen.getByText('New Lecture')).toBeInTheDocument();
    expect(screen.getByLabelText('Create new lecture')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders lecture details when a lecture is provided', () => {
    const mockLecture: Lecture = {
      id: '123',
      courseId: 'c1',
      title: 'Introduction to AI',
      description: 'Basics of Artificial Intelligence',
      lastSessionDuration: 45,
      lastSessionAttendance: 90,
      dateCreated: '2023-01-01',
      slides: [],
      recentSessionStats: [
          { slideIndex: 0, clarityScore: 80 },
          { slideIndex: 1, clarityScore: 90 }
      ]
    };

    const handleClick = vi.fn();
    render(<LectureCard lecture={mockLecture} onClick={handleClick} />);

    // Check Title and Description
    expect(screen.getByText('Introduction to AI')).toBeInTheDocument();
    expect(screen.getByText('Basics of Artificial Intelligence')).toBeInTheDocument();
    
    // Check Duration
    expect(screen.getByText('45 min')).toBeInTheDocument();

    // Check Clarity Calculation (Average of 80 and 90 is 85)
    expect(screen.getByText('85%')).toBeInTheDocument();
  });
});
