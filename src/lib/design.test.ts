import { describe, expect, test } from "vite-plus/test";

import {
  DEFAULT_DESIGN,
  DESIGN_BOOT_SCRIPT,
  DESIGN_STORAGE_KEY,
  isDesign,
  readDesignChoice,
  storeDesign,
} from "./design";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}

const throwingStorage = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
};

describe("isDesign", () => {
  test("accepts the two designs and nothing else", () => {
    expect(isDesign("classic")).toBe(true);
    expect(isDesign("refresh")).toBe(true);
    expect(isDesign("Refresh")).toBe(false);
    expect(isDesign("")).toBe(false);
    expect(isDesign(null)).toBe(false);
    expect(isDesign(undefined)).toBe(false);
  });
});

describe("DEFAULT_DESIGN", () => {
  test("is the new design unless the build says otherwise", () => {
    expect(process.env.NEXT_PUBLIC_DEFAULT_DESIGN).toBeUndefined();
    expect(DEFAULT_DESIGN).toBe("refresh");
  });
});

describe("readDesignChoice", () => {
  test("falls back to the default, unchosen, when nothing is stored", () => {
    expect(readDesignChoice(memoryStorage())).toEqual({
      design: DEFAULT_DESIGN,
      chosen: false,
    });
  });

  test("returns a stored design as the visitor's own choice", () => {
    const storage = memoryStorage({ [DESIGN_STORAGE_KEY]: "refresh" });
    expect(readDesignChoice(storage)).toEqual({
      design: "refresh",
      chosen: true,
    });
  });

  test("ignores a stored value that is not a design", () => {
    const storage = memoryStorage({ [DESIGN_STORAGE_KEY]: "neon" });
    expect(readDesignChoice(storage)).toEqual({
      design: DEFAULT_DESIGN,
      chosen: false,
    });
  });

  test("survives storage that throws or is missing", () => {
    expect(readDesignChoice(throwingStorage)).toEqual({
      design: DEFAULT_DESIGN,
      chosen: false,
    });
    expect(readDesignChoice(null)).toEqual({
      design: DEFAULT_DESIGN,
      chosen: false,
    });
  });
});

describe("storeDesign", () => {
  test("round-trips through readDesignChoice", () => {
    const storage = memoryStorage();
    storeDesign("refresh", storage);
    expect(readDesignChoice(storage)).toEqual({
      design: "refresh",
      chosen: true,
    });
    storeDesign("classic", storage);
    expect(readDesignChoice(storage)).toEqual({
      design: "classic",
      chosen: true,
    });
  });

  test("does not throw when storage does, or when there is none", () => {
    expect(() => storeDesign("refresh", throwingStorage)).not.toThrow();
    expect(() => storeDesign("refresh", null)).not.toThrow();
  });
});

describe("DESIGN_BOOT_SCRIPT", () => {
  // The script duplicates readDesignChoice for the moment before any module
  // has loaded, so it is run here against the same cases.
  function boot(stored: string | null, storageThrows = false) {
    const dataset: Record<string, string> = {};
    const document = { documentElement: { dataset } };
    const localStorage = {
      getItem: () => {
        if (storageThrows) throw new Error("blocked");
        return stored;
      },
    };
    // oxlint-disable-next-line typescript/no-implied-eval -- the script ships as a string for an inline <script>, so running that string is the test
    new Function("document", "localStorage", DESIGN_BOOT_SCRIPT)(
      document,
      localStorage,
    );
    return { design: dataset.design };
  }

  test("stamps the stored design on the document", () => {
    expect(boot("refresh").design).toBe("refresh");
    expect(boot("classic").design).toBe("classic");
  });

  test("falls back to the default for missing, unknown or blocked storage", () => {
    expect(boot(null).design).toBe(DEFAULT_DESIGN);
    expect(boot("neon").design).toBe(DEFAULT_DESIGN);
    expect(boot(null, true).design).toBe(DEFAULT_DESIGN);
  });
});
