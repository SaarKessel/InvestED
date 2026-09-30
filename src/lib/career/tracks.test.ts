// @vitest-environment jsdom
import {describe,it,expect} from 'vitest';
import {CAREER_TRACKS,DEFAULT_TRACK,getTrack,isTrackId} from './tracks';
import {CASE_KEY,CASE_ARCHIVE_KEY,isResearchCase,newCase,readCase,saveCase,archiveCompletedCase,readCaseArchive} from './engine';
describe('career track registry',()=>{
  it('keeps the Investment Analyst on its original storage keys and live evidence symbol',()=>{
    const analyst=getTrack('investment-analyst');
    expect(analyst.caseKey).toBe(CASE_KEY);
    expect(analyst.archiveKey).toBe(CASE_ARCHIVE_KEY);
    expect(analyst.evidenceSymbol).toBe('AAPL');
    expect(analyst.available).toBe(true);
    expect(DEFAULT_TRACK.id).toBe('investment-analyst');
  });
  it('registers the credit analyst track locked with its own keys and no live symbol',()=>{
    const credit=getTrack('credit-analyst');
    expect(credit.available).toBe(false);
    expect(credit.evidenceSymbol).toBeNull();
    expect(credit.caseKey).not.toBe(CASE_KEY);
    expect(isTrackId('credit-analyst')).toBe(true);
    expect(isTrackId('unknown-track')).toBe(false);
    expect(getTrack('unknown-track').id).toBe('investment-analyst');
    expect(getTrack(undefined).id).toBe('investment-analyst');
    expect(CAREER_TRACKS.map(t=>t.id)).toEqual(['investment-analyst','credit-analyst']);
  });
  it('keeps legacy analyst records without a track field readable and separates track storage',()=>{
    const legacy=newCase(new Date('2026-09-29T12:00:00Z'));
    delete (legacy as Partial<typeof legacy>).track;
    expect(isResearchCase(legacy)).toBe(true);
    localStorage.removeItem(CASE_KEY);
    saveCase(legacy,null);
    expect(readCase()).toEqual(legacy);
    expect(readCase('investment-analyst')).toEqual(legacy);
    // A different track has independent storage and never sees the analyst draft.
    expect(readCase('credit-analyst')).toBeNull();
    localStorage.removeItem(CASE_KEY);
  });
  it('rejects records with an unregistered track and archives per track',()=>{
    expect(isResearchCase({...newCase(),track:'unknown-track'})).toBe(false);
    expect(newCase().track).toBe('investment-analyst');
    expect(()=>archiveCompletedCase(newCase())).toThrow();
    expect(readCaseArchive('credit-analyst')).toEqual([]);
  });
});
