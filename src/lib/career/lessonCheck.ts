/** This local exercise checks choices, not professional knowledge or certification. */
export type ProvenanceChoice = 'withSource' | 'withoutSource' | 'noChoice';
export function checkProvenanceChoice(choice:ProvenanceChoice):'correct'|'incorrect'|'pending' {
  if (choice==='withSource') return 'correct';
  if (choice==='withoutSource') return 'incorrect';
  return 'pending';
}
