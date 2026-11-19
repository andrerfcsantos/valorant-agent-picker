import { describe, expect, test } from "vite-plus/test";

import { sanitizePageLocation } from "./analytics";

describe("sanitizePageLocation", () => {
  test("drops the share payload", () => {
    expect(
      sanitizePageLocation(
        "https://www.valorantpicker.com/share/squad?d=AbC-1_x",
      ),
    ).toBe("https://www.valorantpicker.com/share/squad");
  });

  test("keeps other query parameters", () => {
    expect(
      sanitizePageLocation(
        "https://www.valorantpicker.com/squad?utm_source=discord&d=AbC&utm_medium=social",
      ),
    ).toBe(
      "https://www.valorantpicker.com/squad?utm_source=discord&utm_medium=social",
    );
  });

  test("drops the fragment", () => {
    expect(
      sanitizePageLocation("https://www.valorantpicker.com/about#d=AbC"),
    ).toBe("https://www.valorantpicker.com/about");
  });

  test("leaves a plain URL unchanged", () => {
    expect(sanitizePageLocation("https://www.valorantpicker.com/")).toBe(
      "https://www.valorantpicker.com/",
    );
  });
});
