import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("mergeia classes Tailwind conflituosas pela última", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("combina variantes condicionais", () => {
    expect(cn("base", false && "hidden", true && "block")).toBe("base block");
  });
});
