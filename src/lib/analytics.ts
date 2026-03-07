declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function sendEvent(category: string, action: string, value: string) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", action, {
      event_category: category,
      event_label: `${action} - ${value}`,
      value: value,
    });
  }
}
