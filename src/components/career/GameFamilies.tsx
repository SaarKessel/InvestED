import {Link} from 'react-router-dom';
import {useLanguage} from '@/context/languageContext';
const families=[{id:'investment',path:'/career-lab/portfolio-game'},{id:'research',path:'/career-lab/analyst-game'},{id:'reporting',path:'/career-lab/accountant-game'},{id:'operations',path:'/career-lab/operations-game'}] as const;
/** One entry per shared workflow. Role labels do not imply professional qualification. */
export function GameFamilies(){
 const {t}=useLanguage();
 return <section aria-label={t('families_title')} className="space-y-3"><h2 className="text-xl font-semibold">{t('families_title')}</h2><p className="text-sm text-muted-foreground">{t('families_note')}</p><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{families.map(family=><Link key={family.id} to={family.path} className="rounded-xl border border-border bg-card p-4 hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><h3 className="font-semibold">{t(`families_${family.id}`)}</h3><p className="mt-2 text-sm">{t(`families_${family.id}_roles`)}</p><p className="mt-3 text-xs text-muted-foreground">{t(`families_${family.id}_task`)}</p><span className="mt-4 block text-sm font-semibold text-primary">{t('families_enter')} →</span></Link>)}</div></section>;
}
