/** Career Lab track registry. Every track reuses the same 7-stage engine and its contracts; only content, storage keys and evidence rules differ. */
export interface CareerTrack {
  id: string;
  /** localStorage key for the active case. The analyst keeps its original key so existing saves stay readable. */
  caseKey: string;
  /** localStorage key for the bounded completed-case archive. */
  archiveKey: string;
  /** Live evidence symbol fetched read-only, or null for explicitly invented fixed teaching evidence. */
  evidenceSymbol: string | null;
  /** Locale key prefix for track title and role label. */
  contentKey: string;
  /** Locked tracks render in the picker as in-preparation and cannot be opened. */
  available: boolean;
}
export const CAREER_TRACKS: readonly CareerTrack[] = [
  {id:'investment-analyst',caseKey:'invested_career_analyst_v1',archiveKey:'invested_career_analyst_archive_v1',evidenceSymbol:'AAPL',contentKey:'career_track_analyst',available:true},
  {id:'credit-analyst',caseKey:'invested_career_credit_v1',archiveKey:'invested_career_credit_archive_v1',evidenceSymbol:null,contentKey:'career_track_credit',available:false},
] as const;
export const DEFAULT_TRACK = CAREER_TRACKS[0];
export const getTrack = (id: string | undefined): CareerTrack => CAREER_TRACKS.find(track => track.id === id) ?? DEFAULT_TRACK;
export const isTrackId = (value: unknown): value is string => typeof value === 'string' && CAREER_TRACKS.some(track => track.id === value);
