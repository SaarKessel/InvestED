// ---------------------------------------------------------------------------
// InvestED - suspicious-link sandbox
//
// A text-only reading of a link. It takes the string apart with the standard URL
// parser and lists things worth noticing. It NEVER opens, fetches, resolves or
// looks up a link, NEVER says a link is safe, and NEVER gives a fraud score.
// An empty list of notices means "nothing odd in the text", not "safe".
//
// Concept credit: the Fraud_detection_using_ML project (license not verified, so
// nothing was copied). Only the general idea of teaching what makes a link look
// suspicious was used. No model, dataset or code.
// ---------------------------------------------------------------------------
import { bi, type Bi } from "./bilingual";

export type NoticeId =
  | "userinfo" | "ip-host" | "ip-obfuscated" | "punycode" | "non-ascii" | "mixed-script" | "lookalike-chars"
  | "deep-subdomains" | "domain-in-subdomain" | "keyword-subdomain" | "many-hyphens" | "no-https" | "port"
  | "shortener" | "encoded" | "long" | "domain-in-path";

export interface Notice { id: NoticeId; text: Bi }
export interface Segment { kind: "scheme" | "userinfo" | "host" | "port" | "rest"; text: string }
export interface OddChar { char: string; codepoint: string; script: string }

export interface LinkReading {
  input: string;
  /** False when the text cannot be read as a web address at all. */
  readable: boolean;
  schemeAdded: boolean;
  scheme: string;
  /** The host the browser would contact, exactly as the standard parser reads it. */
  host: string;
  hostKind: "name" | "ipv4" | "ipv6";
  /** Best guess at the part of the host a person registered. Heuristic, not the Public Suffix List. */
  registrable: string;
  subdomain: string;
  userinfo: string | null;
  port: string | null;
  path: string;
  oddChars: OddChar[];
  segments: Segment[];
  notices: Notice[];
}

export const MAX_LINK_CHARS = 300;
const MULTI_SUFFIX = new Set(["co.il", "org.il", "ac.il", "gov.il", "net.il", "co.uk", "org.uk", "ac.uk", "gov.uk", "com.au", "co.jp", "com.br", "co.in", "co.nz", "com.mx"]);
const SHORTENERS = new Set(["bit.ly", "t.co", "tinyurl.com", "goo.gl", "is.gd", "ow.ly", "cutt.ly", "rb.gy", "buff.ly"]);
const SUSPECT_WORDS = ["login", "signin", "secure", "verify", "account", "update", "support", "wallet", "confirm", "alert"];
const DOMAIN_PARTS = new Set(["com", "net", "org", "co", "gov", "edu", "bank"]);

function scriptOf(ch: string): string {
  if (/\p{Script=Cyrillic}/u.test(ch)) return "Cyrillic";
  if (/\p{Script=Greek}/u.test(ch)) return "Greek";
  if (/\p{Script=Hebrew}/u.test(ch)) return "Hebrew";
  if (/\p{Script=Arabic}/u.test(ch)) return "Arabic";
  if (/\p{Script=Han}/u.test(ch)) return "Han";
  if (/\p{Script=Latin}/u.test(ch)) return "Latin (accented)";
  return "Other";
}

/** Raw text of the host part, before any normalization by the URL parser. */
function rawAuthority(input: string): { scheme: string; userinfo: string | null; host: string; port: string | null; rest: string } | null {
  const m = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)(.*)$/i.exec(input);
  if (!m) return null;
  const auth = m[2];
  const at = auth.lastIndexOf("@");
  const userinfo = at >= 0 ? auth.slice(0, at) : null;
  let hostport = at >= 0 ? auth.slice(at + 1) : auth;
  let port: string | null = null;
  const pm = /^(.*?):(\d*)$/.exec(hostport);
  if (pm && !hostport.startsWith("[")) { hostport = pm[1]; port = pm[2]; }
  return { scheme: m[1].toLowerCase(), userinfo, host: hostport, port, rest: m[3] };
}

export function registrableOf(host: string): { registrable: string; subdomain: string } {
  const labels = host.split(".").filter(Boolean);
  if (labels.length <= 2) return { registrable: labels.join("."), subdomain: "" };
  const lastTwo = labels.slice(-2).join(".");
  const take = MULTI_SUFFIX.has(lastTwo) ? 3 : 2;
  return { registrable: labels.slice(-take).join("."), subdomain: labels.slice(0, -take).join(".") };
}

