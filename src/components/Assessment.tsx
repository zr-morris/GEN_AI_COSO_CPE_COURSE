import { useCourse } from '../store/courseStore';
import { courseData } from '../data/courseContent';
import type { AssessmentResult } from '../store/courseStore';

export function Assessment() {
  const { state, dispatch } = useCourse();
  const questions = courseData.assessmentQuestions;
  const { assessmentResult, assessmentAnswers } = state;
  const isSubmitted = assessmentResult !== null;

  const allAnswered = questions.every((q) => assessmentAnswers[q.id]);

  const handleSelect = (questionId: string, optionId: string) => {
    if (isSubmitted) return;
    dispatch({ type: 'SET_ASSESSMENT_ANSWER', questionId, selectedOption: optionId });
  };

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (assessmentAnswers[q.id] === q.correctAnswer) correct++;
    });

    const percentage = Math.round((correct / questions.length) * 100);
    const startTime = new Date(state.startedAt).getTime();
    const timeSeconds = Math.round((Date.now() - startTime) / 1000);

    const result: AssessmentResult = {
      score: correct,
      totalQuestions: questions.length,
      percentage,
      passed: percentage >= courseData.passingScore,
      answers: {},
      completedAt: new Date().toISOString(),
      timeSeconds,
    };

    dispatch({ type: 'SUBMIT_ASSESSMENT', result });
  };

  const handleRetake = () => {
    dispatch({ type: 'RESET' });
    // Re-mark all modules and reviews as complete so user can retake
    ['module1', 'module2', 'module3'].forEach((m) =>
      dispatch({ type: 'COMPLETE_MODULE', moduleId: m })
    );
    ['review1', 'review2', 'review3'].forEach((r) =>
      dispatch({ type: 'COMPLETE_REVIEW', reviewId: r })
    );
    dispatch({ type: 'NAVIGATE', section: 'assessment' });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-kpmg-purple text-white text-xs font-bold px-3 py-1 rounded-full">
            Final Assessment
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Assessment</h1>
        <p className="text-kpmg-gray text-sm">
          Answer all {questions.length} questions. You must score {courseData.passingScore}% or higher
          ({Math.ceil(questions.length * courseData.passingScore / 100)}/{questions.length}) to pass.
        </p>
      </div>

      {/* Score Banner (after submit) */}
      {isSubmitted && (
        <div className={`mb-8 p-6 rounded-xl border-2 ${
          assessmentResult.passed
            ? 'bg-kpmg-green/5 border-kpmg-green/30'
            : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <i className={`fas text-2xl ${
                  assessmentResult.passed ? 'fa-check-circle text-kpmg-green' : 'fa-times-circle text-red-500'
                }`}></i>
                <h2 className={`text-xl font-bold ${
                  assessmentResult.passed ? 'text-kpmg-green' : 'text-red-600'
                }`}>
                  {assessmentResult.passed ? 'Congratulations — You Passed!' : 'Assessment Not Passed'}
                </h2>
              </div>
              <p className="text-sm text-gray-600">
                You scored {assessmentResult.score} out of {assessmentResult.totalQuestions} ({assessmentResult.percentage}%).
                {!assessmentResult.passed && ` You need ${courseData.passingScore}% to pass.`}
              </p>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${
                assessmentResult.passed ? 'text-kpmg-green' : 'text-red-500'
              }`}>
                {assessmentResult.percentage}%
              </div>
              <div className="text-xs text-kpmg-gray">Score</div>
            </div>
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question, qIndex) => {
          const selectedOption = assessmentAnswers[question.id];
          const isCorrect = isSubmitted && selectedOption === question.correctAnswer;
          const isWrong = isSubmitted && selectedOption !== question.correctAnswer;

          return (
            <div
              key={question.id}
              className={`bg-white border rounded-xl p-6 transition-all ${
                isSubmitted
                  ? isCorrect
                    ? 'border-kpmg-green/50 bg-kpmg-green/5'
                    : 'border-red-300 bg-red-50/30'
                  : 'border-kpmg-border'
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className={`flex-shrink-0 w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center ${
                  isSubmitted
                    ? isCorrect ? 'bg-kpmg-green' : 'bg-red-500'
                    : 'bg-kpmg-blue'
                }`}>
                  {qIndex + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                    {question.question}
                  </p>
                  {isSubmitted && (
                    <span className="text-[10px] text-kpmg-gray italic">
                      {question.moduleReference}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 ml-10">
                {question.options.map((option) => {
                  const isSelected = selectedOption === option.id;
                  const isCorrectOpt = option.id === question.correctAnswer;

                  let styles = 'border-gray-200 hover:border-kpmg-blue/40 hover:bg-kpmg-blue/5 cursor-pointer';
                  if (isSelected && !isSubmitted) {
                    styles = 'border-kpmg-blue bg-kpmg-blue/10 cursor-pointer';
                  }
                  if (isSubmitted) {
                    if (isCorrectOpt) {
                      styles = 'border-kpmg-green bg-kpmg-green/10';
                    } else if (isSelected) {
                      styles = 'border-red-400 bg-red-50';
                    } else {
                      styles = 'border-gray-100 bg-gray-50/50 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelect(question.id, option.id)}
                      disabled={isSubmitted}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-150 ${styles}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSubmitted && isCorrectOpt
                          ? 'border-kpmg-green bg-kpmg-green'
                          : isSubmitted && isSelected
                            ? 'border-red-400 bg-red-400'
                            : isSelected
                              ? 'border-kpmg-blue bg-kpmg-blue'
                              : 'border-gray-300'
                      }`}>
                        {(isSelected || (isSubmitted && isCorrectOpt)) && (
                          <i className={`fas text-[8px] text-white ${
                            isSubmitted && isCorrectOpt ? 'fa-check' : isSubmitted && isSelected ? 'fa-times' : 'fa-circle'
                          }`}></i>
                        )}
                      </div>
                      <span className="text-sm text-gray-700">{option.text}</span>
                    </button>
                  );
                })}
              </div>

              {isSubmitted && (
                <div className={`mt-4 ml-10 p-3 rounded-lg ${isCorrect ? 'bg-kpmg-green/10' : 'bg-red-50'}`}>
                  <p className="text-sm text-gray-700">{question.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit / Continue / Retake */}
      <div className="border-t border-kpmg-border mt-8 pt-6 pb-8 flex justify-between items-center">
        {!isSubmitted ? (
          <>
            <p className="text-sm text-kpmg-gray">
              {allAnswered
                ? 'All questions answered. Ready to submit.'
                : `${Object.keys(assessmentAnswers).length}/${questions.length} questions answered.`}
            </p>
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className={`inline-flex items-center gap-2 font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 ${
                allAnswered
                  ? 'bg-kpmg-blue hover:bg-kpmg-blue/90 text-white shadow-lg shadow-kpmg-blue/20'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>Submit Assessment</span>
              <i className="fas fa-paper-plane"></i>
            </button>
          </>
        ) : assessmentResult.passed ? (
          <>
            <p className="text-sm text-kpmg-green font-medium">
              <i className="fas fa-check-circle mr-1"></i>
              Assessment passed! Continue to the course evaluation.
            </p>
            <button
              onClick={() => dispatch({ type: 'NAVIGATE', section: 'evaluation' })}
              className="inline-flex items-center gap-2 bg-kpmg-green hover:bg-kpmg-green/90 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-kpmg-green/20 transition-all duration-200"
            >
              <span>Continue to Evaluation</span>
              <i className="fas fa-arrow-right"></i>
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-red-600 font-medium">
              <i className="fas fa-exclamation-circle mr-1"></i>
              You did not meet the {courseData.passingScore}% passing threshold.
            </p>
            <button
              onClick={handleRetake}
              className="inline-flex items-center gap-2 bg-kpmg-blue hover:bg-kpmg-blue/90 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-kpmg-blue/20 transition-all duration-200"
            >
              <span>Retake Assessment</span>
              <i className="fas fa-redo"></i>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
