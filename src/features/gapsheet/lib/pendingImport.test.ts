import { describe, expect, it } from "vitest";
import { stashGapSheetImport, takeGapSheetImport } from "./pendingImport";

describe("GapSheet pending import handoff", () => {
  it("delivers a stashed file exactly once", () => {
    const file = new File(["a,b\n1,2\n"], "data.csv", { type: "text/csv" });
    stashGapSheetImport(file);
    expect(takeGapSheetImport()?.name).toBe("data.csv");
    expect(takeGapSheetImport()).toBeNull();
  });

  it("keeps only the latest stash", () => {
    stashGapSheetImport(new File(["x"], "first.csv", { type: "text/csv" }));
    stashGapSheetImport(new File(["y"], "second.csv", { type: "text/csv" }));
    expect(takeGapSheetImport()?.name).toBe("second.csv");
    expect(takeGapSheetImport()).toBeNull();
  });
});
