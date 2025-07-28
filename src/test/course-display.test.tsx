import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { CourseDisplay } from '@/components/ui/course-display';
import { Course, UserProfile } from '@/types';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';

// Mock course data
const mockCourse: Course = {
  id: 'test-course-1',
  title: 'Test Course Title',
  description: 'A test course description',
  modules: [
    {
      id: 'module-1',
      title: 'Module 1: Introduction',
      summary: 'This is the first module summary with important concepts.',
      takeaways: [
        'First key takeaway from module 1',
        'Second important point',
        'Third actionable insight'
      ],
      order: 1,
      estimatedReadTime: 5
    },
    {
      id: 'module-2',
      title: 'Module 2: Advanced Concepts',
      summary: 'This module covers more advanced topics and techniques.',
      takeaways: [
        'Advanced technique number one',
        'Complex concept explained simply'
      ],
      order: 2,
      estimatedReadTime: 8
    }
  ],
  metadata: {
    sourceType: 'tweet',
    sourceUrl: 'https://twitter.com/test/status/123',
    generatedAt: '2024-01-15T10:30:00Z',
    version: 1
  }
};

const mockFreeUser: UserProfile = {
  id: 'user-1',
  email: 'test@example.com',
  subscriptionTier: 'free',
  usageCount: 1,
  createdAt: '2024-01-01T00:00:00Z',
  lastActive: '2024-01-15T10:00:00Z'
};

const mockProUser: UserProfile = {
  id: 'user-2',
  email: 'pro@example.com',
  subscriptionTier: 'pro',
  usageCount: 5,
  createdAt: '2024-01-01T00:00:00Z',
  lastActive: '2024-01-15T10:00:00Z'
};

