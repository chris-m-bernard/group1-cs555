import { describe, it, expect, beforeEach } from "vitest";
import { signIn, signOut, getSession } from "./auth";

describe("sign_in user story", () => {
  beforeEach(() => {
    signOut();
  });

  it("should sign in successfully with correct credentials", async () => {
    const result = await signIn("alice@example.com", "password123");
    expect(result.user.email).toBe("alice@example.com");

    const session = getSession();
    expect(session).not.toBeNull();
    expect(session!.user.email).toBe("alice@example.com");
  });

  it("should throw an error for invalid credentials", async () => {
    await expect(signIn("alice@example.com", "wrong")).rejects.toThrow(
      "Invalid email or password"
    );
  });
});
