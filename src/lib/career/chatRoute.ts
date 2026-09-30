/** Only explicit career-simulation launch requests are routed; other chat stays untouched. */
export function isCareerLaunchRequest(text:string):boolean {
  const trimmed=text.trim().toLowerCase();
  return /(?:start|launch|open|begin|put me in|give me|take me to)\s+(?:an?\s+|the\s+|my\s+)?(?:investment analyst|equity research|career lab|research case|analyst simulation)/i.test(trimmed) ||
    /(?:תפתח|פתח|תתחיל|התחל|תן לי|תני לי|שים אותי|שימי אותי|אני רוצה)\s+(?:את\s+|ב|במסלול\s+|סימולציה\s+של\s+|מקרה\s+של\s+)?(?:מעבדת קריירה|אנליסט השקעות|מחקר מניות|מקרה מחקר|סימולציה של אנליסט)/.test(trimmed);
}
