import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { useAuth } from "@/context/useAuth";

/** Sign-up / sign-in card shown in place of the composer until the user is signed in. */
export function ChatAuthGate() {
  const { t } = useLanguage();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMessage(null);
    const result = mode === "in" ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setBusy(false);
    if (result === "confirm_email") setMessage(t("auth_confirm_email"));
    else if (result) setMessage(/invalid login/i.test(result) ? t("auth_invalid") : /already/i.test(result) ? t("auth_exists") : /password/i.test(result) ? t("auth_weak_password") : t("auth_error"));
  }
  const field = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary";
  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-sm space-y-3 rounded-3xl border border-border bg-card p-5 shadow-lg shadow-primary/5">
      <p className="text-center text-sm font-semibold">{t(mode === "in" ? "auth_title_in" : "auth_title_up")}</p>
      <label className="block text-xs text-muted-foreground">{t("auth_email")}
        <input type="email" required autoComplete="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className={`${field} mt-1`} />
      </label>
      <label className="block text-xs text-muted-foreground">{t("auth_password")}
        <input type="password" required minLength={8} autoComplete={mode === "in" ? "current-password" : "new-password"} dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} className={`${field} mt-1`} />
      </label>
      {message && <p role="alert" className="text-xs text-destructive">{message}</p>}
      <button type="submit" disabled={busy} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{t(mode === "in" ? "auth_submit_in" : "auth_submit_up")}</button>
      <button type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMessage(null); }} className="w-full text-center text-xs font-semibold text-primary hover:underline">{t(mode === "in" ? "auth_switch_up" : "auth_switch_in")}</button>
      <p className="text-center text-[11px] text-muted-foreground">{t("auth_why")}</p>
    </form>
  );
}
