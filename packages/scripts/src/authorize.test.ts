import { test } from "node:test";
import assert from "node:assert/strict";
import { authorizeExecution, sha256Hex, validateParameters } from "./authorize.ts";
import type { AllowlistedScript } from "./types.ts";

const CONTENT = "(gimp-image-flatten image)";

function makeScript(over: Partial<AllowlistedScript> = {}): AllowlistedScript {
  return {
    id: "gimp.test",
    name: "Test",
    description: "",
    engine: "gimp-script-fu",
    sha256: sha256Hex(CONTENT),
    capabilities: { readInput: true, writeOutput: true, network: false, filesystemBeyondWorkdir: false },
    risk: "low",
    requiresAdminApproval: false,
    audited: { by: "test", date: "2024-01-01" },
    parameters: [],
    ...over,
  };
}

test("refuse si le contenu ne correspond pas au hash audité", () => {
  const d = authorizeExecution({
    script: makeScript(),
    content: "(evil-payload)",
    userRoles: ["execute"],
    userConfirmed: true,
    adminApproved: false,
  });
  assert.equal(d.allowed, false);
  assert.match(d.reason, /hash non concordant/);
});

test("refuse si rôle insuffisant", () => {
  const d = authorizeExecution({
    script: makeScript(),
    content: CONTENT,
    userRoles: ["read"],
    userConfirmed: true,
    adminApproved: false,
  });
  assert.equal(d.allowed, false);
  assert.match(d.reason, /Rôle insuffisant/);
});

test("refuse sans confirmation explicite", () => {
  const d = authorizeExecution({
    script: makeScript(),
    content: CONTENT,
    userRoles: ["execute"],
    userConfirmed: false,
    adminApproved: false,
  });
  assert.equal(d.allowed, false);
  assert.equal(d.requiresConfirmation, true);
});

test("refuse script à validation admin sans approbation", () => {
  const d = authorizeExecution({
    script: makeScript({ risk: "high", requiresAdminApproval: true }),
    content: CONTENT,
    userRoles: ["execute"],
    userConfirmed: true,
    adminApproved: false,
  });
  assert.equal(d.allowed, false);
  assert.match(d.reason, /validation admin/);
});

test("autorise quand tout est réuni", () => {
  const d = authorizeExecution({
    script: makeScript(),
    content: CONTENT,
    userRoles: ["execute"],
    userConfirmed: true,
    adminApproved: false,
  });
  assert.equal(d.allowed, true);
});

test("un admin outrepasse l'exigence d'approbation admin", () => {
  const d = authorizeExecution({
    script: makeScript({ risk: "high", requiresAdminApproval: true }),
    content: CONTENT,
    userRoles: ["admin"],
    userConfirmed: true,
    adminApproved: false,
  });
  assert.equal(d.allowed, true);
});

test("validateParameters refuse un paramètre inconnu et hors bornes", () => {
  const r = validateParameters(
    { targetWidth: 99999, sneaky: 1 },
    [{ name: "targetWidth", type: "number", required: true, min: 16, max: 8192 }]
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /inconnu/.test(e)));
  assert.ok(r.errors.some((e) => /max/.test(e)));
});
