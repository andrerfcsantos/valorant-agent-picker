import { describe, expect, test, vi } from "vite-plus/test";
import type { CaptureResult } from "posthog-js/dist/module.slim";

import { getAllAgents } from "@/data/agents";
import {
  agentPoolProps,
  builtinId,
  createSampler,
  beforeDesignChange,
  designForChoice,
  isStacklessThirdPartyException,
  presetKind,
  redactUrl,
  registerDesign,
  scrubSecrets,
} from "./analytics";

function exceptionEvent(list: unknown): CaptureResult {
  return {
    uuid: "test",
    event: "$exception",
    properties: { $exception_list: list },
  } as CaptureResult;
}

describe("isStacklessThirdPartyException", () => {
  test("drops a synthetic exception with no stack frames", () => {
    const event = exceptionEvent([
      {
        type: "NetworkError",
        value: "Failed to execute 'importScripts' on 'WorkerGlobalScope'",
        mechanism: { synthetic: true, handled: false },
      },
    ]);
    expect(isStacklessThirdPartyException(event)).toBe(true);
  });

  test("drops a synthetic exception whose stacktrace has an empty frame list", () => {
    const event = exceptionEvent([
      { mechanism: { synthetic: true }, stacktrace: { frames: [] } },
    ]);
    expect(isStacklessThirdPartyException(event)).toBe(true);
  });

  test("keeps a synthetic exception that still carries frames", () => {
    const event = exceptionEvent([
      {
        mechanism: { synthetic: true },
        stacktrace: { frames: [{ filename: "app.js", lineno: 1 }] },
      },
    ]);
    expect(isStacklessThirdPartyException(event)).toBe(false);
  });

  test("keeps a real error with frames", () => {
    const event = exceptionEvent([
      {
        mechanism: { synthetic: false },
        stacktrace: { frames: [{ filename: "app.js", lineno: 1 }] },
      },
    ]);
    expect(isStacklessThirdPartyException(event)).toBe(false);
  });

  test("keeps the event when any exception in the list is symbolicated", () => {
    const event = exceptionEvent([
      { mechanism: { synthetic: true } },
      { stacktrace: { frames: [{ filename: "app.js", lineno: 1 }] } },
    ]);
    expect(isStacklessThirdPartyException(event)).toBe(false);
  });

  test("ignores non-exception events", () => {
    const event = {
      uuid: "test",
      event: "agent_randomized",
      properties: {},
    } as CaptureResult;
    expect(isStacklessThirdPartyException(event)).toBe(false);
  });

  test("ignores an exception event with an empty list", () => {
    expect(isStacklessThirdPartyException(exceptionEvent([]))).toBe(false);
  });
});

describe("redactUrl", () => {
  test("hides the share payload", () => {
    expect(
      redactUrl("https://www.valorantpicker.com/share/squad?d=AbC-1_x&utm=a"),
    ).toBe("https://www.valorantpicker.com/share/squad?d=REDACTED&utm=a");
    expect(redactUrl("https://www.valorantpicker.com/?x=1&d=AbC#top")).toBe(
      "https://www.valorantpicker.com/?x=1&d=REDACTED#top",
    );
  });

  test("leaves look-alike params alone", () => {
    const url = "https://www.valorantpicker.com/?id=1&dd=2&ad=3";
    expect(redactUrl(url)).toBe(url);
  });
});

describe("scrubSecrets", () => {
  test("redacts links in any string property", () => {
    const properties = {
      $current_url: "https://www.valorantpicker.com/share/squad?d=SECRET",
      $referrer: "https://www.valorantpicker.com/squad?d=SECRET",
      label: "Share squad",
      count: 3,
    };
    scrubSecrets(properties);
    expect(properties.$current_url).toBe(
      "https://www.valorantpicker.com/share/squad?d=REDACTED",
    );
    expect(properties.$referrer).not.toContain("SECRET");
    expect(properties.label).toBe("Share squad");
    expect(properties.count).toBe(3);
  });

  test("redacts URLs inside nested payloads such as exception lists", () => {
    const url = "https://www.valorantpicker.com/share/agent?d=SECRET";
    const properties: Record<string, unknown> = {
      $set_once: { $initial_current_url: url },
      $exception_list: [
        {
          value: `Failed at ${url}`,
          stacktrace: { frames: [{ filename: url }] },
        },
      ],
    };
    // Cycles must not hang the scrubber.
    properties.self = properties;
    scrubSecrets(properties);
    expect(JSON.stringify({ ...properties, self: undefined })).not.toContain(
      "SECRET",
    );
  });
});

