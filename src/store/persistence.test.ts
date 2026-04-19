import { describe, expect, it } from 'vitest';
import { clearPersistedProgress, loadProgress, persistProgress } from './persistence';
import { courseReducer, createInitialProgress } from './courseStore';

describe('persistence', () => {
  it('returns null when nothing is persisted', () => {
    expect(loadProgress()).toBeNull();
  });

  it('round-trips state including Sets', () => {
    let s = createInitialProgress();
    s = courseReducer(s, { type: 'COMPLETE_MODULE', moduleId: 'module1' });
    s = courseReducer(s, { type: 'COMPLETE_MODULE', moduleId: 'module2' });
    s = courseReducer(s, { type: 'COMPLETE_REVIEW', reviewId: 'review1' });

    persistProgress(s);
    const loaded = loadProgress();
    expect(loaded).not.toBeNull();
    expect(loaded!.completedModules).toBeInstanceOf(Set);
    expect(loaded!.completedModules.has('module1')).toBe(true);
    expect(loaded!.completedModules.has('module2')).toBe(true);
    expect(loaded!.completedReviews.has('review1')).toBe(true);
  });

  it('clearPersistedProgress wipes storage', () => {
    persistProgress(createInitialProgress());
    clearPersistedProgress();
    expect(loadProgress()).toBeNull();
  });

  it('returns null on a version mismatch', () => {
    window.localStorage.setItem(
      'coso-cpe-course:progress',
      JSON.stringify({ version: 999, data: {} }),
    );
    expect(loadProgress()).toBeNull();
  });

  it('returns null on corrupted JSON', () => {
    window.localStorage.setItem('coso-cpe-course:progress', '{not-json');
    expect(loadProgress()).toBeNull();
  });
});
