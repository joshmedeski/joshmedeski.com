import { describe, it, expect } from "vitest";
import { verifyValidEmail } from "./create-new-subscriber";

describe("verifyValidEmail", () => {
  it("should be an invalid email", () => {
    expect(() =>
      verifyValidEmail("invalid-email")
    ).toThrowErrorMatchingInlineSnapshot('"Email is invalid"');
  });
  it("should be an valid email", () => {
    expect(verifyValidEmail("example@example.com")).toBe("example@example.com");
  });
});