export function readLink(rawInput: string): LinkReading {
  const input = rawInput.trim().slice(0, MAX_LINK_CHARS);
  const empty: LinkReading = { input, readable: false, schemeAdded: false, scheme: "", host: "", hostKind: "name", registrable: "", subdomain: "", userinfo: null, port: null, path: "", oddChars: [], segments: [], notices: [] };
  if (!input || /\s/.test(input)) return empty;
  let text = input;
  let schemeAdded = false;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) { text = `http://${text}`; schemeAdded = true; }
  const raw = rawAuthority(text);
  let url: URL;
  try { url = new URL(text); } catch { return empty; }
  if (!raw || !url.hostname || !/^https?:$/.test(url.protocol)) return empty;

  const host = url.hostname.replace(/^\[|\]$/g, "");
  const hostKind: LinkReading["hostKind"] = url.hostname.startsWith("[") ? "ipv6" : /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ? "ipv4" : "name";
  const { registrable, subdomain } = hostKind === "name" ? registrableOf(host) : { registrable: host, subdomain: "" };
  const rawHost = raw.host;
  const oddChars: OddChar[] = [];
  for (const ch of rawHost) if (ch.charCodeAt(0) > 127) oddChars.push({ char: ch, codepoint: `U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`, script: scriptOf(ch) });
  const notices: Notice[] = [];
  const add = (id: NoticeId, text: Bi) => notices.push({ id, text });

  if (raw.userinfo !== null) add("userinfo", bi(`Everything before the "@" ("${raw.userinfo}") is only a label. The browser goes to the part after it: ${host}.`, `כל מה שלפני ה-"@" ("${raw.userinfo}") הוא רק תווית. הדפדפן הולך לחלק שאחריו: ${host}.`));
  if (hostKind !== "name") add("ip-host", bi("The address is a number, not a name. Real brokers almost never ask you to sign in at a bare number.", "הכתובת היא מספר ולא שם. ברוקרים אמיתיים כמעט אף פעם לא מבקשים להתחבר במספר חשוף."));
  if (hostKind === "ipv4" && rawHost !== host) add("ip-obfuscated", bi(`The number was written in a disguised form ("${rawHost}") and is read as ${host}.`, `המספר נכתב בצורה מוסווית ("${rawHost}") ונקרא כ-${host}.`));
  if (host.split(".").some((l) => l.startsWith("xn--"))) add("punycode", bi("Part of the host is stored in an encoded form (xn--). That is how non-English letters travel in addresses; check what they spell.", "חלק מהכתובת מאוחסן בקידוד (xn--). כך אותיות שאינן אנגליות עוברות בכתובות; בדקו מה הן מאייתות."));
  if (oddChars.length > 0) {
    add("non-ascii", bi(`The host has letters outside plain a-z: ${oddChars.map((c) => `${c.char} (${c.codepoint}, ${c.script})`).join(", ")}. Some can look identical to English letters.`, `בכתובת יש אותיות מחוץ ל-a-z רגיל: ${oddChars.map((c) => `${c.char} (${c.codepoint}, ${c.script})`).join(", ")}. חלקן נראות זהות לאותיות באנגלית.`));
    if (rawHost.split(".").some((l) => /[a-z]/i.test(l) && /[^\x20-\x7e]/.test(l) && oddChars.some((c) => l.includes(c.char) && c.script !== "Latin (accented)"))) add("mixed-script", bi("One word mixes English letters with letters from another alphabet. That is a common way to fake a familiar name.", "מילה אחת מערבבת אותיות באנגלית עם אותיות מאלפבית אחר. זו דרך נפוצה לזייף שם מוכר."));
  }
  if (hostKind === "name" && host.split(".").some((l) => /[a-z][01][a-z]/i.test(l) || /^[01][a-z]|[a-z][01]$/i.test(l.replace(/-/g, "")) && /[a-z]{3}/i.test(l))) add("lookalike-chars", bi("A digit sits among letters (like 0 for o or 1 for l). Read the name slowly, letter by letter.", "ספרה יושבת בין אותיות (כמו 0 במקום o או 1 במקום l). קראו את השם לאט, אות אחר אות."));
  const subLabels = subdomain ? subdomain.split(".") : [];
  if (subLabels.length >= 3) add("deep-subdomains", bi(`${subLabels.length} labels sit in front of the registered name (${registrable}). Only the right-most part decides who owns the site.`, `${subLabels.length} תוויות יושבות לפני השם הרשום (${registrable}). רק החלק הימני ביותר קובע של מי האתר.`));
  if (subLabels.some((l) => DOMAIN_PARTS.has(l))) add("domain-in-subdomain", bi(`A familiar ending like ".com" appears in the middle of the host. The real ending is at the very right: ${registrable}.`, `סיומת מוכרת כמו ".com" מופיעה באמצע הכתובת. הסיומת האמיתית היא בקצה הימני: ${registrable}.`));
  if (hostKind === "name" && SUSPECT_WORDS.some((w) => host.split(/[.-]/).includes(w))) add("keyword-subdomain", bi("Words like login, secure or verify appear in the host. Anyone can put those words in an address they own.", "מילים כמו login, secure או verify מופיעות בכתובת. כל אחד יכול לשים אותן בכתובת שבבעלותו."));
  if (!registrable.startsWith("xn--") && registrable.split(".")[0].split("-").length >= 3) add("many-hyphens", bi("The registered name has several hyphens, which is common in made-up lookalike names.", "בשם הרשום יש כמה מקפים, דבר נפוץ בשמות מזויפים."));
  if (raw.scheme === "http" || schemeAdded) add("no-https", bi("The link does not use https. Even https only means the connection is private, not that the site is honest.", "הקישור לא משתמש ב-https. וגם https אומר רק שהחיבור פרטי, לא שהאתר ישר."));
  if (raw.port && raw.port !== "" && raw.port !== "80" && raw.port !== "443") add("port", bi(`It names an unusual port (${raw.port}). Normal sign-in pages rarely need one.`, `מצוין פורט יוצא דופן (${raw.port}). דפי התחברות רגילים כמעט לא צריכים כזה.`));
  if (SHORTENERS.has(registrable)) add("shortener", bi("This is a link shortener. The real destination is hidden until you open it, so it cannot be read from the text.", "זה מקצר קישורים. היעד האמיתי מוסתר עד שפותחים, ולכן אי אפשר לקרוא אותו מהטקסט."));
  if (/%[0-9a-f]{2}/i.test(rawHost) || /%(?:2e|2f|40|3a)/i.test(url.pathname)) add("encoded", bi("The link hides characters behind % codes. Look at what they decode to.", "הקישור מסתיר תווים מאחורי קודי %. בדקו למה הם מתפענחים."));
  if (input.length > 100) add("long", bi("The link is very long. Long links can push the real host out of view on a phone.", "הקישור ארוך מאוד. קישורים ארוכים יכולים להוציא את הכתובת האמיתית מהמסך בטלפון."));
  if (/\/(?:[a-z0-9-]+\.)+(?:com|net|org|co|io|il)(?:\/|$)/i.test(url.pathname)) add("domain-in-path", bi("A web address appears after the first slash. Only what comes before the first slash decides where you land.", "כתובת אתר מופיעה אחרי הלוכסן הראשון. רק מה שלפני הלוכסן הראשון קובע לאן מגיעים."));

  const segments: Segment[] = [{ kind: "scheme", text: schemeAdded ? "" : `${raw.scheme}://` }];
  if (raw.userinfo !== null) segments.push({ kind: "userinfo", text: `${raw.userinfo}@` });
  segments.push({ kind: "host", text: rawHost });
  if (raw.port !== null) segments.push({ kind: "port", text: `:${raw.port}` });
  const rest = schemeAdded ? text.slice(`http://`.length + (raw.userinfo !== null ? raw.userinfo.length + 1 : 0) + rawHost.length + (raw.port !== null ? raw.port.length + 1 : 0)) : raw.rest;
  segments.push({ kind: "rest", text: rest });
  return { input, readable: true, schemeAdded, scheme: raw.scheme, host, hostKind, registrable, subdomain, userinfo: raw.userinfo, port: raw.port, path: url.pathname + url.search, oddChars, segments: segments.filter((s) => s.text !== ""), notices };
}

