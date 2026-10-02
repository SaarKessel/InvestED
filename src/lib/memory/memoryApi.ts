import * as mem from "./userMemory";

export interface MemoryApi {
  getConsent: () => Promise<boolean>;
  setConsent: (enabled: boolean) => Promise<void>;
  exportMemory: () => Promise<mem.MemoryExport>;
  deleteAll: () => Promise<void>;
  /** Stores a note; false when consent is off. */
  remember: (value: string) => Promise<boolean>;
  /** Quiz ids answered wrong earlier; empty when consent is off. */
  missedQuiz: () => Promise<string[]>;
  /** Records a missed quiz id; false when consent is off. */
  noteMissedQuiz: (id: string) => Promise<boolean>;
  clearMissedQuiz: (id: string) => Promise<void>;
}
export function defaultMemoryApi(userId: string): MemoryApi {
  return {
    getConsent: () => mem.getConsent(),
    setConsent: (e) => mem.setConsent(e, userId),
    exportMemory: () => mem.exportMemory(),
    deleteAll: () => mem.deleteAllMemory(userId),
    remember: (value) => mem.remember("note", `n${Date.now().toString(36)}`, value, userId, "chat"),
    missedQuiz: () => mem.missedQuizIds(),
    noteMissedQuiz: (id) => mem.remember("quiz_missed", id, { at: new Date().toISOString() }, userId, "exam"),
    clearMissedQuiz: (id) => mem.clearMissedQuiz(id),
  };
}
