export function sendEvent(category, action, value) {
  if (typeof window.gtag === "function") {
    window.gtag("event", action, {
      event_category: category,
      event_label: `${action} - ${value}`,
      value: value,
    });
  }
}