export const NO_NOTICES: Bi = bi(
  "Nothing odd stood out in the text of this link. That does not make it safe: a link can look clean and still lead somewhere harmful. This tool never opens links.",
  "שום דבר חריג לא בלט בטקסט של הקישור. זה לא אומר שהוא בטוח: קישור יכול להיראות נקי ובכל זאת להוביל למקום מזיק. הכלי הזה אף פעם לא פותח קישורים."
);
export const SANDBOX_NOTE: Bi = bi(
  "Text-only reading. The link is not opened, fetched or looked up anywhere. This is a practice tool, not a safety check, and it gives no safe or unsafe rating.",
  "קריאה של הטקסט בלבד. הקישור לא נפתח, לא נשלף ולא נבדק בשום מקום. זה כלי תרגול, לא בדיקת בטיחות, והוא לא נותן דירוג של בטוח או לא בטוח."
);
export const SYNTHETIC_NOTE: Bi = bi("Synthetic exercise. These addresses are made up and use reserved example names, so none points to a real site.", "תרגיל מלאכותי. הכתובות בדויות ומשתמשות בשמות שמורים לדוגמה, ולכן אף אחת לא מצביעה על אתר אמיתי.");

export interface LinkExercise { id: string; link: string; hint: Bi }
/** Made-up links on reserved example names. The Cyrillic "о" in the fourth one is deliberate. */
export const EXERCISES: LinkExercise[] = [
  { id: "subdomain", link: "https://login.mybroker.com.secure-check.example/session", hint: bi("Find the part that decides where you land.", "מצאו את החלק שקובע לאן מגיעים.") },
  { id: "ip", link: "http://192.0.2.45:8080/mybroker/login", hint: bi("Which part tells the browser where to go?", "איזה חלק אומר לדפדפן לאן ללכת?") },
  { id: "digit", link: "https://www.mybr0ker.example/account", hint: bi("Read the name slowly.", "קראו את השם לאט.") },
  { id: "script", link: "https://mybrоker.example/login", hint: bi("One letter is not what it seems.", "אות אחת היא לא מה שהיא נראית.") },
  { id: "userinfo", link: "https://mybroker.example@accounts-portal.example/verify", hint: bi("Which side of the @ does the browser use?", "באיזה צד של ה-@ הדפדפן משתמש?") },
];

