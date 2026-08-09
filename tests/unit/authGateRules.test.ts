import test from "node:test";
import assert from "node:assert/strict";

import { resolveAuthRedirect } from "@/src/components/layout/authGateRules";
import { routes } from "@/src/constants/routes";

test("signed out user outside the auth group is sent to login", () => {
  assert.equal(
    resolveAuthRedirect({ isAuthenticated: false, isAdmin: false, firstSegment: "(tabs)" }),
    routes.login,
  );
});

test("signed out user already on an auth screen is left alone", () => {
  assert.equal(resolveAuthRedirect({ isAuthenticated: false, isAdmin: false, firstSegment: "(auth)" }), null);
});

test("signed in user lingering on an auth screen is sent to the app", () => {
  assert.equal(
    resolveAuthRedirect({ isAuthenticated: true, isAdmin: false, firstSegment: "(auth)" }),
    routes.overview,
  );
});

test("normal user opening the admin area directly is redirected away", () => {
  assert.equal(
    resolveAuthRedirect({ isAuthenticated: true, isAdmin: false, firstSegment: "admin" }),
    routes.overview,
  );
});

test("admin user is allowed to stay in the admin area", () => {
  assert.equal(resolveAuthRedirect({ isAuthenticated: true, isAdmin: true, firstSegment: "admin" }), null);
});

test("normal user browsing regular tabs is left alone", () => {
  assert.equal(resolveAuthRedirect({ isAuthenticated: true, isAdmin: false, firstSegment: "(tabs)" }), null);
});
