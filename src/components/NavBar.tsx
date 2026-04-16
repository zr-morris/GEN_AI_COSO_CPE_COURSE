import { useCourse, getProgressMilestones } from '../store/courseStore';

export function NavBar() {
  const { state } = useCourse();
  const { completed, total } = getProgressMilestones(state);
  const percentage = Math.round((completed / total) * 100);

  return (
    <header className="sticky top-0 z-50 bg-kpmg-blue text-white shadow-lg">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <i className="fas fa-graduation-cap text-xl"></i>
            <span className="text-xl font-bold tracking-tight">KPMG</span>
          </div>
          <div className="hidden md:block h-6 w-px bg-white/30"></div>
          <span className="hidden md:block text-sm font-medium text-white/90">
            CPE Self-Study
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-xs font-medium text-white/80">
              Progress: {completed}/{total}
            </span>
            <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-kpmg-green rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-white/90">
              {percentage}%
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/70">
            <i className="fas fa-clock"></i>
            <span>1.0 CPE Credit</span>
          </div>
        </div>
      </div>
    </header>
  );
}
