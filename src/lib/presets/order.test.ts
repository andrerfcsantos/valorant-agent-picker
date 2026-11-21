import { describe, expect, test } from "vite-plus/test";

import { insertAfter, restoreBuiltIns } from "./order";
import { SavedPreset } from "./types";

const preset = (id: string, name = id, agents: string[] = []): SavedPreset => ({
  id,
  name,
  agents,
});

const ids = (presets: SavedPreset[]) => presets.map((p) => p.id);

describe("insertAfter", () => {
  test("puts the preset just below the one it sat under", () => {
    const list = [preset("a"), preset("c")];
    expect(ids(insertAfter(list, preset("b"), "a"))).toEqual(["a", "b", "c"]);
  });

  test("puts the preset at the top when it had nothing above it", () => {
    const list = [preset("b"), preset("c")];
    expect(ids(insertAfter(list, preset("a"), null))).toEqual(["a", "b", "c"]);
  });

  test("puts the preset at the top when the one above it is gone too", () => {
    const list = [preset("b")];
    expect(ids(insertAfter(list, preset("a"), "gone"))).toEqual(["a", "b"]);
  });

  test("keeps the visitor's version over a restored stock one", () => {
    // Ranked was renamed, deleted, restored as the stock version at the end
    // of the list, and then the delete was undone.
    const mine = preset("default:ranked", "My ranked", ["ana"]);
    const stock = preset("default:ranked", "Ranked", ["ana", "zarya"]);
    const list = [preset("first"), preset("second"), stock];

    const result = insertAfter(list, mine, "first");

    expect(ids(result)).toEqual(["first", "default:ranked", "second"]);
    expect(result[1]).toBe(mine);
  });

  test("counts its place without the copy it replaces", () => {
    const stock = preset("x", "stock");
    const mine = preset("x", "mine");
    const list = [stock, preset("a"), preset("b")];
    expect(ids(insertAfter(list, mine, "a"))).toEqual(["a", "x", "b"]);
  });

  test("does not change the list it was given", () => {
    const list = [preset("a")];
    insertAfter(list, preset("b"), "a");
    expect(ids(list)).toEqual(["a"]);
  });
});

describe("restoreBuiltIns", () => {
  const stock = [
    preset("default:ranked", "Ranked", ["ana", "zarya"]),
    preset("default:tank", "Tank", ["zarya"]),
  ];

  test("adds every missing built-in at the end, as stock", () => {
    const list = [preset("mine")];
    expect(restoreBuiltIns(list, stock, null)).toEqual([
      preset("mine"),
      ...stock,
    ]);
  });

  test("brings a built-in deleted just now back as it was, in its place", () => {
    // Ranked was renamed, then deleted from under "first".
    const mine = preset("default:ranked", "My ranked", ["ana"]);
    const list = [preset("first"), preset("second")];

    const result = restoreBuiltIns(list, stock, {
      preset: mine,
      afterId: "first",
    });

    expect(ids(result)).toEqual([
      "first",
      "default:ranked",
      "second",
      "default:tank",
    ]);
    expect(result[1]).toBe(mine);
  });

  test("ignores a deleted preset that is not a built-in", () => {
    const list = [preset("first")];
    const result = restoreBuiltIns(list, stock, {
      preset: preset("custom"),
      afterId: null,
    });
    expect(ids(result)).toEqual(["first", "default:ranked", "default:tank"]);
  });

  test("leaves a list that has every built-in as it is", () => {
    const list = [...stock];
    expect(restoreBuiltIns(list, stock, null)).toBe(list);
  });
});
