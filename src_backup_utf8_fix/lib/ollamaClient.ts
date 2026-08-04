// ---------------------------------------------------------------------------
// InvestED ג€” Ollama Client (Local LLM, No Cloud Dependency)
//
// ׳©׳›׳‘׳× ׳”׳ ׳™׳¡׳•׳—: ׳”׳׳¡׳₪׳¨׳™׳ (׳¦׳™׳•׳ ׳¡׳™׳›׳•׳, ׳”׳§׳¦׳׳”) ׳×׳׳™׳“ ׳׳’׳™׳¢׳™׳ ׳׳”׳׳ ׳•׳¢ ׳׳‘׳•׳¡׳¡
// ׳”׳›׳׳׳™׳. Ollama, ׳׳ ׳”׳•׳ ׳¨׳¥ ׳׳§׳•׳׳™׳×, ׳¨׳§ ׳׳•׳¡׳™׳£ ׳ ׳™׳¡׳•׳— ׳—׳ ׳•׳׳™׳©׳™ ׳™׳•׳×׳¨ ׳׳¢׳
// ׳”׳׳¡׳₪׳¨׳™׳ ׳”׳׳׳”. ׳׳ ׳”׳©׳¨׳× ׳׳ ׳–׳׳™׳ ג€” ׳›׳ ׳”׳§׳¨׳™׳׳•׳× ׳ ׳•׳₪׳׳•׳× ׳‘׳—׳–׳¨׳” ׳׳˜׳§׳¡׳˜
// ׳׳‘׳•׳¡׳¡-׳›׳׳׳™׳, ׳•׳”׳׳₪׳׳™׳§׳¦׳™׳” ׳׳׳©׳™׳›׳” ׳׳¢׳‘׳•׳“ ׳‘׳׳׳•׳׳”.
//
// ׳›׳“׳™ ׳׳”׳₪׳¢׳™׳:
//   ollama pull llama3.1
//   ollama serve
// (׳™׳© ׳׳•׳•׳“׳ ׳©-Ollama ׳׳׳₪׳©׳¨ CORS ׳׳§׳•׳׳™: OLLAMA_ORIGINS=* ollama serve)
// ---------------------------------------------------------------------------

const OLLAMA_HOST = "http://localhost:11434";
const DEFAULT_MODEL = "llama3.1";
const REQUEST_TIMEOUT_MS = 12000;

const SYSTEM_PROMPT = [
  "׳׳×׳” ׳׳•׳¨׳” ׳₪׳™׳ ׳ ׳¡׳™ ׳¡׳‘׳׳ ׳™ ׳•׳׳¢׳•׳“׳“, ׳”׳׳•׳˜׳׳¢ ׳‘׳₪׳׳˜׳₪׳•׳¨׳׳” ׳—׳™׳ ׳•׳›׳™׳× ׳׳”׳©׳§׳¢׳•׳× ׳‘׳©׳ InvestED.",
  "׳׳×׳” ׳׳¢׳•׳׳ ׳׳ ׳ ׳•׳×׳ ׳™׳™׳¢׳•׳¥ ׳”׳©׳§׳¢׳•׳× ׳׳™׳©׳™, ׳•׳׳¢׳•׳׳ ׳׳ ׳׳•׳׳¨ ׳׳׳©׳×׳׳© ׳׳§׳ ׳•׳× ׳׳• ׳׳׳›׳•׳¨ ׳ ׳›׳¡ ׳¡׳₪׳¦׳™׳₪׳™.",
  "׳׳×׳” ׳׳¡׳‘׳™׳¨ ׳׳•׳©׳’׳™׳ ׳‘׳©׳₪׳” ׳₪׳©׳•׳˜׳” ׳•׳‘׳¨׳•׳¨׳”, ׳‘-2-4 ׳׳©׳₪׳˜׳™׳ ׳§׳¦׳¨׳™׳, ׳×׳׳™׳“ ׳‘׳¢׳‘׳¨׳™׳×.",
  "׳”׳˜׳•׳ ׳©׳׳ ׳—׳™׳ ׳•׳›׳™, ׳׳ ׳׳ ׳—׳” ׳•׳׳ ׳׳›׳×׳™׳‘.",
].join(" ");

