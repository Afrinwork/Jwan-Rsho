import { randomUUID } from "node:crypto";

import { App, getApps as getAdminApps, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

import { FirebaseApp, initializeApp as initializeClientApp } from "firebase/app";
import { Auth, connectAuthEmulator, getAuth as getClientAuth, signInWithEmailAndPassword } from "firebase/auth";
import { connectFunctionsEmulator, Functions, getFunctions, httpsCallable } from "firebase/functions";

const projectId = "demo-rsho-test";

let adminApp: App | null = null;

function getAdminApp() {
  if (!adminApp) {
    adminApp = getAdminApps()[0] ?? initializeAdminApp({ projectId });
  }
  return adminApp;
}

export function adminAuth() {
  return getAdminAuth(getAdminApp());
}

export function adminFirestore() {
  return getAdminFirestore(getAdminApp());
}

export function uniqueId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

export type ClientSession = {
  app: FirebaseApp;
  auth: Auth;
  functions: Functions;
};

let sessionCounter = 0;

export async function createTestUser(role: "user" | "admin") {
  const email = `${uniqueId(role)}@example.com`;
  const password = "Test1234!";
  const created = await adminAuth().createUser({ email, password, displayName: role });
  await adminFirestore().collection("users").doc(created.uid).set({
    role,
    fullName: role,
    isActive: true,
  });
  return { uid: created.uid, email, password };
}

export async function signInAsClient(email: string, password: string): Promise<ClientSession> {
  sessionCounter += 1;
  const app = initializeClientApp({ projectId, apiKey: "demo-api-key" }, `client-${sessionCounter}`);
  const auth = getClientAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const functions = getFunctions(app);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  await signInWithEmailAndPassword(auth, email, password);
  return { app, auth, functions };
}

export function callCreateUser(session: ClientSession, data: unknown) {
  return httpsCallable(session.functions, "createUser")(data);
}

export function callDeleteUser(session: ClientSession, data: unknown) {
  return httpsCallable(session.functions, "deleteUser")(data);
}

export function callDeleteUserData(session: ClientSession, data: unknown) {
  return httpsCallable(session.functions, "deleteUserData")(data);
}

export function callGetActiveUserCount(session: ClientSession) {
  return httpsCallable(session.functions, "getActiveUserCount")();
}
