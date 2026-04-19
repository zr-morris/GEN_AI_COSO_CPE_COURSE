import { useNavigate } from 'react-router-dom';
import { useCourseData } from '../store/courseDataContext';
import { sectionPaths } from '../store/courseStore';

export function CourseOverview() {
  const navigate = useNavigate();
  const courseData = useCourseData();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-kpmg-blue to-kpmg-purple rounded-2xl p-8 md:p-12 text-white mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-white/20 text-xs font-semibold px-3 py-1 rounded-full">
            CPE SELF-STUDY
          </span>
          <span className="bg-kpmg-green/80 text-xs font-semibold px-3 py-1 rounded-full">
            {courseData.cpeCredits} CPE Credit
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
          {courseData.title}
        </h1>
        <p className="text-lg text-white/90 font-medium mb-2">
          {courseData.subtitle}
        </p>
        <p className="text-white/75 leading-relaxed max-w-3xl">
          {courseData.description}
        </p>
      </div>

      {/* Course Details */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-kpmg-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-kpmg-blue/10 flex items-center justify-center">
              <i className="fas fa-book-open text-kpmg-blue" aria-hidden="true"></i>
            </div>
            <div>
              <p className="text-xs text-kpmg-gray">Format</p>
              <p className="font-semibold text-sm">Self-Study</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-kpmg-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-kpmg-green/10 flex items-center justify-center">
              <i className="fas fa-award text-kpmg-green" aria-hidden="true"></i>
            </div>
            <div>
              <p className="text-xs text-kpmg-gray">CPE Credits</p>
              <p className="font-semibold text-sm">{courseData.cpeCredits} Credit</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-kpmg-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-kpmg-purple/10 flex items-center justify-center">
              <i className="fas fa-clipboard-check text-kpmg-purple" aria-hidden="true"></i>
            </div>
            <div>
              <p className="text-xs text-kpmg-gray">Passing Score</p>
              <p className="font-semibold text-sm">{courseData.passingScore}% ({Math.ceil(courseData.totalAssessmentQuestions * courseData.passingScore / 100)}/{courseData.totalAssessmentQuestions})</p>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Objectives */}
      <div className="bg-white border border-kpmg-border rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <i className="fas fa-bullseye text-kpmg-blue" aria-hidden="true"></i>
          Learning Objectives
        </h2>
        <div className="space-y-3">
          {courseData.learningObjectives.map((objective, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-kpmg-blue/10 text-kpmg-blue text-xs font-bold flex items-center justify-center mt-0.5">
                {index + 1}
              </span>
              <p className="text-sm text-gray-700 leading-relaxed">{objective}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Course Structure */}
      <div className="bg-white border border-kpmg-border rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <i className="fas fa-sitemap text-kpmg-purple" aria-hidden="true"></i>
          Course Structure
        </h2>
        <div className="space-y-4">
          {courseData.modules.map((module, index) => (
            <div key={module.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-kpmg-blue text-white flex items-center justify-center font-bold flex-shrink-0">
                {index + 1}
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">{module.title}</h3>
                <p className="text-xs text-kpmg-gray mt-1">{module.description}</p>
              </div>
            </div>
          ))}
          <div className="flex items-start gap-4 p-4 bg-kpmg-blue/5 rounded-lg border border-kpmg-blue/10">
            <div className="w-10 h-10 rounded-lg bg-kpmg-purple text-white flex items-center justify-center flex-shrink-0">
              <i className="fas fa-clipboard-list text-sm" aria-hidden="true"></i>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900">Final Assessment</h3>
              <p className="text-xs text-kpmg-gray mt-1">
                {courseData.totalAssessmentQuestions} questions · {courseData.passingScore}% passing score · Followed by course evaluation and certificate
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Begin Button */}
      <div className="text-center pb-8">
        <button
          type="button"
          onClick={() => navigate(sectionPaths.module1)}
          className="inline-flex items-center gap-2 bg-kpmg-blue hover:bg-kpmg-blue/90 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-kpmg-blue/25 transition-all duration-200 hover:shadow-xl hover:shadow-kpmg-blue/30 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-kpmg-blue focus-visible:ring-offset-2"
        >
          <span>Begin Course</span>
          <i className="fas fa-arrow-right" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  );
}
