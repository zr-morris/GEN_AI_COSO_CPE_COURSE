import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RequireAccess } from './RequireAccess';
import {
  CourseContext,
  courseReducer,
  createInitialProgress,
  type SectionId,
} from '../store/courseStore';
import { useReducer } from 'react';

function renderWithRoute(initialPath: string, section: SectionId, completedModule?: string) {
  function Wrapper() {
    const [state, dispatch] = useReducer(
      courseReducer,
      undefined,
      () => {
        const initial = createInitialProgress();
        if (completedModule) {
          return courseReducer(initial, { type: 'COMPLETE_MODULE', moduleId: completedModule });
        }
        return initial;
      },
    );
    return (
      <CourseContext.Provider value={{ state, dispatch }}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/" element={<div>Overview Page</div>} />
            <Route
              path="/protected"
              element={
                <RequireAccess section={section}>
                  <div>Protected Content</div>
                </RequireAccess>
              }
            />
          </Routes>
        </MemoryRouter>
      </CourseContext.Provider>
    );
  }
  return render(<Wrapper />);
}

describe('RequireAccess', () => {
  it('redirects to / when the user lacks access', () => {
    renderWithRoute('/protected', 'review1');
    expect(screen.getByText('Overview Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when access is granted', () => {
    renderWithRoute('/protected', 'review1', 'module1');
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('always allows overview', () => {
    renderWithRoute('/protected', 'overview');
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
