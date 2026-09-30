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
