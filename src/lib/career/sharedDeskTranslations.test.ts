import {describe,expect,it} from 'vitest';
import en from '@/locales/en.json';
import he from '@/locales/he.json';
import {COMMITTEE_CASES,COMMITTEE_NUMBERS} from './committeeCases';
import {OPERATIONS,OPERATION_EVIDENCE_NUMBERS,REQUIRED_EVIDENCE} from './operationsGame';
describe('shared desk bilingual content',()=>{
 for(const [language,locale] of Object.entries({en,he})){
  const dictionary=locale as Record<string,string>;
  const present=(key:string)=>{expect(dictionary[key],`${language}: ${key}`).toBeTruthy();expect(dictionary[key]).not.toBe(key);};
  it(`${language} covers all committee facts, reasons, numerical cards and controls`,()=>{
   for(const role of ['investment','research','reporting'] as const){present(`committee_role_${role}`);for(const row of COMMITTEE_CASES[role]){present(`committee_case_${row.id}`);present(`committee_facts_${row.facts}`);present(`committee_reason_${row.reason}`);expect(COMMITTEE_NUMBERS[row.id].length).toBeGreaterThan(0);for(const point of COMMITTEE_NUMBERS[row.id]){present(`committee_number_${point.label}`);present(`committee_unit_${point.unit}`);expect(Number.isFinite(point.value)).toBe(true);}}}
   for(const suffix of ['select_case','approve','review','defer','correct','retry','conflict','save_error','load_latest'])present(`committee_${suffix}`);
  });
  it(`${language} covers instrument-specific operations evidence and packet cards`,()=>{
   for(const row of OPERATIONS){present(`ops_kind_${row.kind}`);present(`ops_nav_${row.nav}`);present(`ops_reason_${row.reason}`);present(`ops_evidence_${REQUIRED_EVIDENCE[row.id]}`);present(`ops_support_${row.reason}`);present(`ops_resolution_${row.reason}`);for(const point of OPERATION_EVIDENCE_NUMBERS[row.id]??[]){present(`ops_packet_${point.label}`);expect(Number.isFinite(point.value)).toBe(true);}}
   for(const suffix of ['load_latest','conflict','save_error','legacy_closed','packet_numbers','resolution_note'])present(`ops_${suffix}`);
  });
 }
});
