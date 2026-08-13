import { describe, expect, it, beforeEach } from "vitest";

/** @vitest-environment jsdom */

import {
  getDashboardOnboardingSeen,
  setDashboardOnboardingSeen,
} from "./dashboardOnboarding";

describe("dashboard onboarding state", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to not seen for a new user", () => {
    expect(getDashboardOnboardingSeen()).toBe(false);
  });

  it("persists the dismissal choice", () => {
    setDashboardOnboardingSeen(true);
    expect(getDashboardOnboardingSeen()).toBe(true);
  });
});
