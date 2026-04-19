import { useNavigate } from 'react-router-dom';
import { sectionPaths, useCourse } from '../store/courseStore';
import { useCourseData } from '../store/courseDataContext';

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function Certificate() {
  const { state } = useCourse();
  const navigate = useNavigate();
  const courseData = useCourseData();

  if (!state.certificateUnlocked || !state.assessmentResult) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div
            aria-hidden="true"
            className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6"
          >
            <i className="fas fa-lock text-3xl text-gray-300"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Certificate Locked</h1>
          <p className="text-kpmg-gray max-w-md mx-auto mb-6">
            Complete all course modules, pass the assessment, and submit your evaluation to unlock your CPE certificate.
          </p>
          <button
            type="button"
            onClick={() => navigate(sectionPaths.overview)}
            className="text-kpmg-blue hover:text-kpmg-blue/80 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-kpmg-blue rounded"
          >
            <i className="fas fa-arrow-left mr-1" aria-hidden="true"></i>
            Return to Overview
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header — hidden when printing */}
      <div className="mb-8 flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Your Certificate</h1>
          <p className="text-kpmg-gray text-sm">Congratulations on completing the course!</p>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 bg-kpmg-blue hover:bg-kpmg-blue/90 text-white font-medium px-5 py-2.5 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kpmg-blue focus-visible:ring-offset-2"
        >
          <i className="fas fa-print" aria-hidden="true"></i>
          <span>Print Certificate</span>
        </button>
      </div>

      {/* Certificate Card */}
      <div id="certificate" className="bg-white border-2 border-kpmg-blue/20 rounded-2xl shadow-xl overflow-hidden print:shadow-none print:border-2 print:border-kpmg-blue">
        {/* Top Border Accent */}
        <div className="h-2 bg-gradient-to-r from-kpmg-blue via-kpmg-light-blue to-kpmg-purple"></div>

        <div className="p-10 md:p-14">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <i className="fas fa-graduation-cap text-3xl text-kpmg-blue" aria-hidden="true"></i>
              <span className="text-3xl font-bold text-kpmg-blue tracking-tight">KPMG</span>
            </div>
            <h2 className="text-lg font-bold text-kpmg-gray uppercase tracking-widest mb-1">
              Certificate of Completion
            </h2>
            <div className="w-24 h-0.5 bg-kpmg-blue mx-auto mt-2"></div>
          </div>

          {/* Recipient */}
          <div className="text-center mb-8">
            <p className="text-sm text-kpmg-gray mb-2">This certifies that</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">Zachary Morris</p>
            <p className="text-sm text-kpmg-gray">has successfully completed</p>
          </div>

          {/* Course Title */}
          <div className="text-center mb-8 bg-kpmg-blue/5 rounded-xl p-6">
            <h3 className="text-xl font-bold text-kpmg-blue leading-snug">
              {courseData.title}
            </h3>
            <p className="text-sm text-kpmg-gray mt-1">{courseData.subtitle}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-kpmg-gray mb-1">Completion Date</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatDate(state.assessmentResult.completedAt)}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-kpmg-gray mb-1">Assessment Score</p>
              <p className="text-sm font-semibold text-kpmg-green">
                {state.assessmentResult.percentage}%
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-kpmg-gray mb-1">Time to Complete</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatTime(state.assessmentResult.timeSeconds)}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-kpmg-gray mb-1">CPE Credits</p>
              <p className="text-sm font-semibold text-kpmg-blue">
                {courseData.cpeCredits} Credit
              </p>
            </div>
          </div>

          {/* CPE Details */}
          <div className="border-t border-kpmg-border pt-6 mb-6">
            <h4 className="text-sm font-bold text-gray-900 mb-3">CPE Credit Information</h4>
            <div className="grid md:grid-cols-2 gap-3 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <i className="fas fa-check text-kpmg-green mt-0.5" aria-hidden="true"></i>
                <span>Field of Study: Auditing</span>
              </div>
              <div className="flex items-start gap-2">
                <i className="fas fa-check text-kpmg-green mt-0.5" aria-hidden="true"></i>
                <span>Instructional Method: Self-Study</span>
              </div>
              <div className="flex items-start gap-2">
                <i className="fas fa-check text-kpmg-green mt-0.5" aria-hidden="true"></i>
                <span>Prerequisites: None</span>
              </div>
              <div className="flex items-start gap-2">
                <i className="fas fa-check text-kpmg-green mt-0.5" aria-hidden="true"></i>
                <span>Program Level: Basic</span>
              </div>
              <div className="flex items-start gap-2">
                <i className="fas fa-check text-kpmg-green mt-0.5" aria-hidden="true"></i>
                <span>Advance Preparation: None Required</span>
              </div>
              <div className="flex items-start gap-2">
                <i className="fas fa-check text-kpmg-green mt-0.5" aria-hidden="true"></i>
                <span>CPE Credits: {courseData.cpeCredits} (based on 50-minute hour)</span>
              </div>
            </div>
          </div>

          {/* AICPA/NASBA Compliance */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-[10px] text-kpmg-gray leading-relaxed">
              This program is designed to meet the continuing professional education requirements
              of state boards of accountancy and has been prepared in compliance with the Statement on
              Standards for Continuing Professional Education (CPE) Programs jointly issued by the
              American Institute of Certified Public Accountants (AICPA) and the National Association of
              State Boards of Accountancy (NASBA). Course evaluation completed in accordance with
              AICPA/NASBA Standard No. 14.
            </p>
          </div>
        </div>

        {/* Bottom Border Accent */}
        <div className="h-2 bg-gradient-to-r from-kpmg-blue via-kpmg-light-blue to-kpmg-purple"></div>
      </div>
    </div>
  );
}
