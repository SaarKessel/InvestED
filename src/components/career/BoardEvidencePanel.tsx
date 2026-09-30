import {useLanguage} from '@/context/languageContext';
import {BOARD_EVIDENCE,evidenceOptions,readyBoardEvidence,type EvidenceRole} from '@/lib/career/boardEvidence';

export function BoardEvidencePanel({role,selected,disabled,onChange}:{role:EvidenceRole;selected:string[];disabled:boolean;onChange:(value:string[])=>void}){
  const {t}=useLanguage();
  const invalid:readonly string[]=BOARD_EVIDENCE[role].invalid;
  return <fieldset className="rounded-xl border border-teal-500/40 bg-[#07101f] p-4 space-y-3"><legend className="px-2 font-semibold">{t('board_evidence_title')}</legend><p className="text-sm">{t(`board_${role}_question`)}</p><p className="text-xs">{t('board_evidence_instruction')}</p><div className="grid gap-2 md:grid-cols-2 xl:grid-cols-1">{evidenceOptions(role).map(id=><button key={id} type="button" disabled={disabled} aria-pressed={selected.includes(id)} onClick={()=>onChange(selected.includes(id)?selected.filter(item=>item!==id):[...selected,id])} className={`rounded-lg border p-3 text-start text-sm disabled:opacity-70 ${selected.includes(id)?'border-teal-300 bg-teal-300/10':'border-slate-600'}`}>{t(`board_${role}_${id}`)}</button>)}</div>{selected.length>0&&<p role="status" className="text-sm">{t(selected.some(id=>invalid.includes(id))?`board_${role}_correction`:readyBoardEvidence(role,selected)?'board_evidence_ready':'board_evidence_more')}</p>}</fieldset>;
}
