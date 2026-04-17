import { useState, useRef } from 'react';
import { useCourse, type SectionId } from '../store/courseStore';
import { courseData } from '../data/courseContent';

interface ReviewQuestionsProps {
  reviewId: 'review1' | 'review2' | 'review3';
}

export function ReviewQuestions({ reviewId }: ReviewQuestionsProps) {
  const { state, dispatch } = useCourse();
  const reviewIndex = parseInt(reviewId.replace('review', '')) - 1;
  const questions = courseData.reviewQuestions[reviewId] || [];
  const reviewAnswers = state.reviewAnswers[reviewId] || {};
  const isCompleted = state.completedReviews.has(reviewId);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const allAnswered = questions.every((q) => reviewAnswers[q.id]?.isLocked);
  const unansweredQuestions = questions.filter((q) => !reviewAnswers[q.id]?.isLocked);

  const nextSections: Record<string, SectionId> = {
    review1: 'module2',
    review2: 'module3',
    review3: 'assessment',
  };

  const handleSelect = (questionId: string, optionId: string) => {
    if (reviewAnswers[questionId]?.isLocked) return;
    setSelectedOptions((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitAnswer = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;
    const selected = selectedOptions[questionId];
    if (!selected) return;

    const isCorrect = selected === question.correctAnswer;
    dispatch({
      type: 'SET_REVIEW_ANSWER',
      reviewId,
      questionId,
      answer: {
        questionId,
        selectedOption: selected,
        isCorrect,
        isLocked: true,
      },
    });

    // Hide warning if this was the last unanswered question
    const remainingAfter = unansweredQuestions.filter((q) => q.id !== questionId);
    if (remainingAfter.length === 0) {
      setShowIncompleteWarning(false);
    }
  };

  const handleContinue = () => {
    if (!allAnswered) {
      setShowIncompleteWarning(true);
      return;
    }
    setShowIncompleteWarning(false);
    if (!isCompleted) {
      dispatch({ type: 'COMPLETE_REVIEW', reviewId });
    }
    dispatch({ type: 'NAVIGATE', section: nextSections[reviewId] });
  };

  const scrollToQuestion = (questionId: string) => {
    const el = questionRefs.current[questionId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-amber-400', 'ring-offset-2');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-amber-400', 'ring-offset-2');
      }, 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-kpmg-purple text-white text-xs font-bold px-3 py-1 rounded-full">
            Review {reviewIndex + 1}
          </span>
          {isCompleted && (
            <span className="bg-kpmg-green/10 text-kpmg-green text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
              <i className="fas fa-check-circle"></i> Completed
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Module {reviewIndex + 1} Review Questions
        </h1>
        <p className="text-kpmg-gray text-sm">
          Answer all {questions.length} questions to continue. Select an answer and click "Submit" to lock your response.
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question, qIndex) => {
          const answer = reviewAnswers[question.id];
          const isLocked = answer?.isLocked;
          const selectedOption = isLocked ? answer.selectedOption : selectedOptions[question.id];

          return (
            <div
              key={question.id}
              ref={(el) => { questionRefs.current[question.id] = el; }}
              className={`bg-white border rounded-xl p-6 transition-all duration-300 ${
                isLocked
                  ? answer.isCorrect
                    ? 'border-kpmg-green/50 bg-kpmg-green/5'
                    : 'border-red-300 bg-red-50/50'
                  : 'border-kpmg-border hover:border-kpmg-blue/30'
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-kpmg-blue text-white text-xs font-bold flex items-center justify-center">
                  {qIndex + 1}
                </span>
                <p className="text-sm font-semibold text-gray-900 leading-relaxed pt-0.5">
                  {question.question}
                </p>
              </div>

              <div className="space-y-2 ml-10">
                {question.options.map((option) => {
                  const isSelected = selectedOption === option.id;
                  const isCorrectOption = option.id === question.correctAnswer;

                  let optionStyles = 'border-gray-200 hover:border-kpmg-blue/40 hover:bg-kpmg-blue/5 cursor-pointer';
                  if (isSelected && !isLocked) {
                    optionStyles = 'border-kpmg-blue bg-kpmg-blue/10 cursor-pointer';
                  }
                  if (isLocked) {
                    if (isCorrectOption) {
                      optionStyles = 'border-kpmg-green bg-kpmg-green/10';
                    } else if (isSelected && !answer.isCorrect) {
                      optionStyles = 'border-red-400 bg-red-50';
                    } else {
                      optionStyles = 'border-gray-100 bg-gray-50/50 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelect(question.id, option.id)}
                      disabled={isLocked}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-150 ${optionStyles}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isLocked && isCorrectOption
                          ? 'border-kpmg-green bg-kpmg-green'
                          : isLocked && isSelected && !answer.isCorrect
                            ? 'border-red-400 bg-red-400'
                            : isSelected
                              ? 'border-kpmg-blue bg-kpmg-blue'
                              : 'border-gray-300'
                      }`}>
                        {(isSelected || (isLocked && isCorrectOption)) && (
                          <i className={`fas text-[8px] text-white ${
                            isLocked && isCorrectOption ? 'fa-check' : isLocked && isSelected && !answer.isCorrect ? 'fa-times' : 'fa-circle'
                          }`}></i>
                        )}
                      </div>
                      <span className="text-sm text-gray-700">{option.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Submit / Feedback */}
              {!isLocked && selectedOption && (
                <div className="mt-4 ml-10">
                  <button
                    onClick={() => handleSubmitAnswer(question.id)}
                    className="bg-kpmg-blue hover:bg-kpmg-blue/90 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
                  >
                    Submit Answer
                  </button>
                </div>
              )}

              {isLocked && (
                <div className={`mt-4 ml-10 p-4 rounded-lg ${answer.isCorrect ? 'bg-kpmg-green/10' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <i className={`fas ${answer.isCorrect ? 'fa-check-circle text-kpmg-green' : 'fa-times-circle text-red-500'}`}></i>
                    <span className={`text-sm font-semibold ${answer.isCorrect ? 'text-kpmg-green' : 'text-red-600'}`}>
                      {answer.isCorrect ? 'Correct!' : 'Incorrect'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {answer.isCorrect ? question.feedback.correct : question.feedback.incorrect}
                  </p>
                  <p className="text-xs text-kpmg-gray mt-2 italic">{question.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Incomplete Warning Notification */}
      {showIncompleteWarning && !allAnswered && (
        <div className="mt-6 bg-amber-50 border border-amber-300 rounded-xl p-5 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
              <i className="fas fa-exclamation-triangle text-amber-600 text-sm"></i>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-800 mb-1">
                {unansweredQuestions.length === 1
                  ? '1 question still requires an answer'
                  : `${unansweredQuestions.length} questions still require answers`}
              </h4>
              <p className="text-xs text-amber-700 mb-3">
                You must answer all review questions before proceeding to the next section.
              </p>
              <div className="space-y-1.5">
                {unansweredQuestions.map((q) => {
                  const qNum = questions.findIndex((orig) => orig.id === q.id) + 1;
                  return (
                    <button
                      key={q.id}
                      onClick={() => scrollToQuestion(q.id)}
                      className="w-full flex items-center gap-2.5 text-left p-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50 transition-all duration-150 group"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center group-hover:bg-amber-300 transition-colors">
                        {qNum}
                      </span>
                      <span className="text-xs text-amber-900 leading-snug line-clamp-1 flex-1">
                        {q.question}
                      </span>
                      <i className="fas fa-arrow-up text-amber-400 text-xs group-hover:text-amber-600 transition-colors flex-shrink-0"></i>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div className="border-t border-kpmg-border mt-8 pt-6 pb-8 flex justify-between items-center">
        <p className="text-sm text-kpmg-gray">
          {allAnswered
            ? 'All questions answered. You may proceed to the next section.'
            : `${Object.keys(reviewAnswers).filter((k) => reviewAnswers[k]?.isLocked).length} of ${questions.length} questions completed.`}
        </p>
        <button
          onClick={handleContinue}
          className={`inline-flex items-center gap-2 font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 ${
            allAnswered
              ? 'bg-kpmg-blue hover:bg-kpmg-blue/90 text-white shadow-lg shadow-kpmg-blue/20'
              : 'bg-kpmg-blue/80 hover:bg-kpmg-blue text-white shadow-md'
          }`}
        >
          <span>Continue</span>
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
}
