import { Navigate } from 'react-router-dom';
import { canAccessSection, useCourse, type SectionId } from '../store/courseStore';

interface RequireAccessProps {
  section: SectionId;
  children: React.ReactNode;
}

export function RequireAccess({ section, children }: RequireAccessProps) {
  const { state } = useCourse();
  if (!canAccessSection(state, section)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
