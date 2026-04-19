import { useNavigate } from 'react-router-dom';
import { sectionPaths, useCourse, type SectionId } from '../store/courseStore';
import { useCourseData } from '../store/courseDataContext';
import { ContentBlock } from './ContentBlock';

interface ModuleViewProps {
  moduleId: 'module1' | 'module2' | 'module3';
}

export function ModuleView({ moduleId }: ModuleViewProps) {
  const { state, dispatch } = useCourse();
  const navigate = useNavigate();
  const courseData = useCourseData();
  const moduleIndex = parseInt(moduleId.replace('module', '')) - 1;
  const module = courseData.modules[moduleIndex];
  const isCompleted = state.completedModules.has(moduleId);
  const reviewId = `review${moduleIndex + 1}` as SectionId;

  if (!module) return null;

  const handleComplete = () => {
    dispatch({ type: 'COMPLETE_MODULE', moduleId });
    navigate(sectionPaths[reviewId]);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Module Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-kpmg-blue text-white text-xs font-bold px-3 py-1 rounded-full">
            Module {moduleIndex + 1} of 3
          </span>
          {isCompleted && (
            <span className="bg-kpmg-green/10 text-kpmg-green text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
              <i className="fas fa-check-circle" aria-hidden="true"></i>
              <span>Completed</span>
            </span>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{module.title}</h1>
        <p className="text-kpmg-gray">{module.description}</p>
      </div>

      <section
        aria-labelledby={`module-${moduleId}-objectives`}
        className="bg-kpmg-blue/5 border border-kpmg-blue/10 rounded-xl p-5 mb-8"
      >
        <h2
          id={`module-${moduleId}-objectives`}
          className="text-sm font-bold text-kpmg-blue mb-3 flex items-center gap-2"
        >
          <i className="fas fa-bullseye" aria-hidden="true"></i>
          Module Learning Objectives
        </h2>
        <ul className="space-y-2 list-none p-0">
          {module.learningObjectives.map((obj) => (
            <li key={obj.id} className="flex items-start gap-2">
              <i
                className="fas fa-check text-kpmg-green text-xs mt-1"
                aria-hidden="true"
              ></i>
              <span className="text-sm text-gray-700">{obj.text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Module Sections */}
      {module.sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-kpmg-border">
            {section.title}
          </h2>
          {section.content.map((block, blockIndex) => (
            <ContentBlock key={blockIndex} block={block} />
          ))}
        </div>
      ))}

      {/* Complete Button */}
      <div className="border-t border-kpmg-border pt-6 pb-8 flex justify-between items-center">
        <p className="text-sm text-kpmg-gray">
          {isCompleted
            ? 'You have completed this module.'
            : 'Complete reading to proceed to the review questions.'}
        </p>
        <button
          type="button"
          onClick={handleComplete}
          className={`inline-flex items-center gap-2 font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-kpmg-blue focus-visible:ring-offset-2 ${
            isCompleted
              ? 'bg-kpmg-green/10 text-kpmg-green'
              : 'bg-kpmg-blue hover:bg-kpmg-blue/90 text-white shadow-lg shadow-kpmg-blue/20'
          }`}
        >
          {isCompleted ? (
            <>
              <i className="fas fa-check-circle" aria-hidden="true"></i>
              <span>Continue to Review</span>
            </>
          ) : (
            <>
              <span>Mark Complete & Continue</span>
              <i className="fas fa-arrow-right" aria-hidden="true"></i>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
