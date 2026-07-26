const CLOSED_STATUSES = new Set(["resolved", "rejected", "archived"]);

export function isActiveReport(status: string): boolean {
  return !CLOSED_STATUSES.has(status.toLowerCase());
}

export function isClosedReport(status: string): boolean {
  return CLOSED_STATUSES.has(status.toLowerCase());
}

export function requiresOfficerAction(status: string): boolean {
  const s = status.toLowerCase();
  return s === "submitted" || s === "under_review";
}
