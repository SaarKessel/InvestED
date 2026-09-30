import {describe,it,expect} from 'vitest';
import {checkProvenanceChoice} from './lessonCheck';
describe('local evidence-choice exercise',()=>{
  it('does not accept a bare fictional price as sourced evidence',()=>{
    expect(checkProvenanceChoice('withoutSource')).toBe('incorrect');
    expect(checkProvenanceChoice('withSource')).toBe('correct');
    expect(checkProvenanceChoice('noChoice')).toBe('pending');
  });
});
