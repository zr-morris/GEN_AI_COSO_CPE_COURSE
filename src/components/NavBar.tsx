import { useState } from 'react';
import { useCourse, getProgressMilestones } from '../store/courseStore';
import { useAuth } from '../store/authContext';

export function NavBar() {
  const { state } = useCourse();
  const { user, logout } = useAuth();
  const { completed, total } = getProgressMilestones(state);
  const percentage = Math.round((completed / total) * 100);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      setLoggingOut(false);
    }
  };

  // First letter of full name or username — cheap avatar for the corner.
  const initial = (user.fullName || user.username).trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-kpmg-blue text-white shadow-lg">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <i
              className="fas fa-graduation-cap text-xl"
              aria-hidden="true"
            ></i>
            <span className="text-xl font-bold tracking-tight">KPMG</span>
          </div>
          <div className="hidden md:block h-6 w-px bg-white/30" aria-hidden="true"></div>
          <span className="hidden md:block text-sm font-medium text-white/90">
            CPE Self-Study
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-xs font-medium text-white/80">
              Progress: {completed}/{total}
            </span>
            <div
              role="progressbar"
              aria-label="Course progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percentage}
              className="w-32 h-2 bg-white/20 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-kpmg-green rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-white/90">
              {percentage}%
            </span>
          </div>

          <div className="hidden md:block h-6 w-px bg-white/30" aria-hidden="true"></div>

          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-sm font-semibold"
              title={user.email || user.username}
            >
              {initial || '?'}
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-xs font-semibold text-white">
                {user.fullName || user.username}
              </span>
              <span className="text-[10px] text-white/60">{user.email}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="Sign out"
              title="Sign out"
              className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 px-2 py-1 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i
                className={`fas ${loggingOut ? 'fa-circle-notch fa-spin' : 'fa-sign-out-alt'}`}
                aria-hidden="true"
              ></i>
              <span className="hidden sm:inline">
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
