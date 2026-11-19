export const HEALTH_ISSUE_CATALOG_CHANGED_EVENT = "health-issue-catalog-changed";

export function notifyHealthIssueCatalogChanged() {
  window.dispatchEvent(new Event(HEALTH_ISSUE_CATALOG_CHANGED_EVENT));
}

export function subscribeToHealthIssueCatalogChanges(callback: () => void) {
  window.addEventListener(HEALTH_ISSUE_CATALOG_CHANGED_EVENT, callback);
  return () => window.removeEventListener(HEALTH_ISSUE_CATALOG_CHANGED_EVENT, callback);
}
