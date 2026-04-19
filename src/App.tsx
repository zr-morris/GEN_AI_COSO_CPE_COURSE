import { lazy, Suspense, useEffect, useRef } from 'react';
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { Sidebar } from './components/Sidebar';
import { CourseOverview } from './components/CourseOverview';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RequireAccess } from './components/RequireAccess';
import { CourseDataProvider } from './store/courseDataStore';
import { AuthProvider } from './store/authStore';
import { ProgressProvider } from './store/progressStore';

const ModuleView = lazy(() =>
  import('./components/ModuleView').then((m) => ({ default: m.ModuleView })),
);
const ReviewQuestions = lazy(() =>
  import('./components/ReviewQuestions').then((m) => ({ default: m.ReviewQuestions })),
);
const Assessment = lazy(() =>
  import('./components/Assessment').then((m) => ({ default: m.Assessment })),
);
const Evaluation = lazy(() =>
  import('./components/Evaluation').then((m) => ({ default: m.Evaluation })),
);
const Certificate = lazy(() =>
  import('./components/Certificate').then((m) => ({ default: m.Certificate })),
);

function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center py-24"
    >
      <div className="flex items-center gap-3 text-kpmg-gray">
        <i className="fas fa-circle-notch fa-spin text-xl" aria-hidden="true"></i>
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  );
}

function ScrollToTop({ scrollRef }: { scrollRef: React.RefObject<HTMLElement | null> }) {
  const { pathname } = useLocation();
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [pathname, scrollRef]);
  return null;
}

function AppLayout() {
  const mainRef = useRef<HTMLElement>(null);

  return (
    <div className="min-h-screen bg-kpmg-light-gray">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-kpmg-blue focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>
      <div className="no-print">
        <NavBar />
      </div>
      <div className="flex">
        <div className="no-print">
          <Sidebar />
        </div>
        <main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto h-[calc(100vh-52px)] p-6 md:p-8 focus:outline-none"
        >
          <ScrollToTop scrollRef={mainRef} />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<CourseOverview />} />
              <Route
                path="/module/1"
                element={
                  <RequireAccess section="module1">
                    <ModuleView moduleId="module1" />
                  </RequireAccess>
                }
              />
              <Route
                path="/module/2"
                element={
                  <RequireAccess section="module2">
                    <ModuleView moduleId="module2" />
                  </RequireAccess>
                }
              />
              <Route
                path="/module/3"
                element={
                  <RequireAccess section="module3">
                    <ModuleView moduleId="module3" />
                  </RequireAccess>
                }
              />
              <Route
                path="/review/1"
                element={
                  <RequireAccess section="review1">
                    <ReviewQuestions reviewId="review1" />
                  </RequireAccess>
                }
              />
              <Route
                path="/review/2"
                element={
                  <RequireAccess section="review2">
                    <ReviewQuestions reviewId="review2" />
                  </RequireAccess>
                }
              />
              <Route
                path="/review/3"
                element={
                  <RequireAccess section="review3">
                    <ReviewQuestions reviewId="review3" />
                  </RequireAccess>
                }
              />
              <Route
                path="/assessment"
                element={
                  <RequireAccess section="assessment">
                    <Assessment />
                  </RequireAccess>
                }
              />
              <Route
                path="/evaluation"
                element={
                  <RequireAccess section="evaluation">
                    <Evaluation />
                  </RequireAccess>
                }
              />
              <Route
                path="/certificate"
                element={
                  <RequireAccess section="certificate">
                    <Certificate />
                  </RequireAccess>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      {/*
        Provider stack (outer → inner):
          ErrorBoundary       — catches uncaught render errors
          AuthProvider        — bootstraps session, shows <Login /> if anon
          CourseDataProvider  — fetches course content for signed-in users
          ProgressProvider    — learner progress: reducer + localStorage cache
                                + debounced sync to /api/progress/
          HashRouter          — routes inside the course
      */}
      <AuthProvider>
        <CourseDataProvider>
          <ProgressProvider>
            <HashRouter>
              <AppLayout />
            </HashRouter>
          </ProgressProvider>
        </CourseDataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