export const CHECKLIST: { id: string; text: Bi }[] = [
  { id: "own-path", text: bi("I open the broker's app, or type or bookmark its address myself. I do not sign in from a link in a message or ad.", "אני פותח את האפליקציה של הברוקר, או מקליד או שומר את הכתובת בעצמי. אני לא מתחבר דרך קישור בהודעה או במודעה.") },
  { id: "read-host", text: bi("I read the real host (before the first single slash, after any @) and compare it letter by letter with the broker's known address.", "אני קורא את הכתובת האמיתית (לפני הלוכסן הבודד הראשון, אחרי @ אם יש) ומשווה אותה אות אחר אות לכתובת הידועה של הברוקר.") },
  { id: "https-not-proof", text: bi("I remember that the padlock or https only means a private connection, not an honest site.", "אני זוכר שמנעול או https אומרים רק חיבור פרטי, לא אתר ישר.") },
  { id: "pressure", text: bi("I treat urgency (\"account locked\", \"act now\") as a reason to slow down.", "אני מתייחס ללחץ (\"החשבון ננעל\", \"פעלו עכשיו\") כסיבה להאט.") },
  { id: "password-manager", text: bi("I use a password manager. It will not offer my login on a look-alike address.", "אני משתמש במנהל סיסמאות. הוא לא יציע את ההתחברות שלי בכתובת מתחזה.") },
  { id: "ask-known", text: bi("If unsure, I contact the broker through the app or phone number I already have, and I keep two-step verification on.", "אם אני לא בטוח, אני פונה לברוקר דרך האפליקציה או הטלפון שכבר יש לי, ומשאיר אימות דו-שלבי פעיל.") },
];
export const CHECKLIST_QUESTION: Bi = bi("What do you check before entering brokerage credentials?", "מה אתם בודקים לפני שמזינים פרטי כניסה לברוקר?");
