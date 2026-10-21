import { describe, expect, it } from "vitest";
import { acceptRephrase } from "./provider";
import type { CopilotResponse } from "../copilotResponse";

const response = { text: "No number here.", intent: "explain" } as unknown as CopilotResponse;

describe("acceptRephrase with server-tool facts", () => {
  it("rejects rephrase numbers absent from all sources", () => {
    expect(acceptRephrase("It costs 612.5 today.", "q", response)).toBeNull();
  });
  it("accepts numbers backed by server-tool facts", () => {
    expect(acceptRephrase("It costs 612.5 today.", "q", response, ["quote VOO: {\"price\": 612.5}"])).toBe("It costs 612.5 today.");
  });
});
