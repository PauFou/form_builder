import { OfflineStore } from '../store';
import type { FormState, FormData } from '../types';
import { mockIndexedDB } from './test-utils';

describe('OfflineStore', () => {
  beforeEach(() => {
    // Create a new IndexedDB instance for each test
    mockIndexedDB();
  });

  it('should save and retrieve state', async () => {
    const store = new OfflineStore();
    const formId = 'test-form-1';
    const respondentKey = 'test-user';
    
    const state: FormState = {
      currentStep: 2,
      values: { name: 'John', email: 'john@example.com' },
      errors: {},
      touched: { name: true },
      isSubmitting: false,
      isComplete: false,
    };
    
    const data: Partial<FormData> = {
      formId,
      values: state.values,
      startedAt: new Date().toISOString(),
    };

    await store.saveState(formId, respondentKey, state, data);
    
    const retrieved = await store.getState(formId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.state.currentStep).toBe(2);
    expect(retrieved?.state.values.name).toBe('John');
  });

  it('should delete state', async () => {
    const store = new OfflineStore();
    const formId = 'delete-test-2';
    
    await store.saveState(formId, 'user', {} as any, {} as any);
    
    let retrieved = await store.getState(formId);
    expect(retrieved).not.toBeNull();
    
    await store.deleteState(formId);
    
    retrieved = await store.getState(formId);
    expect(retrieved).toBeNull();
  });

  it('should get all pending submissions', async () => {
    const store = new OfflineStore();
    
    // Save completed submission
    await store.saveState('form1-pending', 'user1', {} as any, {
      formId: 'form1-pending',
      values: {},
      startedAt: '',
      completedAt: new Date().toISOString(),
    });
    
    // Save pending submissions
    await store.saveState('form2-pending', 'user2', {} as any, {
      formId: 'form2-pending',
      values: {},
      startedAt: '',
    });
    
    await store.saveState('form3-pending', 'user3', {} as any, {
      formId: 'form3-pending',
      values: {},
      startedAt: '',
    });
    
    const pending = await store.getAllPending();
    expect(pending).toHaveLength(2);
    expect(pending.map(p => p.formId).sort()).toEqual(['form2-pending', 'form3-pending']);
  });
});