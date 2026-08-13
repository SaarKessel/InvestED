const DASHBOARD_ONBOARDING_KEY = "invested_dashboard_onboarding_seen";

export function getDashboardOnboardingSeen(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(DASHBOARD_ONBOARDING_KEY) === "true";
}

export function setDashboardOnboardingSeen(seen: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DASHBOARD_ONBOARDING_KEY, String(seen));
}
