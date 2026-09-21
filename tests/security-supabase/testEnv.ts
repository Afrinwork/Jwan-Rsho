// Test harness for the Postgres RLS policies in supabase/migrations,
// run against a local `supabase start` stack (see package.json's
// test:security-supabase script). Lives alongside tests/security/*
// rather than replacing it -- both the Firestore and Postgres rule
// suites stay green until the Firebase side is decommissioned (Stage 9
// of the migration plan).
//
// Unlike the Firestore emulator's authenticatedContext(uid) helper,
// Postgres RLS checks auth.uid() against real rows in auth.users (the
// profiles table has an FK to it) -- so "acting as a user" here means
// actually creating a real local Auth account and signing in as them,
// not just crafting a JWT with an arbitrary uid.
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";

import type { Database } from "@/src/types/supabase";

// Node 20 (this project's test runtime) has no stable native WebSocket;
// supabase-js's realtime client needs one even when a test never
// actually opens a channel, since it's constructed eagerly by
// createClient(). Not an issue in the RN app itself (Hermes/RN provide
// WebSocket natively).
const clientOptions = { auth: { autoRefreshToken: false, persistSession: false }, realtime: { transport: WebSocket as never } };

const API_URL = "http://127.0.0.1:54321";
// Fixed local-dev demo keys `supabase start` always prints for a fresh
// project -- not secrets, safe in a test file (never valid against the
// real project).
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

export const adminClient: SupabaseClient<Database> = createClient(API_URL, SERVICE_ROLE_KEY, clientOptions);

export type Role = "super_admin" | "admin" | "driver";

let seedCounter = 0;

// Creates a real local Auth user + profiles row (service-role, bypasses
// RLS -- equivalent to the Firestore harness's withSecurityRulesDisabled
// seeding), then returns a client signed in as that user for exercising
// RLS from their perspective.
export async function createTestUser(role: Role, managerId?: string) {
  seedCounter += 1;
  const email = `test-user-${Date.now()}-${seedCounter}@example.test`;
  const password = "test-password-1234";

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    throw new Error(`Failed to create test auth user: ${createError?.message}`);
  }

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: created.user.id,
    email,
    full_name: email,
    role,
    manager_id: managerId ?? null,
    is_active: true,
  });
  if (profileError) {
    throw new Error(`Failed to seed profile: ${profileError.message}`);
  }

  const client: SupabaseClient<Database> = createClient(API_URL, ANON_KEY, clientOptions);
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) {
    throw new Error(`Failed to sign in test user: ${signInError.message}`);
  }

  return { id: created.user.id, email, client };
}

export function anonClient(): SupabaseClient<Database> {
  return createClient(API_URL, ANON_KEY, clientOptions);
}

// No global reset-between-tests here (unlike the Firestore harness's
// clearFirestore()): every test creates its own uniquely-emailed users
// (see createTestUser above) and uniquely-id'd rows, so tests can't
// collide with each other's data without needing a shared teardown --
// and adding a test-only "wipe everything" RPC would mean either
// shipping test-only surface in a real migration or maintaining a
// second, never-pushed-to-remote seed script for one helper. The local
// stack itself is fully disposable (`supabase stop`/`start` wipes it).
