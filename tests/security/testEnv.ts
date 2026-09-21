import { readFileSync } from "node:fs";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";

export function createTestEnv(projectId: string, options?: { withStorage?: boolean }) {
  return initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync("firebase/firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
    ...(options?.withStorage
      ? {
          storage: {
            rules: readFileSync("firebase/storage.rules", "utf8"),
            host: "127.0.0.1",
            port: 9199,
          },
        }
      : {}),
  });
}