async function callOllama(prompt: string, model: string = DEFAULT_MODEL): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: `${SYSTEM_PROMPT}\n\n${prompt}`,
        stream: false,
        options: { temperature: 0.6 },
      }),
      signal: controller.signal,
    });

    if (!response.ok) return null;
    const data = await response.json();
    const text = (data?.response ?? "").trim();
    return text || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export async function explainInvestorProfile(
  investorType: string,
  riskScore: number,
  baseReason: string,
  rawText: string
): Promise<string> {
  const prompt = [
    `׳”׳׳©׳×׳׳© ׳×׳™׳׳¨ ׳׳× ׳”׳¢׳“׳₪׳•׳× ׳”׳”׳©׳§׳¢׳” ׳©׳׳• ׳›׳: "${rawText}"`,
    `׳׳₪׳™ ׳ ׳™׳×׳•׳— ׳׳‘׳•׳¡׳¡ ׳›׳׳׳™׳, ׳”׳•׳ ׳¡׳•׳•׳’ ׳›"${investorType}" ׳¢׳ ׳¦׳™׳•׳ ׳¡׳™׳›׳•׳ ${riskScore}/10.`,
    `׳”׳ ׳™׳׳•׳§ ׳”׳‘׳¡׳™׳¡׳™ ׳”׳™׳”: ${baseReason}`,
    "׳‘׳©׳׳•׳© ׳¢׳“ ׳׳¨׳‘׳¢׳” ׳׳©׳₪׳˜׳™׳ ׳§׳¦׳¨׳™׳ ׳•׳׳¢׳•׳“׳“׳™׳, ׳₪׳ ׳” ׳׳׳©׳×׳׳© ׳‘׳’׳•׳£ ׳©׳ ׳™ ('׳׳×׳”') ׳•׳”׳¡׳‘׳¨ ׳׳׳” ׳”׳₪׳¨׳•׳₪׳™׳ ׳”׳—׳™׳ ׳•׳›׳™ ׳”׳–׳” ׳׳×׳׳™׳ ׳׳׳” ׳©׳”׳•׳ ׳×׳™׳׳¨, ׳×׳•׳ ׳”׳×׳™׳™׳—׳¡׳•׳× ׳׳“׳‘׳¨׳™׳ ׳¡׳₪׳¦׳™׳₪׳™׳™׳ ׳©׳”׳•׳ ׳›׳×׳‘. ׳׳ ׳×׳׳׳™׳¥ ׳¢׳ ׳ ׳›׳¡׳™׳ ׳¡׳₪׳¦׳™׳₪׳™׳™׳.",
  ].join("\n");

  const result = await callOllama(prompt);
  return result ?? baseReason;
}

export async function explainPortfolio(
  investorType: string,
  allocationSummary: string,
  fallback: string
): Promise<string> {
  const prompt = [
    `׳¢׳‘׳•׳¨ ׳₪׳¨׳•׳₪׳™׳ ׳—׳™׳ ׳•׳›׳™ ׳׳¡׳•׳’ "${investorType}", ׳”׳”׳§׳¦׳׳” ׳”׳”׳™׳₪׳•׳×׳˜׳™׳× ׳׳“׳•׳’׳׳” ׳”׳™׳: ${allocationSummary}.`,
    "׳‘׳©׳׳•׳©׳” ׳¢׳“ ׳׳¨׳‘׳¢׳” ׳׳©׳₪׳˜׳™׳ ׳§׳¦׳¨׳™׳, ׳”׳¡׳‘׳¨ ׳׳׳” ׳¦׳•׳¨׳× ׳”׳”׳§׳¦׳׳” ׳”׳–׳• ׳”׳’׳™׳•׳ ׳™׳× ׳¢׳‘׳•׳¨ ׳”׳₪׳¨׳•׳₪׳™׳ ׳”׳–׳” (׳׳” ׳”׳×׳₪׳§׳™׳“ ׳©׳ ׳›׳ ׳¨׳›׳™׳‘ ׳¢׳™׳§׳¨׳™), ׳›׳“׳•׳’׳׳” ׳—׳™׳ ׳•׳›׳™׳× ׳‘׳׳‘׳“. ׳׳ ׳×׳–׳›׳™׳¨ ׳©׳׳•׳× ׳©׳ ׳ ׳›׳¡׳™׳ ׳¡׳₪׳¦׳™׳₪׳™׳™׳ ׳׳• ׳˜׳™׳§׳¨׳™׳.",
  ].join("\n");

  const result = await callOllama(prompt);
  return result ?? fallback;
}

