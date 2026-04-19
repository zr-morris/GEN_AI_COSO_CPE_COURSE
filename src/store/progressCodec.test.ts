// Codec round-trip tests. The same shape feeds localStorage and the server
// `payload` blob, so regressions here break both sinks at once.

import { describe, expect, it } from 'vitest';
import { courseReducer, createInitialProgress } from './courseStore';
import {
  PROGRESS_VERSION,
  decodeProgress,
  encodeProgress,
} from './progressCodec';

describe('progressCodec', () => {
  it('encodes Sets as arrays and tags the payload with a version', () => {
    let s = createInitialProgress();
    s = courseReducer(s, { type: 'COMPLETE_MODULE', moduleId: 'module1' });

    const encoded = encodeProgress(s);
    expect(encoded.version).toBe(PROGRESS_VERSION);
    expect(Array.isArray(encoded.data.completedModules)).toBe(true);
    expect(encoded.data.completedModules).toContain('module1');
  });

  it('round-trips a non-trivial state including Sets', () => {
    let s = createInitialProgress();
    s = courseReducer(s, { type: 'COMPLETE_MODULE', moduleId: 'module1' });
    s = courseReducer(s, { type: 'COMPLETE_MODULE', moduleId: 'module2' });
    s = courseReducer(s, { type: 'COMPLETE_REVIEW', reviewId: 'review1' });
    s = courseReducer(s, {
      type: 'SET_REVIEW_ANSWER',
      reviewId: 'review1',
      questionId: 'rq-1',
      answer: {
        questionId: 'rq-1',
        selectedOption: 'b',
        isCorrect: true,
        isLocked: true,
      },
    });

    const decoded = decodeProgress(JSON.parse(JSON.stringify(encodeProgress(s))));

    expect(decoded).not.toBeNull();
    expect(decoded!.completedModules).toBeInstanceOf(Set);
    expect(decoded!.completedModules.has('module1')).toBe(true);
    expect(decoded!.completedModules.has('module2')).toBe(true);
    expect(decoded!.completedReviews.has('review1')).toBe(true);
    expect(decoded!.reviewAnswers.review1['rq-1'].selectedOption).toBe('b');
  });

  it('decodes null on a missing payload / wrong shape', () => {
    expect(decodeProgress(null)).toBeNull();
    expect(decodeProgress('')).toBeNull();
    expect(decodeProgress({ version: PROGRESS_VERSION })).toBeNull();
    expect(
      decodeProgress({
        version: PROGRESS_VERSION,
        data: { startedAt: 'x' /* rest missing */ },
      }),
    ).toBeNull();
  });

  it('decodes null on a version mismatch (forces a fresh state)', () => {
    const s = encodeProgress(createInitialProgress());
    const bumped = { ...s, version: PROGRESS_VERSION + 99 };
    expect(decodeProgress(bumped)).toBeNull();
  });
});
