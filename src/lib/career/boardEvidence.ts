/** Fixed evidence exercises. No AI assessment or independent skill verification. */
export const BOARD_EVIDENCE={
  analyst:{valid:['growth','dividend','limits'],invalid:['guarantee']},
  accountant:{valid:['liquidity','funding','limits'],invalid:['solvent']},
} as const;
export type EvidenceRole=keyof typeof BOARD_EVIDENCE;
export const evidenceOptions=(role:EvidenceRole):readonly string[]=>[...BOARD_EVIDENCE[role].valid,...BOARD_EVIDENCE[role].invalid];
export function isEvidenceSelection(role:EvidenceRole,value:unknown):value is string[]{
  return Array.isArray(value)&&value.every(item=>typeof item==='string'&&evidenceOptions(role).includes(item))&&new Set(value).size===value.length;
}
export function readyBoardEvidence(role:EvidenceRole,selected:string[]):boolean{
  const valid:readonly string[]=BOARD_EVIDENCE[role].valid;
  return isEvidenceSelection(role,selected)&&selected.length>=2&&selected.includes('limits')&&selected.every(item=>valid.includes(item));
}
export const BOARD_FOLLOWUP={
  analyst:{options:['newEvidence','nothing','priceUp'],correct:'newEvidence'},
  accountant:{options:['futureSolvency','noFailure','audit'],correct:'futureSolvency'},
} as const;
export const followupOptions=(role:EvidenceRole):readonly string[]=>BOARD_FOLLOWUP[role].options;
export function isFollowupChoice(role:EvidenceRole,value:unknown):value is string{
  return typeof value==='string'&&(value==='none'||(followupOptions(role) as readonly string[]).includes(value));
}
/** Only the answer bounded by the supplied invented evidence is supported. */
export function readyFollowup(role:EvidenceRole,value:unknown):boolean{
  return value===BOARD_FOLLOWUP[role].correct;
}