describe("createSampler", () => {
  /** A random source that replays `values`, for deterministic tests. */
  function replay(values: number[]): () => number {
    let i = 0;
    return () => values[i++];
  }

  test("always sends the first occurrence, with weight 1", () => {
    const sample = createSampler(10, () => 0.99);
    expect(sample()).toEqual({ sample_weight: 1, page_occurrence: 1 });
    expect(sample()).toBeNull();
  });

  test("keeps later occurrences with probability 1/every, weighted by the interval", () => {
    // 0.05 * 10 < 1 is kept; 0.1 * 10 = 1 is the first value dropped.
    const sample = createSampler(10, replay([0.05, 0.1, 0.0999, 0.5]));
    expect([sample(), sample(), sample(), sample(), sample()]).toEqual([
      { sample_weight: 1, page_occurrence: 1 },
      { sample_weight: 10, page_occurrence: 2 },
      null,
      { sample_weight: 10, page_occurrence: 4 },
      null,
    ]);
  });

  test("weights sum to about the true count, even for short visits", () => {
    // Many 8-roll visits: a fixed stride would report 1 roll for each.
    let total = 0;
    const visits = 20_000;
    for (let v = 0; v < visits; v++) {
      const sample = createSampler(10);
      for (let roll = 0; roll < 8; roll++)
        total += sample()?.sample_weight ?? 0;
    }
    expect(total / visits).toBeGreaterThan(7.6);
    expect(total / visits).toBeLessThan(8.4);
  });

  test("an interval of one sends everything", () => {
    const sample = createSampler(1);
    expect([sample(), sample()]).toEqual([
      { sample_weight: 1, page_occurrence: 1 },
      { sample_weight: 1, page_occurrence: 2 },
    ]);
  });
});

describe("agentPoolProps", () => {
  test("counts every role and lists the pool's keys", () => {
    const all = getAllAgents();
    const props = agentPoolProps(all);
    expect(props.pool_size).toBe(all.length);
    expect(props.pool_agent_keys).toEqual(all.map((agent) => agent.key));
    expect(
      props.pool_controller +
        props.pool_duelist +
        props.pool_initiator +
        props.pool_sentinel,
    ).toBe(all.length);
  });

  test("an empty pool is all zeros", () => {
    expect(agentPoolProps([])).toEqual({
      pool_size: 0,
      pool_agent_keys: [],
      pool_controller: 0,
      pool_duelist: 0,
      pool_initiator: 0,
      pool_sentinel: 0,
    });
  });
});

describe("presetKind and builtinId", () => {
  test("built-in presets report their stable id", () => {
    expect(presetKind("default:starter")).toBe("builtin");
    expect(builtinId("default:starter")).toBe("starter");
  });

  test("custom presets keep their id to themselves", () => {
    const id = "6f1c1b7e-1e0a-4b8e-9f11-2b5d1d0c9a77";
    expect(presetKind(id)).toBe("custom");
    expect(builtinId(id)).toBeUndefined();
  });
});

describe("designForChoice", () => {
  test("reports the visitor's own choice as chosen", () => {
    expect(designForChoice({ design: "refresh", chosen: true })).toEqual({
      design: "refresh",
      origin: "chosen",
    });
  });

  test("reports the build's default as the default", () => {
    expect(designForChoice({ design: "classic", chosen: false })).toEqual({
      design: "classic",
      origin: "default",
    });
  });
});

describe("beforeDesignChange", () => {
  test("flushes held-back events before the design changes, until unsubscribed", () => {
    const flush = vi.fn();
    const unsubscribe = beforeDesignChange(flush);
    registerDesign("refresh", "chosen");
    expect(flush).toHaveBeenCalledTimes(1);
    unsubscribe();
    registerDesign("classic", "chosen");
    expect(flush).toHaveBeenCalledTimes(1);
  });
});
