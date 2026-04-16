import { useReducer, useContext } from 'react';
import { NavBar } from './components/NavBar';
import { Sidebar } from './components/Sidebar';
import { CourseOverview } from './components/CourseOverview';
import { ModuleView } from './components/ModuleView';
import { ReviewQuestions } from './components/ReviewQuestions';
import { Assessment } from './components/Assessment';
import { Evaluation } from './components/Evaluation';
import { Certificate } from './components/Certificate';
import {
  CourseContext,
  courseReducer,
  initialProgress,
} from './store/courseStore';

function MainContent() {
  const context = useContext(CourseContext);
  if (!context) throw new Error('Missing CourseContext');
  const { state } = context;

  switch (state.currentSection) {
    case 'overview':
      return <CourseOverview />;
    case 'module1':
      return <ModuleView moduleId="module1" />;
    case 'module2':
      return <ModuleView moduleId="module2" />;
    case 'module3':
      return <ModuleView moduleId="module3" />;
    case 'review1':
      return <ReviewQuestions reviewId="review1" />;
    case 'review2':
      return <ReviewQuestions reviewId="review2" />;
    case 'review3':
      return <ReviewQuestions reviewId="review3" />;
    case 'assessment':
      return <Assessment />;
    case 'evaluation':
      return <Evaluation />;
    case 'certificate':
      return <Certificate />;
    default:
      return <CourseOverview />;
  }
}

function App() {
  const [state, dispatch] = useReducer(courseReducer, initialProgress);

  return (
    <CourseContext.Provider value={{ state, dispatch }}>
      <div className="min-h-screen bg-kpmg-light-gray">
        <NavBar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 overflow-y-auto h-[calc(100vh-52px)] p-6 md:p-8">
            <MainContent />
          </main>
        </div>
      </div>
    </CourseContext.Provider>
  );
}

export default App;
