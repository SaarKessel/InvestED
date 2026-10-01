import * as mem from "./userMemory";

export interface MemoryApi {
  getConsent: () => Promise<boolean>;
  setConsent: (enabled: boolean) => Promise<void>;
  exportMemory: () => Promise<mem.MemoryExport>;
  deleteAll: () => Promise<void>;
}
export function defaultMemoryApi(userId: string): MemoryApi {
  return {
    getConsent: () => mem.getConsent(),
    setConsent: (e) => mem.setConsent(e, userId),
    exportMemory: () => mem.exportMemory(),
    deleteAll: () => mem.deleteAllMemory(userId),
  };
}