describe('CourseDisplay', () => {
  it('renders course title and basic information', () => {
    render(<CourseDisplay course={mockCourse} />);
    
    expect(screen.getByText('Test Course Title')).toBeInTheDocument();
    expect(screen.getByText('Click to edit title')).toBeInTheDocument();
    expect(screen.getByText(/Generated/)).toBeInTheDocument();
    expect(screen.getAllByText(/2 modules/)).toHaveLength(2); // Appears in metadata and footer
    expect(screen.getByText(/Source: tweet/)).toBeInTheDocument();
  });

  it('displays all course modules with correct order', () => {
    render(<CourseDisplay course={mockCourse} />);
    
    expect(screen.getByText('Module 1: Introduction')).toBeInTheDocument();
    expect(screen.getByText('Module 2: Advanced Concepts')).toBeInTheDocument();
    expect(screen.getByText('This is the first module summary with important concepts.')).toBeInTheDocument();
    expect(screen.getByText('This module covers more advanced topics and techniques.')).toBeInTheDocument();
  });

  it('allows title editing when clicked', async () => {
    const mockTitleUpdate = vi.fn();
    render(<CourseDisplay course={mockCourse} onTitleUpdate={mockTitleUpdate} />);
    
    // Click on title to edit
    fireEvent.click(screen.getByText('Test Course Title'));
    
    // Should show input field
    const titleInput = screen.getByDisplayValue('Test Course Title');
    expect(titleInput).toBeInTheDocument();
    
    // Change title
    fireEvent.change(titleInput, { target: { value: 'New Course Title' } });
    
    // Save changes
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(mockTitleUpdate).toHaveBeenCalledWith('New Course Title');
    });
  });

  it('cancels title editing when cancel button is clicked', () => {
    render(<CourseDisplay course={mockCourse} />);
    
    // Click on title to edit
    fireEvent.click(screen.getByText('Test Course Title'));
    
    // Change title
    const titleInput = screen.getByDisplayValue('Test Course Title');
    fireEvent.change(titleInput, { target: { value: 'Changed Title' } });
    
    // Cancel changes
    fireEvent.click(screen.getByText('Cancel'));
    
    // Should show original title
    expect(screen.getByText('Test Course Title')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Changed Title')).not.toBeInTheDocument();
  });

  it('expands and collapses modules when clicked', () => {
    render(<CourseDisplay course={mockCourse} />);
    
    // Initially, takeaways should not be visible
    expect(screen.queryByText('First key takeaway from module 1')).not.toBeInTheDocument();
    
    // Click on first module to expand
    fireEvent.click(screen.getByText('Module 1: Introduction'));
    
    // Takeaways should now be visible
    expect(screen.getByText('First key takeaway from module 1')).toBeInTheDocument();
    expect(screen.getByText('Second important point')).toBeInTheDocument();
    expect(screen.getByText('Third actionable insight')).toBeInTheDocument();
    
    // Click again to collapse
    fireEvent.click(screen.getByText('Module 1: Introduction'));
    
    // Takeaways should be hidden again
    expect(screen.queryByText('First key takeaway from module 1')).not.toBeInTheDocument();
  });

  it('shows regenerate and PDF export buttons', () => {
    const mockRegenerate = vi.fn();
    const mockExportPDF = vi.fn();
    
    render(
      <CourseDisplay 
        course={mockCourse} 
        onRegenerate={mockRegenerate}
        onExportPDF={mockExportPDF}
      />
    );
    
    expect(screen.getByText('🔄 Regenerate')).toBeInTheDocument();
    expect(screen.getByText('📄 Download PDF')).toBeInTheDocument();
    
    // Test button clicks
    fireEvent.click(screen.getByText('🔄 Regenerate'));
    expect(mockRegenerate).toHaveBeenCalled();
    
    fireEvent.click(screen.getByText('📄 Download PDF'));
    expect(mockExportPDF).toHaveBeenCalled();
  });

  it('shows Notion export for pro users', () => {
    const mockExportNotion = vi.fn();
    
    render(
      <CourseDisplay 
        course={mockCourse} 
        userProfile={mockProUser}

      />
    );
    
    expect(screen.getByText('📝 Export to Notion')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('📝 Export to Notion'));
    expect(mockExportNotion).toHaveBeenCalled();
  });

  it('shows upgrade prompt for free users trying to use Notion export', () => {
    render(<CourseDisplay course={mockCourse} userProfile={mockFreeUser} />);
    
    // Should show disabled Notion button
    const notionButton = screen.getByText('📝 Export to Notion');
    expect(notionButton).toBeInTheDocument();
    expect(notionButton.closest('button')).toHaveClass('bg-gray-300');
  });

  it('shows watermark warning for free users', () => {
    render(<CourseDisplay course={mockCourse} userProfile={mockFreeUser} />);
    
    expect(screen.getByText(/Free tier - PDF includes watermark/)).toBeInTheDocument();
  });

  it('does not show watermark warning for pro users', () => {
    render(<CourseDisplay course={mockCourse} userProfile={mockProUser} />);
    
    expect(screen.queryByText(/Free tier - PDF includes watermark/)).not.toBeInTheDocument();
  });

  it('shows loading states for regeneration and export', () => {
    render(
      <CourseDisplay 
        course={mockCourse} 
        isRegenerating={true}
        isExporting={true}
      />
    );
    
    expect(screen.getByText('Regenerating...')).toBeInTheDocument();
    expect(screen.getByText('Exporting...')).toBeInTheDocument();
  });

  it('displays estimated read times correctly', () => {
    render(<CourseDisplay course={mockCourse} />);
    
    // Expand first module to see read time
    fireEvent.click(screen.getByText('Module 1: Introduction'));
    
    expect(screen.getByText(/Estimated read time: 5 minutes/)).toBeInTheDocument();
  });

  it('handles keyboard navigation for title editing', () => {
    const mockTitleUpdate = vi.fn();
    render(<CourseDisplay course={mockCourse} onTitleUpdate={mockTitleUpdate} />);
    
    // Click on title to edit
    fireEvent.click(screen.getByText('Test Course Title'));
    
    const titleInput = screen.getByDisplayValue('Test Course Title');
    
    // Change title and press Enter
    fireEvent.change(titleInput, { target: { value: 'Keyboard Title' } });
    fireEvent.keyDown(titleInput, { key: 'Enter' });
    
    expect(mockTitleUpdate).toHaveBeenCalledWith('Keyboard Title');
  });

  it('cancels title editing with Escape key', () => {
    render(<CourseDisplay course={mockCourse} />);
    
    // Click on title to edit
    fireEvent.click(screen.getByText('Test Course Title'));
    
    const titleInput = screen.getByDisplayValue('Test Course Title');
    
    // Change title and press Escape
    fireEvent.change(titleInput, { target: { value: 'Escaped Title' } });
    fireEvent.keyDown(titleInput, { key: 'Escape' });
    
    // Should show original title
    expect(screen.getByText('Test Course Title')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Escaped Title')).not.toBeInTheDocument();
  });
});