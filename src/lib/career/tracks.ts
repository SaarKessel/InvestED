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
  /** When false the case flow skips the allocation practice desk (a lending track has no portfolio allocation). */
  allocationDesk: boolean;
  /** Fixed invented teaching evidence for tracks without a live symbol. Always labeled invented in the UI; never market data. */
  inventedEvidence: {symbol: string; price: number; currency: string} | null;
}
export const CAREER_TRACKS: readonly CareerTrack[] = [
  {id:'investment-analyst',caseKey:'invested_career_analyst_v1',archiveKey:'invested_career_analyst_archive_v1',evidenceSymbol:'AAPL',contentKey:'career_track_analyst',available:true,allocationDesk:true,inventedEvidence:null},
  {id:'credit-analyst',caseKey:'invested_career_credit_v1',archiveKey:'invested_career_credit_archive_v1',evidenceSymbol:null,contentKey:'career_track_credit',available:true,allocationDesk:false,inventedEvidence:{symbol:'INVENTED-BORROWER-01',price:8.4,currency:'USD'}},
  {id:'pension-analyst',caseKey:'invested_career_pension_v1',archiveKey:'invested_career_pension_archive_v1',evidenceSymbol:null,contentKey:'career_track_pension',available:true,allocationDesk:false,inventedEvidence:{symbol:'INVENTED-POLICY-01',price:4.9,currency:'USD'}},
] as const;
export const DEFAULT_TRACK = CAREER_TRACKS[0];
export const getTrack = (id: string | undefined): CareerTrack => CAREER_TRACKS.find(track => track.id === id) ?? DEFAULT_TRACK;
export const isTrackId = (value: unknown): value is string => typeof value === 'string' && CAREER_TRACKS.some(track => track.id === value);
