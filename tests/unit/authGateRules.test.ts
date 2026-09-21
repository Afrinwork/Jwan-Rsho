import test from "node:test";
import assert from "node:assert/strict";

import { resolveAuthRedirect } from "@/src/components/layout/authGateRules";
import { routes } from "@/src/constants/routes";

test("signed out user outside the auth group is sent to login", () => {
  assert.equal(
    resolveAuthRedirect({ isAuthenticated: false, canAccessAdminArea: false, firstSegment: "(tabs)", isDriver: false }),
    routes.login,
  );
});

test("signed out user already on an auth screen is left alone", () => {
  assert.equal(resolveAuthRedirect({ isAuthenticated: false, canAccessAdminArea: false, firstSegment: "(auth)", isDriver: false }), null);
});

test("signed in user lingering on an auth screen is sent to the app", () => {
  assert.equal(
    resolveAuthRedirect({ isAuthenticated: true, canAccessAdminArea: false, firstSegment: "(auth)", isDriver: false }),
    routes.overview,
  );
});

test("driver opening the admin area directly is redirected away", () => {
  assert.equal(
    resolveAuthRedirect({ isAuthenticated: true, canAccessAdminArea: false, firstSegment: "admin", isDriver: true }),
    routes.map,
  );
});

test("admin or super_admin is allowed to stay in the admin area", () => {
  assert.equal(resolveAuthRedirect({ isAuthenticated: true, canAccessAdminArea: true, firstSegment: "admin", isDriver: false }), null);
});

test("driver is sent to the map after login and cannot open admin tabs", () => {
  assert.equal(
    resolveAuthRedirect({ isAuthenticated: true, canAccessAdminArea: false, firstSegment: "(auth)", isDriver: true }),
    routes.map,
  );
  assert.equal(
    resolveAuthRedirect({ isAuthenticated: true, canAccessAdminArea: false, firstSegment: "(tabs)", secondSegment: "overview", isDriver: true }),
    routes.map,
  );
  assert.equal(
    resolveAuthRedirect({ isAuthenticated: true, canAccessAdminArea: false, firstSegment: "(tabs)", secondSegment: "map", isDriver: true }),
    null,
  );
});
