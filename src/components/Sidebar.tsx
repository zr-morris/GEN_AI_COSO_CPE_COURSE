import { NavLink } from 'react-router-dom';
import {
  canAccessSection,
  sectionPaths,
  useCourse,
  type CourseProgress,
  type SectionId,
} from '../store/courseStore';

interface SidebarItem {
  id: SectionId;
  label: string;
  icon: string;
  group: 'start' | 'learn' | 'assess' | 'complete';
}

const sidebarItems: SidebarItem[] = [
  { id: 'overview', label: 'Overview', icon: 'fa-home', group: 'start' },
  { id: 'module1', label: 'Module 1', icon: 'fa-book', group: 'learn' },
  { id: 'review1', label: 'Review 1', icon: 'fa-check-circle', group: 'learn' },
  { id: 'module2', label: 'Module 2', icon: 'fa-book', group: 'learn' },
  { id: 'review2', label: 'Review 2', icon: 'fa-check-circle', group: 'learn' },
  { id: 'module3', label: 'Module 3', icon: 'fa-book', group: 'learn' },
  { id: 'review3', label: 'Review 3', icon: 'fa-check-circle', group: 'learn' },
  { id: 'assessment', label: 'Assessment', icon: 'fa-clipboard-list', group: 'assess' },
  { id: 'evaluation', label: 'Evaluation', icon: 'fa-star', group: 'complete' },
  { id: 'certificate', label: 'Certificate', icon: 'fa-award', group: 'complete' },
];

const groupLabels: Record<string, string> = {
  start: 'Getting Started',
  learn: 'Course Content',
  assess: 'Assessment',
  complete: 'Completion',
};

function isCompleted(state: CourseProgress, id: SectionId): boolean {
  switch (id) {
    case 'module1': return state.completedModules.has('module1');
    case 'module2': return state.completedModules.has('module2');
    case 'module3': return state.completedModules.has('module3');
    case 'review1': return state.completedReviews.has('review1');
    case 'review2': return state.completedReviews.has('review2');
    case 'review3': return state.completedReviews.has('review3');
    case 'assessment': return state.assessmentResult?.passed === true;
    case 'evaluation': return state.evaluationResponse !== null;
    case 'certificate': return state.certificateUnlocked;
    default: return false;
  }
}

export function Sidebar() {
  const { state } = useCourse();

  return (
    <aside
      aria-label="Course navigation"
      className="w-64 min-w-64 bg-white border-r border-kpmg-border overflow-y-auto h-[calc(100vh-52px)] sticky top-[52px]"
    >
      <nav className="py-4">
        {sidebarItems.map((item, index) => {
          const accessible = canAccessSection(state, item.id);
          const completed = isCompleted(state, item.id);
          const showGroup = index === 0 || sidebarItems[index - 1].group !== item.group;

          const content = (active: boolean) => (
            <>
              <div className="w-6 flex justify-center" aria-hidden="true">
                {completed ? (
                  <i className="fas fa-check-circle text-kpmg-green"></i>
                ) : !accessible ? (
                  <i className="fas fa-lock text-gray-300 text-xs"></i>
                ) : (
                  <i className={`fas ${item.icon} ${active ? 'text-kpmg-blue' : 'text-gray-400'}`}></i>
                )}
              </div>
              <span className="truncate">{item.label}</span>
              {completed && (
                <span className="ml-auto text-[10px] font-medium text-kpmg-green bg-kpmg-green/10 px-1.5 py-0.5 rounded-full">
                  Done
                </span>
              )}
            </>
          );

          return (
            <div key={item.id}>
              {showGroup && (
                <div className="px-4 pt-4 pb-1 first:pt-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-kpmg-gray/60">
                    {groupLabels[item.group]}
                  </span>
                </div>
              )}
              {accessible ? (
                <NavLink
                  to={sectionPaths[item.id]}
                  end={item.id === 'overview'}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-kpmg-blue/10 text-kpmg-blue border-r-3 border-kpmg-blue font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-kpmg-blue'
                    }`
                  }
                >
                  {({ isActive }) => content(isActive)}
                </NavLink>
              ) : (
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 cursor-not-allowed"
                >
                  {content(false)}
                </button>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
