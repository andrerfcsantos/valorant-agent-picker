import { describe, expect, test, vi } from "vite-plus/test";

// A stand-in SDK, so the order of what reaches PostHog can be checked.
vi.mock("posthog-js/dist/module.slim", () => ({
  default: { init: vi.fn(), register: vi.fn(), capture: vi.fn() },
}));
vi.mock("posthog-js/dist/extension-bundles", () => ({
  AnalyticsExtensions: {},
  ErrorTrackingExtensions: {},
  SessionReplayExtensions: {},
}));

const { default: posthog } = await import("posthog-js/dist/module.slim");
const { beforeDesignChange, initAnalytics, registerDesign, track } =
  await import("./analytics");

describe("switching design with an event held back", () => {
  test("the event is sent before the new design is registered", () => {
    initAnalytics("test-token", "https://example.test");
    vi.mocked(posthog.register).mockClear();
    vi.mocked(posthog.capture).mockClear();

    // A squad filter edit, debounced, still waiting when the visitor switches.
    const unsubscribe = beforeDesignChange(() =>
      track("squad_slot_filters_changed", {
        action: "edit",
        slot_index: 0,
        disabled_count: 3,
      }),
    );
    registerDesign("refresh", "chosen");
    unsubscribe();

    const capture = vi.mocked(posthog.capture);
    const register = vi.mocked(posthog.register);
    expect(capture).toHaveBeenCalledWith("squad_slot_filters_changed", {
      action: "edit",
      slot_index: 0,
      disabled_count: 3,
    });
    expect(register).toHaveBeenCalledWith({
      design: "refresh",
      design_origin: "chosen",
    });
    // Sent while the old design was still the registered one.
    expect(capture.mock.invocationCallOrder[0]).toBeLessThan(
      register.mock.invocationCallOrder[0],
    );
  });
});
