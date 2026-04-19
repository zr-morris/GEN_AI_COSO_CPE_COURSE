import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sectionPaths, useCourse } from '../store/courseStore';
import { useCourseData } from '../store/courseDataContext';

const likertOptions = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

export function Evaluation() {
  const { state, dispatch } = useCourse();
  const navigate = useNavigate();
  const courseData = useCourseData();
  const questions = courseData.evaluationQuestions;
  const isSubmitted = state.evaluationResponse !== null;
  const [responses, setResponses] = useState<Record<string, number | string>>({});

  const allAnswered = questions.every((q) => {
    if (q.type === 'likert') return typeof responses[q.id] === 'number';
    return true;
  });

  const handleLikertSelect = (questionId: string, value: number) => {
    if (isSubmitted) return;
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleTextChange = (questionId: string, value: string) => {
    if (isSubmitted) return;
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    dispatch({
      type: 'SUBMIT_EVALUATION',
      response: {
        responses,
        submittedAt: new Date().toISOString(),
      },
    });
  };

  if (isSubmitted) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div
            aria-hidden="true"
            className="w-20 h-20 rounded-full bg-kpmg-green/10 flex items-center justify-center mx-auto mb-6"
          >
            <i className="fas fa-check-circle text-4xl text-kpmg-green"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Thank You for Your Evaluation
          </h1>
          <p className="text-kpmg-gray mb-8 max-w-md mx-auto">
            Your feedback has been recorded. Your certificate is now available.
          </p>
          <button
            type="button"
            onClick={() => navigate(sectionPaths.certificate)}
            className="inline-flex items-center gap-2 bg-kpmg-blue hover:bg-kpmg-blue/90 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-kpmg-blue/25 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-kpmg-blue focus-visible:ring-offset-2"
          >
            <i className="fas fa-award" aria-hidden="true"></i>
            <span>View Your Certificate</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-kpmg-light-blue text-white text-xs font-bold px-3 py-1 rounded-full">
            Course Evaluation
          </span>
          <span className="bg-gray-100 text-kpmg-gray text-xs font-medium px-3 py-1 rounded-full">
            AICPA/NASBA Standard No. 14
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Evaluation</h1>
        <p className="text-kpmg-gray text-sm">
          Please rate each statement below. Your evaluation helps us improve course quality and is required
          per AICPA/NASBA Standards for CPE Programs.
        </p>
      </div>

      <ol className="space-y-6 list-none p-0">
        {questions.map((question, qIndex) => {
          const labelId = `eval-${question.id}-label`;
          return (
            <li key={question.id} className="bg-white border border-kpmg-border rounded-xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <span
                  aria-hidden="true"
                  className="flex-shrink-0 w-7 h-7 rounded-full bg-kpmg-light-blue text-white text-xs font-bold flex items-center justify-center"
                >
                  {qIndex + 1}
                </span>
                <p
                  id={labelId}
                  className="text-sm font-semibold text-gray-900 leading-relaxed pt-0.5"
                >
                  <span className="sr-only">Question {qIndex + 1}: </span>
                  {question.question}
                </p>
              </div>

              {question.type === 'likert' ? (
                <div
                  role="radiogroup"
                  aria-labelledby={labelId}
                  className="ml-10 flex flex-wrap gap-2"
                >
                  {likertOptions.map((option) => {
                    const isSelected = responses[question.id] === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={`${option.value} — ${option.label}`}
                        onClick={() => handleLikertSelect(question.id, option.value)}
                        className={`flex flex-col items-center px-4 py-3 rounded-lg border text-center transition-all duration-150 min-w-[90px] focus:outline-none focus-visible:ring-2 focus-visible:ring-kpmg-light-blue focus-visible:ring-offset-2 ${
                          isSelected
                            ? 'border-kpmg-light-blue bg-kpmg-light-blue/10 text-kpmg-light-blue'
                            : 'border-gray-200 hover:border-kpmg-light-blue/40 hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <span className={`text-lg font-bold mb-0.5 ${isSelected ? 'text-kpmg-light-blue' : 'text-gray-400'}`}>
                          {option.value}
                        </span>
                        <span className="text-[10px] leading-tight">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="ml-10">
                  <textarea
                    aria-labelledby={labelId}
                    value={(responses[question.id] as string) || ''}
                    onChange={(e) => handleTextChange(question.id, e.target.value)}
                    placeholder="Enter your comments here (optional)..."
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-kpmg-light-blue/50 focus:border-kpmg-light-blue resize-y min-h-[100px]"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="border-t border-kpmg-border mt-8 pt-6 pb-8 flex justify-between items-center">
        <p className="text-sm text-kpmg-gray">
          {allAnswered ? 'Ready to submit your evaluation.' : 'Please rate all statements to continue.'}
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered}
          className={`inline-flex items-center gap-2 font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-kpmg-blue focus-visible:ring-offset-2 ${
            allAnswered
              ? 'bg-kpmg-blue hover:bg-kpmg-blue/90 text-white shadow-lg shadow-kpmg-blue/20'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span>Submit Evaluation</span>
          <i className="fas fa-paper-plane" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  );
}
