# CODEX MASTER PROMPT

Read this file completely before making code changes.

Core rules:

1. Check the existing structure first.
2. Keep the architecture simple and feature-oriented.
3. Avoid duplicate logic and parallel structures.
4. Implement only the next small, production-ready step.
5. Protect data ownership and admin-only behavior.

Product constraints:

- iPhone only
- React Native + Expo + TypeScript
- Expo Router is the main navigation system
- Firebase Authentication, Firestore, and Cloud Functions
- No public registration
- Exactly two roles: `admin` and `user`
- User-owned records must use `ownerId`
- Firestore Security Rules must enforce data separation

Engineering constraints:

- Keep route files thin
- Keep files small
- Avoid God components and God services
- Prefer feature folders under `src/features`
- Keep Firebase admin code out of the Expo app
- Choose the simplest solution that stays reliable
