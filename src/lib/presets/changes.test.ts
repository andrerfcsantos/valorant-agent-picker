import { describe, expect, test } from "vite-plus/test";

import { presetChanges } from "./changes";

describe("presetChanges", () => {
  test("finds the agents added and removed, in their own order", () => {
    expect(presetChanges(["a", "b", "c"], ["c", "d", "a"])).toEqual({
      added: ["d"],
      removed: ["b"],
    });
  });

  test("finds nothing when only the order differs", () => {
    expect(presetChanges(["a", "b"], ["b", "a"])).toEqual({
      added: [],
      removed: [],
    });
  });
});
