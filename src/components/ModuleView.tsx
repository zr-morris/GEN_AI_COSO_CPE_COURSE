import { useCourse, type SectionId } from '../store/courseStore';
import { courseData } from '../data/courseContent';
import type { ContentBlock } from '../data/courseContent';

interface ModuleViewProps {
  moduleId: 'module1' | 'module2' | 'module3';
}

function renderContentBlock(block: ContentBlock, index: number) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p key={index} className="text-sm text-gray-700 leading-relaxed mb-4">
          {block.content}
        </p>
      );
    case 'heading':
      return (
        <h3 key={index} className="text-lg font-bold text-gray-900 mt-6 mb-3">
          {block.content}
        </h3>
      );
    case 'callout': {
      const variants = {
        info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'fa-info-circle text-blue-600', titleColor: 'text-blue-800' },
        tip: { bg: 'bg-green-50', border: 'border-green-200', icon: 'fa-lightbulb text-green-600', titleColor: 'text-green-800' },
        warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'fa-exclamation-triangle text-amber-600', titleColor: 'text-amber-800' },
        important: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'fa-exclamation-circle text-purple-600', titleColor: 'text-purple-800' },
      };
      const v = variants[block.variant || 'info'];
      return (
        <div key={index} className={`${v.bg} ${v.border} border rounded-xl p-4 mb-4`}>
          <div className="flex items-center gap-2 mb-2">
            <i className={`fas ${v.icon}`}></i>
            <span className={`text-sm font-semibold ${v.titleColor}`}>{block.title}</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{block.content}</p>
        </div>
      );
    }
    case 'example':
      return (
        <div key={index} className="bg-kpmg-blue/5 border border-kpmg-blue/15 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-flask text-kpmg-blue"></i>
            <span className="text-sm font-semibold text-kpmg-blue">{block.title}</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{block.content}</p>
        </div>
      );
    case 'warning':
      return (
        <div key={index} className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-exclamation-triangle text-red-600"></i>
            <span className="text-sm font-semibold text-red-800">{block.title}</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{block.content}</p>
        </div>
      );
    case 'table':
      return (
        <div key={index} className="overflow-x-auto mb-4 rounded-xl border border-kpmg-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-kpmg-blue/5">
                {block.headers?.map((header, i) => (
                  <th key={i} className="text-left px-4 py-3 font-semibold text-kpmg-blue border-b border-kpmg-border">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows?.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 text-gray-700 border-b border-kpmg-border/50">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'list':
      return (
        <ul key={index} className="space-y-2 mb-4 ml-1">
          {block.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <i className="fas fa-chevron-right text-kpmg-blue text-[10px] mt-1.5 flex-shrink-0"></i>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

export function ModuleView({ moduleId }: ModuleViewProps) {
  const { state, dispatch } = useCourse();
  const moduleIndex = parseInt(moduleId.replace('module', '')) - 1;
  const module = courseData.modules[moduleIndex];
  const isCompleted = state.completedModules.has(moduleId);
  const reviewId = `review${moduleIndex + 1}` as SectionId;

  if (!module) return null;

  const handleComplete = () => {
    dispatch({ type: 'COMPLETE_MODULE', moduleId });
    dispatch({ type: 'NAVIGATE', section: reviewId });
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
              <i className="fas fa-check-circle"></i> Completed
            </span>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{module.title}</h1>
        <p className="text-kpmg-gray">{module.description}</p>
      </div>

      {/* Learning Objectives */}
      <div className="bg-kpmg-blue/5 border border-kpmg-blue/10 rounded-xl p-5 mb-8">
        <h3 className="text-sm font-bold text-kpmg-blue mb-3 flex items-center gap-2">
          <i className="fas fa-bullseye"></i>
          Module Learning Objectives
        </h3>
        <div className="space-y-2">
          {module.learningObjectives.map((obj) => (
            <div key={obj.id} className="flex items-start gap-2">
              <i className="fas fa-check text-kpmg-green text-xs mt-1"></i>
              <span className="text-sm text-gray-700">{obj.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Module Sections */}
      {module.sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-kpmg-border">
            {section.title}
          </h2>
          {section.content.map((block, blockIndex) => renderContentBlock(block, blockIndex))}
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
          onClick={handleComplete}
          className={`inline-flex items-center gap-2 font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 ${
            isCompleted
              ? 'bg-kpmg-green/10 text-kpmg-green'
              : 'bg-kpmg-blue hover:bg-kpmg-blue/90 text-white shadow-lg shadow-kpmg-blue/20'
          }`}
        >
          {isCompleted ? (
            <>
              <i className="fas fa-check-circle"></i>
              <span>Continue to Review</span>
            </>
          ) : (
            <>
              <span>Mark Complete & Continue</span>
              <i className="fas fa-arrow-right"></i>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
