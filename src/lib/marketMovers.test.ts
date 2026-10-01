import { describe, expect, it } from "vitest";

import { isExtremeMove } from "./marketMovers";
describe("isExtremeMove", () => { it("flags 40% and over in either direction, not normal moves or missing data", () => { expect(isExtremeMove(-84.15)).toBe(true); expect(isExtremeMove(40)).toBe(true); expect(isExtremeMove(18.3)).toBe(false); expect(isExtremeMove(null)).toBe(false); }); });
