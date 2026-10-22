import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createInviteCode, createSessionToken, hashPassword, normalizeEmail, parseCookies, verifyPassword } from "../server/auth.ts";

describe("authentication helpers", () => {
  it("normalizes email addresses", () => assert.equal(normalizeEmail("  Rodina@Example.CZ "), "rodina@example.cz"));
  it("hashes and verifies passwords without storing plaintext", async () => { const result = await hashPassword("bezpecne-heslo"); assert.notEqual(result.hash, "bezpecne-heslo"); assert.equal(await verifyPassword("bezpecne-heslo", result.salt, result.hash), true); assert.equal(await verifyPassword("spatne-heslo", result.salt, result.hash), false); });
  it("creates unpredictable session tokens", () => { const first = createSessionToken(); const second = createSessionToken(); assert.notEqual(first.token, second.token); assert.notEqual(first.token, first.hash); });
  it("creates compact invite codes", () => assert.match(createInviteCode(), /^[A-Z0-9_-]{8}$/));
  it("parses cookies", () => assert.deepEqual(parseCookies("a=1; spajzka_session=abc%201"), { a: "1", spajzka_session: "abc 1" }));
});
