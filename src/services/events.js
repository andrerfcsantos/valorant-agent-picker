export function sendEvent(category, action, value) {
  if (window._paq && !Array.isArray(window._paq) && window._paq.push) {
    window._paq.push(["trackEvent", category, action, value]);
  }
  if (typeof window.gtag === "function") {
    window.gtag("event", action, {
      event_category: category,
      event_label: `${action} - ${value}`,
      value: value,
    });
  }
}
